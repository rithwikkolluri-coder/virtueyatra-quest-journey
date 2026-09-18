import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, BellRing, Loader2, Bell, BellOff, Phone, Globe, Clock, Timer, WifiOff, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LatLng { lat: number; lng: number; }

const ALERT_RADIUS_M = 500;
const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

const haversine = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const bearingBetween = (a: LatLng, b: LatLng) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
};

const STORAGE_KEY = "virtueyatra.tripmap.destination";
const STOPS_KEY = "virtueyatra.tripmap.stops";
const RECENTS_KEY = "virtueyatra.tripmap.recents";

interface Stop { name: string; address?: string; lat: number; lng: number; }

const destKey = (d: LatLng) => `${d.lat.toFixed(3)},${d.lng.toFixed(3)}`;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

const playAlarm = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.5, 1].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now + t);
      osc.frequency.setValueAtTime(660, now + t + 0.15);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.4, now + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.45);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.error("alarm error", e);
  }
};

// Load Google Maps JS API once
let mapsLoadPromise: Promise<void> | null = null;
const loadGoogleMaps = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Google Maps browser key missing"));

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    (window as any).__initGoogleMaps = () => resolve();
    const script = document.createElement("script");
    const channel = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initGoogleMaps${channel}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
};

interface Suggestion { id: string; primary: string; secondary: string; prediction: any; }

const TripMap = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<(LatLng & { label: string }) | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [alertsOn, setAlertsOn] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeTimeMin, setRouteTimeMin] = useState<number | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [recents, setRecents] = useState<(LatLng & { label: string })[]>(() =>
    readJson<(LatLng & { label: string })[]>(RECENTS_KEY, [])
  );
  const [placeDetails, setPlaceDetails] = useState<{
    address?: string;
    phone?: string;
    website?: string;
    hours?: string[];
    openNow?: boolean;
  } | null>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const destCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const attractionMarkersRef = useRef<any[]>([]);
  const attractionInfoRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const watchId = useRef<number | null>(null);
  const alertedRef = useRef(false);

  // Online/offline awareness
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => {
      setOnline(false);
      setSuggestions([]);
      setShowSuggestions(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Persist destination so it survives reloads / offline use
  useEffect(() => {
    try {
      if (destination) localStorage.setItem(STORAGE_KEY, JSON.stringify(destination));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, [destination]);

  // Keep a small offline library of recent destinations + their saved stops
  useEffect(() => {
    if (!destination) return;
    setRecents((prev) => {
      const next = [destination, ...prev.filter((r) => destKey(r) !== destKey(destination))].slice(0, 8);
      writeJson(RECENTS_KEY, next);
      return next;
    });
    const cache = readJson<Record<string, Stop[]>>(STOPS_KEY, {});
    setStops(cache[destKey(destination)] ?? []);
  }, [destination]);

  // Init map (needs network)
  useEffect(() => {
    if (!online || mapRef.current) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const g = (window as any).google;
        mapRef.current = new g.maps.Map(mapDivRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        setMapReady(true);
      })
      .catch((e) => {
        console.error(e);
      });
    return () => { cancelled = true; };
  }, [toast, online]);

  // Update destination marker + circle
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = (window as any).google;
    if (!destination) {
      destMarkerRef.current?.setMap(null);
      destCircleRef.current?.setMap(null);
      destMarkerRef.current = null;
      destCircleRef.current = null;
      return;
    }
    const pos = { lat: destination.lat, lng: destination.lng };
    if (!destMarkerRef.current) {
      destMarkerRef.current = new g.maps.Marker({ map: mapRef.current, position: pos, title: destination.label });
    } else {
      destMarkerRef.current.setPosition(pos);
      destMarkerRef.current.setTitle(destination.label);
    }
    if (!destCircleRef.current) {
      destCircleRef.current = new g.maps.Circle({
        map: mapRef.current,
        center: pos,
        radius: ALERT_RADIUS_M,
        strokeColor: "#f59e0b",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#f59e0b",
        fillOpacity: 0.15,
      });
    } else {
      destCircleRef.current.setCenter(pos);
    }
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(14);
  }, [destination, mapReady]);

  // Load nearby itinerary places (top attractions) for the selected destination
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = (window as any).google;

    // Clear previous attraction markers and route polyline
    attractionMarkersRef.current.forEach((m) => m.setMap(null));
    attractionMarkersRef.current = [];
    routePolylineRef.current?.setMap(null);
    routePolylineRef.current = null;
    setRouteDistance(null);
    setRouteTimeMin(null);
    attractionInfoRef.current?.close?.();

    if (!destination) return;

    let cancelled = false;
    (async () => {
      try {
        const { Place } = await g.maps.importLibrary("places");
        const { results } = await Place.searchByText({
          textQuery: `top tourist attractions in ${destination.label.split(",")[0]}`,
          fields: ["id", "displayName", "location", "formattedAddress", "types"],
          locationBias: {
            center: { lat: destination.lat, lng: destination.lng },
            radius: 25000,
          },
          maxResultCount: 10,
          region: "in",
        });
        if (cancelled || !results?.length) return;

        // Save stops for offline use
        const offlineStops: Stop[] = results
          .filter((p: any) => p.location)
          .map((p: any) => ({
            name: String(p.displayName ?? ""),
            address: p.formattedAddress ?? undefined,
            lat: p.location.lat(),
            lng: p.location.lng(),
          }));
        setStops(offlineStops);
        const cache = readJson<Record<string, Stop[]>>(STOPS_KEY, {});
        cache[destKey(destination)] = offlineStops;
        writeJson(STOPS_KEY, cache);

        const info = new g.maps.InfoWindow();
        attractionInfoRef.current = info;
        const bounds = new g.maps.LatLngBounds();
        bounds.extend({ lat: destination.lat, lng: destination.lng });

        results.forEach((p: any, i: number) => {
          if (!p.location) return;
          const pos = { lat: p.location.lat(), lng: p.location.lng() };
          const marker = new g.maps.Marker({
            map: mapRef.current,
            position: pos,
            title: p.displayName,
            label: { text: String(i + 1), color: "#ffffff", fontSize: "12px", fontWeight: "600" },
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#0ea5e9",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => {
            info.setContent(
              `<div style="font-size:13px;max-width:220px">
                 <strong>${p.displayName ?? ""}</strong><br/>
                 <span style="color:#666">${p.formattedAddress ?? ""}</span>
               </div>`
            );
            info.open({ map: mapRef.current, anchor: marker });
          });
          attractionMarkersRef.current.push(marker);
          bounds.extend(pos);
        });

        mapRef.current.fitBounds(bounds, 60);

        // Draw a route polyline connecting destination → attractions in order
        const path = [
          { lat: destination.lat, lng: destination.lng },
          ...attractionMarkersRef.current.map((m) => m.getPosition().toJSON()),
        ];
        routePolylineRef.current = new g.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: "#0ea5e9",
          strokeOpacity: 0.7,
          strokeWeight: 3,
          icons: [
            {
              icon: { path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 1 },
              offset: "100%",
              repeat: "60px",
            },
          ],
        });
        routePolylineRef.current.setMap(mapRef.current);

        // Compute total straight-line distance and estimate road distance + time
        const allPoints = path;
        let totalM = 0;
        for (let i = 1; i < allPoints.length; i++) {
          totalM += haversine(allPoints[i - 1], allPoints[i]);
        }
        const roadDistanceM = totalM * 1.3; // rough road-distance multiplier
        const avgSpeedKmh = 35; // tourist driving in India (mixed roads)
        const timeMin = (roadDistanceM / 1000 / avgSpeedKmh) * 60;
        setRouteDistance(roadDistanceM);
        setRouteTimeMin(timeMin);
      } catch (e) {
        console.error("nearby attractions error", e);
      }
    })();

    return () => { cancelled = true; };
  }, [destination, mapReady]);


  // Update user marker
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userPos) return;
    const g = (window as any).google;
    const pos = { lat: userPos.lat, lng: userPos.lng };
    if (!userMarkerRef.current) {
      userMarkerRef.current = new g.maps.Marker({
        map: mapRef.current,
        position: pos,
        title: "You are here",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    } else {
      userMarkerRef.current.setPosition(pos);
    }
  }, [userPos, mapReady]);

  // Fetch Places autocomplete suggestions (debounced)
  useEffect(() => {
    if (!mapReady || !online) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); return; }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const g = (window as any).google;
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await g.maps.importLibrary("places");
        if (!sessionTokenRef.current) sessionTokenRef.current = new AutocompleteSessionToken();
        const request: any = {
          input: q,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["in"],
        };
        if (destination) {
          request.locationBias = {
            center: { lat: destination.lat, lng: destination.lng },
            radius: 50000,
          };
        }
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const mapped: Suggestion[] = (results || [])
          .filter((s: any) => s.placePrediction)
          .map((s: any, i: number) => ({
            id: s.placePrediction.placeId || String(i),
            primary: s.placePrediction.mainText?.text || s.placePrediction.text?.text || "",
            secondary: s.placePrediction.secondaryText?.text || "",
            prediction: s.placePrediction,
          }));
        setSuggestions(mapped);
        setShowSuggestions(true);
      } catch (e) {
        console.error("autocomplete error", e);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, mapReady, destination]);

  const selectSuggestion = async (s: Suggestion) => {
    setShowSuggestions(false);
    setSearching(true);
    setPlaceDetails(null);
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({
        fields: [
          "location",
          "displayName",
          "formattedAddress",
          "internationalPhoneNumber",
          "nationalPhoneNumber",
          "websiteURI",
          "regularOpeningHours",
        ],
      });
      const loc = place.location;
      if (!loc) throw new Error("No location");
      const label = place.formattedAddress || place.displayName || s.primary;
      setDestination({ lat: loc.lat(), lng: loc.lng(), label });
      setQuery(label);
      alertedRef.current = false;
      sessionTokenRef.current = null; // end session after selection

      const hours = place.regularOpeningHours?.weekdayDescriptions as string[] | undefined;
      const websiteRaw = place.websiteURI as unknown;
      const website = typeof websiteRaw === "string" ? websiteRaw : websiteRaw?.toString?.();
      setPlaceDetails({
        address: place.formattedAddress || undefined,
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || undefined,
        website: website || undefined,
        hours,
        openNow: place.regularOpeningHours?.openNow,
      });

      toast({ title: "Destination set 📍", description: s.primary });
    } catch (e) {
      toast({ title: "Couldn't load place", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!online) {
      const q = query.trim().toLowerCase();
      const hit = q ? recents.find((r) => r.label.toLowerCase().includes(q)) : null;
      if (hit) {
        setDestination(hit);
        setQuery("");
        toast({ title: "Offline match", description: `Switched to your saved place: ${hit.label.split(",")[0]}` });
      } else {
        toast({
          title: "You're offline",
          description: "Only your saved places can be opened right now.",
          variant: "destructive",
        });
      }
      return;
    }
    if (!query.trim()) return;
    // If suggestions are available, pick the first one
    if (suggestions.length > 0) {
      await selectSuggestion(suggestions[0]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode", {
        body: { address: `${query.trim()}, India` },
      });
      if (error) throw error;
      const r = data?.result;
      if (!r) {
        toast({ title: "Not found", description: "Try a more specific place name.", variant: "destructive" });
        return;
      }
      setDestination({ lat: r.lat, lng: r.lng, label: r.label });
      setPlaceDetails({ address: r.label });
      alertedRef.current = false;
      toast({ title: "Destination set 📍", description: r.label.split(",").slice(0, 2).join(",") });
    } catch (e) {
      toast({ title: "Search failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Unavailable", description: "Geolocation not supported in this browser.", variant: "destructive" });
      return;
    }
    if (alertsOn && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => {
        toast({ title: "Location error", description: err.message, variant: "destructive" });
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setTracking(true);
    toast({ title: "Tracking started 🛰️", description: "We'll alert you 500m before arrival." });
  }, [alertsOn, toast, stopTracking]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  useEffect(() => {
    if (!destination || !userPos) return;
    const d = haversine(userPos, destination);
    setDistance(d);
    setBearing(bearingBetween(userPos, destination));
    if (alertsOn && d <= ALERT_RADIUS_M && !alertedRef.current) {
      alertedRef.current = true;
      playAlarm();
      toast({
        title: "🔔 Almost there!",
        description: `You're within ${Math.round(d)}m of ${destination.label.split(",")[0]}. Get ready!`,
      });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("VirtueYatra • Arriving soon", {
          body: `You're ${Math.round(d)}m from ${destination.label.split(",")[0]}.`,
          icon: "/favicon.ico",
        });
      }
    }
    if (d > ALERT_RADIUS_M * 2) alertedRef.current = false;
  }, [userPos, destination, alertsOn, toast]);

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 animate-slide-up">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Live Maps</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your <span className="gradient-text">Journey</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter your destination — we'll ring an alarm <strong>500 meters before</strong> you arrive. Never miss your stop again.
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-2xl">
          <div className="p-4 md:p-6 bg-card border-b border-border flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex gap-2 relative">
              <div className="flex-1 relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search a place (e.g. Charminar, Hyderabad)"
                  className="w-full"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-72 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground flex items-start gap-2 border-b border-border/40 last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{s.primary}</span>
                          {s.secondary && (
                            <span className="block text-xs text-muted-foreground truncate">{s.secondary}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleSearch} disabled={searching} className="bg-gradient-to-r from-primary to-travel-ocean">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tracking ? "destructive" : "default"}
                onClick={tracking ? stopTracking : startTracking}
                disabled={!destination}
                className={!tracking ? "bg-gradient-to-r from-secondary to-accent" : ""}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {tracking ? "Stop" : "Start tracking"}
              </Button>
              <Button variant="outline" onClick={() => setAlertsOn((v) => !v)} title="Toggle 500m alarm">
                {alertsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {(destination || distance !== null) && (
            <div className="px-4 md:px-6 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-4 text-sm">
              {destination && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate max-w-[300px]">{destination.label.split(",").slice(0, 3).join(", ")}</span>
                </span>
              )}
              {distance !== null && (
                <span className="flex items-center gap-2">
                  <BellRing className={`w-4 h-4 ${distance <= ALERT_RADIUS_M ? "text-secondary animate-pulse" : "text-muted-foreground"}`} />
                  <span>
                    {distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(2)} km`} away
                  </span>
                </span>
              )}
              {routeDistance !== null && (
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span>
                    {(routeDistance / 1000).toFixed(1)} km route
                  </span>
                </span>
              )}
              {routeTimeMin !== null && (
                <span className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <span>
                    {routeTimeMin < 60
                      ? `${Math.round(routeTimeMin)} min`
                      : `${Math.floor(routeTimeMin / 60)}h ${Math.round(routeTimeMin % 60)}m`} est.
                  </span>
                </span>
              )}
            </div>
          )}

          {placeDetails && (placeDetails.address || placeDetails.phone || placeDetails.website || placeDetails.hours?.length) && (
            <div className="px-4 md:px-6 py-4 bg-card border-b border-border space-y-3 text-sm">
              {placeDetails.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{placeDetails.address}</span>
                </div>
              )}
              {placeDetails.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${placeDetails.phone.replace(/\s+/g, "")}`} className="hover:underline">
                    {placeDetails.phone}
                  </a>
                </div>
              )}
              {placeDetails.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href={placeDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate max-w-full"
                  >
                    {placeDetails.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </div>
              )}
              {placeDetails.hours && placeDetails.hours.length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">Opening hours</span>
                    {typeof placeDetails.openNow === "boolean" && (
                      <span
                        className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                          placeDetails.openNow
                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {placeDetails.openNow ? "Open now" : "Closed"}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
                    <span className="ml-auto text-xs text-muted-foreground hidden group-open:inline">Hide</span>
                  </summary>
                  <ul className="mt-2 pl-6 space-y-1 text-muted-foreground">
                    {placeDetails.hours.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="relative">
            <div ref={mapDivRef} className={`h-[500px] w-full bg-muted ${online ? "" : "hidden"}`} />
            {!online && (
              <div className="h-[500px] w-full bg-muted/40 overflow-y-auto flex flex-col items-center gap-5 p-6 text-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <WifiOff className="w-5 h-5" />
                  <span className="text-sm font-medium">Offline mode — GPS tracking still works</span>
                </div>

                {destination ? (
                  <>
                    <Compass
                      className="w-20 h-20 text-primary transition-transform duration-500"
                      style={{ transform: `rotate(${bearing ?? 0}deg)` }}
                    />
                    <div>
                      <p className="text-4xl font-bold">
                        {distance === null
                          ? "—"
                          : distance < 1000
                          ? `${Math.round(distance)} m`
                          : `${(distance / 1000).toFixed(2)} km`}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        to {destination.label.split(",")[0]}
                      </p>
                    </div>
                    {distance !== null && distance <= ALERT_RADIUS_M && (
                      <Badge className="bg-secondary text-secondary-foreground animate-pulse">
                        Within 500 m — get ready!
                      </Badge>
                    )}
                    {!tracking && (
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Tap “Start tracking” to use your device GPS. No internet needed.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground max-w-sm">
                    No saved destination. Connect to the internet once to search a place — it’s stored on
                    your device and works offline afterwards.
                  </p>
                )}

                {stops.length > 0 && (
                  <div className="w-full max-w-md text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Saved stops nearby
                    </p>
                    <ul className="space-y-2">
                      {stops.map((s, i) => {
                        const from = userPos ?? destination;
                        const d = from ? haversine(from, s) : null;
                        return (
                          <li key={`${s.name}-${i}`} className="bg-card border border-border rounded-lg px-3 py-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{i + 1}. {s.name}</p>
                                {s.address && (
                                  <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                                )}
                              </div>
                              {d !== null && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {recents.length > 0 && (
                  <div className="w-full max-w-md text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Saved places (work offline)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recents.map((r) => (
                        <Button
                          key={destKey(r)}
                          size="sm"
                          variant={destination && destKey(r) === destKey(destination) ? "default" : "outline"}
                          onClick={() => setDestination(r)}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {r.label.split(",")[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TripMap;
