import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { decodePolyline, haversine, isWithinTurnAlert, nextNavigationStep, parseDurationSeconds, positionOnRoute, shouldReroute, type LatLng, type TravelMode } from "@/lib/navigation";

export type GpsFix = LatLng & { accuracy: number; heading: number | null };
type EncodedPath = { encodedPolyline?: string };
type RouteStep = { polyline?: EncodedPath; navigationInstruction?: { instructions?: string; maneuver?: string }; transitDetails?: { transitLine?: { name?: string }; headsign?: string; stopDetails?: { arrivalStop?: { name?: string } } } };
type Step = { path: LatLng[]; text: string; maneuver?: string };
type Route = { path: LatLng[]; steps: Step[]; meters: number; seconds: number; receivedAt: number };
type Guide = { step?: Step; turnMeters?: number; remaining: number; eta: number; arrived: boolean };

const parseRoute = (raw: { routes?: { polyline?: EncodedPath; duration?: string; distanceMeters?: number; legs?: { steps?: RouteStep[] }[] }[] }): Route => {
  const route = raw?.routes?.[0];
  const path = decodePolyline(route?.polyline?.encodedPolyline ?? "");
  const seconds = parseDurationSeconds(route?.duration);
  const meters = route?.distanceMeters ?? 0;
  if (path.length < 2 || seconds === null || !Number.isFinite(meters) || meters < 0) throw new Error("Google Maps returned an incomplete route.");
  const steps = (route?.legs ?? []).flatMap((leg) => (leg.steps ?? []).flatMap((step) => {
    const points = decodePolyline(step.polyline?.encodedPolyline ?? "");
    const transit = step.transitDetails;
    const text = transit ? [transit.transitLine?.name, transit.headsign, transit.stopDetails?.arrivalStop?.name].filter(Boolean).join(" · ") : step.navigationInstruction?.instructions;
    return points.length > 1 ? [{ path: points, text: text ?? "", maneuver: step.navigationInstruction?.maneuver }] : [];
  }));
  return { path, seconds, meters, steps, receivedAt: Date.now() };
};

export const invokeMaps = async <T,>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>("maps-navigation", { body, signal });
  if (error instanceof FunctionsHttpError) {
    const details = await error.context.json().catch(() => null);
    throw new Error(typeof details?.error === "string" ? details.error : `Google Maps request failed (${error.context.status}).`);
  }
  if (error) throw error;
  if (!data) throw new Error("No result was returned.");
  return data;
};

const REROUTE_INTERVAL = 30_000;

export function useTripNavigation(destination: LatLng | null, userId: string | undefined, fix: GpsFix | null, online: boolean, language: string) {
  const [mode, setMode] = useState<TravelMode>("DRIVE");
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const lastRequest = useRef(-Infinity);
  const offRoute = useRef(0);
  const lastFix = useRef<GpsFix | null>(null);
  const index = useRef(0);
  const spoken = useRef(-1);
  const arrived = useRef(false);
  const initialAttempt = useRef(false);

  useEffect(() => {
    setActive(false);
    return () => {
      request.current?.abort(); request.current = null;
      window.speechSynthesis?.cancel();
    };
  }, [destination, userId]);

  useEffect(() => {
    if (muted) window.speechSynthesis?.cancel();
  }, [muted]);

  useEffect(() => {
    if (!active) {
      request.current?.abort(); request.current = null;
      window.speechSynthesis?.cancel();
      setRoute(null); setGuide(null); setBusy(false); setError("");
      lastRequest.current = -Infinity; lastFix.current = null; offRoute.current = 0;
      initialAttempt.current = false; arrived.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (!active || !destination || !userId || !fix || arrived.current) return;
    const load = async () => {
      const controller = new AbortController();
      request.current = controller;
      lastRequest.current = Date.now();
      offRoute.current = 0;
      initialAttempt.current = true;
      setBusy(true); setError("");
      try {
        const data = await invokeMaps<Parameters<typeof parseRoute>[0]>({ action: "route", origin: { lat: fix.lat, lng: fix.lng }, destination: { lat: destination.lat, lng: destination.lng }, mode, language }, controller.signal);
        if (!controller.signal.aborted) {
          const next = parseRoute(data);
          index.current = 0; spoken.current = -1;
          window.speechSynthesis?.cancel();
          setRoute(next);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load directions.");
      } finally {
        if (request.current === controller) { request.current = null; setBusy(false); }
      }
    };

    if (!route) {
      if (online && fix.accuracy <= 70 && !request.current && !initialAttempt.current) void load();
      return;
    }
    const position = positionOnRoute(fix, route.path);
    if (lastFix.current !== fix) {
      offRoute.current = fix.accuracy <= 35 && position.distanceMeters - fix.accuracy > 50 ? offRoute.current + 1 : 0;
      lastFix.current = fix;
    }
    const total = positionOnRoute(route.path[0], route.path).remainingMeters;
    const fraction = total > 0 ? Math.min(1, position.remainingMeters / total) : 0;
    const end = route.path.at(-1);
    const done = fix.accuracy <= 30 && position.remainingMeters <= 30 && Boolean(end && haversine(fix, end) <= 30);
    const current = nextNavigationStep(fix, route.steps.map((step) => step.path), index.current, fix.accuracy);
    index.current = current;
    const step = route.steps[current];
    const upcoming = route.steps[current + 1];
    const turnMeters = step ? positionOnRoute(fix, step.path).remainingMeters : undefined;
    const maneuver = upcoming?.text ? upcoming : step;
    setGuide({ step: maneuver, turnMeters, remaining: done ? 0 : route.meters * fraction, eta: done ? Date.now() : mode === "TRANSIT" ? Math.max(Date.now(), route.receivedAt + route.seconds * 1000) : Date.now() + route.seconds * fraction * 1000, arrived: done });
    if (done) {
      arrived.current = true; setBusy(false); setError("");
      request.current?.abort(); request.current = null;
      window.speechSynthesis?.cancel();
      return;
    }
    if (!muted && window.speechSynthesis && maneuver?.text && turnMeters !== undefined && isWithinTurnAlert(turnMeters, fix.accuracy) && position.distanceMeters <= 35 && spoken.current !== current) {
      spoken.current = current;
      const speech = new SpeechSynthesisUtterance(maneuver.text);
      speech.lang = `${language}-IN`;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    }
    if (online && mode !== "TRANSIT" && !request.current && Date.now() - lastRequest.current >= REROUTE_INTERVAL && shouldReroute(position.distanceMeters, fix.accuracy, offRoute.current)) void load();
  }, [active, destination, userId, fix, online, language, mode, route, muted, attempt]);

  const retry = () => { initialAttempt.current = false; setError(""); setAttempt((value) => value + 1); };
  return { mode, setMode, active, setActive, muted, setMuted, route, guide, busy, error, retry };
}