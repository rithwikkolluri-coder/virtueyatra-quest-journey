import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, BellRing, Loader2, Bell, BellOff, Phone, Globe, Clock, Timer, WifiOff, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ARRIVAL_ALERT_METERS as ALERT_RADIUS_M, bearingBetween, decodePolyline, haversine, parseDurationSeconds, type LatLng } from "@/lib/navigation";
import { invokeMaps, useTripNavigation, type GpsFix } from "@/hooks/useTripNavigation";
import { TripNavigationControls } from "@/components/TripNavigationControls";

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

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

const playAlarm = (ctx: AudioContext | null) => {
  if (!ctx) return;
  try {
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

interface Suggestion { id: string; primary: string; secondary: string; }
type Place = { id: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; internationalPhoneNumber?: string; nationalPhoneNumber?: string; websiteUri?: string; regularOpeningHours?: { weekdayDescriptions?: string[]; openNow?: boolean } };

const TripMap = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
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
  const [userPos, setUserPos] = useState<GpsFix | null>(null);
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
  const sessionTokenRef = useRef<string | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [origin, setOrigin] = useState<(LatLng & { label: string }) | null>(null);
  const [fromBusy, setFromBusy] = useState(false);
  const [tripRoute, setTripRoute] = useState<{ meters: number; seconds: number } | null>(null);
  const nav = useTripNavigation(destination, user?.id, userPos, online, language);
  const following = nav.active && nav.route !== null && !nav.guide?.arrived;
  const previousFix = useRef<GpsFix | null>(null);
  const heading = useRef(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const destCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
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
          clickableIcons: false,
        });
        setMapReady(true);
      })
      .catch((e) => {
        console.error(e);
      });
    return () => { cancelled = true; };
  }, [online]);

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

  // Fetch itinerary stops independently of map rendering.
  useEffect(() => {
    if (!destination || !online || !user?.id) return;
    const controller = new AbortController();
    invokeMaps<{ places?: Place[] }>({ action: "nearby", query: `top tourist attractions in ${destination.label.split(",")[0]}`.slice(0, 120), center: { lat: destination.lat, lng: destination.lng } }, controller.signal)
      .then(({ places }) => {
        if (controller.signal.aborted) return;
        const nearby = (places ?? []).flatMap((p) => p.location ? [{ name: p.displayName?.text ?? "", address: p.formattedAddress, lat: p.location.latitude, lng: p.location.longitude }] : []);
        setStops(nearby);
      }).catch((error) => { if (!controller.signal.aborted) console.error("Nearby stops:", error.message); });
    return () => controller.abort();
  }, [destination, online, user?.id]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !destination) return;
    const g = (window as any).google;
    const info = new g.maps.InfoWindow();
    const bounds = new g.maps.LatLngBounds();
    bounds.extend(destination);
    const path = [destination, ...stops];
    const ocean = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--travel-ocean").trim()})`;
    const markers = stops.map((stop, i) => {
      bounds.extend(stop);
      const marker = new g.maps.Marker({ map: mapRef.current, position: stop, title: stop.name, label: String(i + 1) });
      marker.addListener("click", () => {
        const content = document.createElement("div");
        content.textContent = [stop.name, stop.address].filter(Boolean).join(" — ");
        info.setContent(content);
        info.open({ map: mapRef.current, anchor: marker });
      });
      return marker;
    });
    const polyline = new g.maps.Polyline({ path, map: mapRef.current, geodesic: true, strokeColor: ocean, strokeOpacity: 0.7, strokeWeight: 3 });
    routePolylineRef.current = polyline;
    if (!nav.active && stops.length) mapRef.current.fitBounds(bounds, 60);
    const meters = stops.length ? path.slice(1).reduce((sum, stop, i) => sum + haversine(path[i], stop), 0) * 1.3 : null;
    setRouteDistance(meters);
    setRouteTimeMin(meters === null ? null : meters / 1000 / 35 * 60);
    return () => { info.close(); markers.forEach((marker) => marker.setMap(null)); polyline.setMap(null); };
  }, [destination, mapReady, stops, nav.active]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    routePolylineRef.current?.setVisible(!nav.active);
    if (!nav.route) return;
    const g = (window as any).google;
    const color = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()})`;
    const line = new g.maps.Polyline({ map: mapRef.current, path: nav.route.path, strokeColor: color, strokeOpacity: 1, strokeWeight: 6, zIndex: 2 });
    return () => line.setMap(null);
  }, [mapReady, nav.active, nav.route, stops]);

  // From -> To preview route
  useEffect(() => {
    if (!mapReady || !mapRef.current || !origin) { setTripRoute(null); return; }
    const g = (window as any).google;
    const marker = new g.maps.Marker({ map: mapRef.current, position: origin, title: `From: ${origin.label}`, label: { text: "A", color: "#ffffff", fontWeight: "700" } });
    if (!destination || nav.active || !online || !user?.id) return () => marker.setMap(null);
    const controller = new AbortController();
    let line: any = null;
    invokeMaps<{ routes?: { polyline?: { encodedPolyline?: string }; distanceMeters?: number; duration?: string }[] }>({ action: "route", origin: { lat: origin.lat, lng: origin.lng }, destination: { lat: destination.lat, lng: destination.lng }, mode: "DRIVE", language }, controller.signal)
      .then((data) => {
        const r = data.routes?.[0];
        const path = decodePolyline(r?.polyline?.encodedPolyline ?? "");
        if (controller.signal.aborted || path.length < 2) return;
        const color = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()})`;
        line = new g.maps.Polyline({ map: mapRef.current, path, strokeColor: color, strokeOpacity: 0.9, strokeWeight: 5, zIndex: 1 });
        const bounds = new g.maps.LatLngBounds(); path.forEach((p) => bounds.extend(p)); mapRef.current.fitBounds(bounds, 60);
        setTripRoute({ meters: r?.distanceMeters ?? 0, seconds: parseDurationSeconds(r?.duration) ?? 0 });
      })
      .catch((e) => { if (!controller.signal.aborted) toast({ title: "Couldn’t load route", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" }); });
    return () => { controller.abort(); marker.setMap(null); line?.setMap(null); };
  }, [origin, destination, mapReady, nav.active, online, user?.id, language, toast]);

  const searchFrom = async () => {
    const q = fromQuery.trim();
    if (!q) { setOrigin(null); return; }
    if (!user) { toast({ title: "Sign in to search a starting point", variant: "destructive" }); return; }
    setFromBusy(true);
    try {
      const { places } = await invokeMaps<{ places?: Place[] }>({ action: "search", query: q });
      const hit = places?.find((p) => p.location);
      if (!hit?.location) throw new Error("Try a more specific place name.");
      const label = hit.formattedAddress || hit.displayName?.text || q;
      setOrigin({ lat: hit.location.latitude, lng: hit.location.longitude, label });
      setFromQuery(label);
    } catch (e) {
      toast({ title: "Search failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setFromBusy(false); }
  };

  const useMyLocationAsFrom = () => {
    if (userPos) { setOrigin({ lat: userPos.lat, lng: userPos.lng, label: "My location" }); setFromQuery("My location"); return; }
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => { setOrigin({ lat: coords.latitude, lng: coords.longitude, label: "My location" }); setFromQuery("My location"); },
      (err) => toast({ title: "Location unavailable", description: err.message, variant: "destructive" }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Update user marker
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (!userPos) { userMarkerRef.current?.setMap(null); userMarkerRef.current = null; return; }
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
    if (following && online && userPos.accuracy <= 70) {
      const last = previousFix.current;
      if (userPos.heading !== null && Number.isFinite(userPos.heading)) heading.current = userPos.heading;
      else if (last && haversine(last, userPos) >= Math.max(8, userPos.accuracy)) heading.current = bearingBetween(last, userPos);
      previousFix.current = userPos;
      userMarkerRef.current.setIcon({ path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, rotation: heading.current, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 });
      mapRef.current.panTo(pos);
      if (mapRef.current.getZoom() < 16) mapRef.current.setZoom(17);
      mapRef.current.setHeading(heading.current);
    } else {
      previousFix.current = null;
      userMarkerRef.current.setIcon({ path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 });
      mapRef.current.setHeading(0);
    }
  }, [userPos, mapReady, following, online]);

  useEffect(() => {
    const q = query.trim();
    if (!online || !user?.id || searching || q.length < 2 || q === destination?.label) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const token = sessionTokenRef.current ?? crypto.randomUUID();
        sessionTokenRef.current = token;
        const data = await invokeMaps<{ suggestions?: { placePrediction?: { placeId: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }[] }>({ action: "autocomplete", input: q, sessionToken: token, center: userPos ? { lat: userPos.lat, lng: userPos.lng } : destination }, controller.signal);
        if (controller.signal.aborted) return;
        setSuggestions((data.suggestions ?? []).flatMap(({ placePrediction: place }) => place?.placeId ? [{ id: place.placeId, primary: place.structuredFormat?.mainText?.text ?? place.text?.text ?? "", secondary: place.structuredFormat?.secondaryText?.text ?? "" }] : []));
        setShowSuggestions(document.activeElement === searchInputRef.current);
      } catch (error) {
        if (!controller.signal.aborted) console.error("Autocomplete:", error);
      }
    }, 300);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, online, user?.id, searching, destination]);

  const selectSuggestion = async (s: Suggestion) => {
    setShowSuggestions(false); setSuggestions([]); setSearching(true); setPlaceDetails(null);
    const sessionToken = sessionTokenRef.current ?? undefined;
    sessionTokenRef.current = null;
    try {
      const place = await invokeMaps<Place>({ action: "details", placeId: s.id, sessionToken });
      if (!place.location) throw new Error("No location found.");
      const label = place.formattedAddress || place.displayName?.text || s.primary;
      setDestination({ lat: place.location.latitude, lng: place.location.longitude, label });
      setQuery(label);
      alertedRef.current = false;
      setPlaceDetails({ address: place.formattedAddress, phone: place.internationalPhoneNumber || place.nationalPhoneNumber, website: /^https?:\/\//i.test(place.websiteUri ?? "") ? place.websiteUri : undefined, hours: place.regularOpeningHours?.weekdayDescriptions, openNow: place.regularOpeningHours?.openNow });
    } catch (error) {
      toast({ title: "Couldn’t load place", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally { setSearching(false); }
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
    if (!user) {
      toast({ title: "Sign in to search for a new destination", variant: "destructive" });
      return;
    }
    if (showSuggestions && suggestions.length > 0) { await selectSuggestion(suggestions[0]); return; }
    setSearching(true); setShowSuggestions(false); setSuggestions([]);
    sessionTokenRef.current = null;
    try {
      const { places } = await invokeMaps<{ places?: Place[] }>({ action: "search", query: query.trim() });
      const result = places?.find((place) => place.location);
      if (!result?.location) throw new Error("Try a more specific place name.");
      const label = result.formattedAddress || result.displayName?.text || query.trim();
      setDestination({ lat: result.location.latitude, lng: result.location.longitude, label });
      setQuery(label);
      setPlaceDetails({ address: result.formattedAddress });
      alertedRef.current = false;
    } catch (error) {
      toast({ title: "Search failed", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally { setSearching(false); }
  };

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false); setUserPos(null); setDistance(null); setBearing(null);
  }, []);

  const alarmContext = useRef<AudioContext | null>(null);
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("Location is not available in this browser."); return false; }
    setGpsError("");
    if (!alarmContext.current && window.AudioContext) alarmContext.current = new AudioContext();
    void alarmContext.current?.resume().catch(() => undefined);
    if (watchId.current !== null) return true;
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => { setGpsError(""); setUserPos({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, heading: coords.heading }); },
      (err) => { setGpsError(err.message); if (err.code === 1) stopTracking(); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    setTracking(true);
    return true;
  }, [stopTracking]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    void alarmContext.current?.close().catch(() => undefined);
    watchId.current = null; alarmContext.current = null;
  }, []);

  // Ask for the traveller's location as soon as the map opens so the blue dot and navigation are ready
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lng: coords.longitude };
        setUserPos((prev) => prev ?? { ...here, accuracy: coords.accuracy, heading: coords.heading });
        setOrigin((prev) => prev ?? { ...here, label: "My location" });
        setFromQuery((prev) => prev || "My location");
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  const startNavigation = () => {
    if (!startTracking()) return;
    if (userPos) { setOrigin({ lat: userPos.lat, lng: userPos.lng, label: "My location" }); setFromQuery("My location"); }
    window.speechSynthesis?.resume();
    if (nav.active) nav.retry(); else nav.setActive(true);
  };
  const exitNavigation = () => { nav.setActive(false); stopTracking(); setGpsError(""); };

  useEffect(() => {
    if (!destination || !userPos) return;
    const d = haversine(userPos, destination);
    setDistance(d);
    setBearing(bearingBetween(userPos, destination));
    if (alertsOn && userPos.accuracy <= 70 && d <= ALERT_RADIUS_M && !alertedRef.current) {
      alertedRef.current = true;
      playAlarm(alarmContext.current);
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
          <div className="px-4 md:px-6 pt-4 md:pt-6 bg-card flex flex-col md:flex-row gap-2 md:items-center">
            <span className="text-sm font-semibold w-12 shrink-0">From</span>
            <div className="flex-1 flex gap-2">
              <Input maxLength={120} value={fromQuery} onChange={(e) => setFromQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !fromBusy && searchFrom()} disabled={nav.active} placeholder="Starting point (e.g. Secunderabad Station)" aria-label="From location" />
              <Button onClick={searchFrom} aria-label="Search starting point" disabled={fromBusy || nav.active} variant="secondary">
                {fromBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
              <Button onClick={useMyLocationAsFrom} variant="outline" disabled={nav.active} aria-label="Use my location as starting point">
                <Navigation className="w-4 h-4" /><span className="hidden sm:inline ml-1">My location</span>
              </Button>
            </div>
            {tripRoute && destination && (
              <Badge variant="secondary" className="shrink-0">{(tripRoute.meters / 1000).toFixed(1)} km · {Math.round(tripRoute.seconds / 60)} min</Badge>
            )}
          </div>
          <div className="px-4 md:px-6 pt-3 bg-card"><span className="text-sm font-semibold">To</span></div>
          <div className="p-4 md:p-6 bg-card border-b border-border flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex gap-2 relative">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  maxLength={120}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => e.key === "Enter" && !searching && !nav.active && handleSearch()}
                  disabled={nav.active}
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
              <Button onClick={handleSearch} aria-label="Search destination" disabled={searching || nav.active} className="bg-gradient-to-r from-primary to-travel-ocean">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tracking ? "destructive" : "default"}
                onClick={tracking ? stopTracking : startTracking}
                disabled={!destination || nav.active}
                className={!tracking ? "bg-gradient-to-r from-secondary to-accent" : ""}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {tracking ? "Stop" : "Start tracking"}
              </Button>
              <Button variant="outline" onClick={() => setAlertsOn((v) => !v)} title="Toggle 500m alarm" aria-label="Toggle 500m alarm" aria-pressed={alertsOn}>
                {alertsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {(destination || distance !== null) && (
            <div className="px-4 md:px-6 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-4 text-sm">
              {destination && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate max-w-[min(300px,70vw)]">{destination.label.split(",").slice(0, 3).join(", ")}</span>
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

          {gpsError && <p className="px-4 py-2 text-sm text-destructive" role="alert">{gpsError}</p>}
          <div className="relative">
            {destination && <TripNavigationControls overlay nav={nav} destination={destination} fix={userPos} online={online} signedIn={Boolean(user)} onStart={startNavigation} onExit={exitNavigation} />}
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
                          onClick={() => { setDestination(r); alertedRef.current = false; }}
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
          {destination && <TripNavigationControls nav={nav} destination={destination} fix={userPos} online={online} signedIn={Boolean(user)} onStart={startNavigation} onExit={exitNavigation} />}
        </Card>
      </div>
    </section>
  );
};

export default TripMap;
