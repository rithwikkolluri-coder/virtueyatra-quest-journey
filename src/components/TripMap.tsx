import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation, BellRing, Loader2, Bell, BellOff } from "lucide-react";
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

const TripMap = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<(LatLng & { label: string }) | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [alertsOn, setAlertsOn] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const destCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const watchId = useRef<number | null>(null);
  const alertedRef = useRef(false);

  // Init map
  useEffect(() => {
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
        toast({ title: "Map failed to load", description: e.message, variant: "destructive" });
      });
    return () => { cancelled = true; };
  }, [toast]);

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

  const handleSearch = async () => {
    if (!query.trim()) return;
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
            <div className="flex-1 flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search a destination (e.g. Charminar, Hyderabad)"
                className="flex-1"
              />
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
            </div>
          )}

          <div ref={mapDivRef} className="h-[500px] w-full bg-muted" />
        </Card>
      </div>
    </section>
  );
};

export default TripMap;
