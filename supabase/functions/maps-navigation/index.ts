import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";

const coordinateSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("autocomplete"), input: z.string().trim().min(2).max(120), sessionToken: z.string().uuid() }),
  z.object({ action: z.literal("details"), placeId: z.string().trim().min(3).max(256).regex(/^(places\/)?[A-Za-z0-9_-]+$/), sessionToken: z.string().uuid().optional() }),
  z.object({ action: z.literal("search"), query: z.string().trim().min(2).max(120), center: coordinateSchema.optional() }),
  z.object({ action: z.literal("nearby"), query: z.string().trim().min(2).max(120), center: coordinateSchema }),
  z.object({ action: z.literal("route"), origin: coordinateSchema, destination: coordinateSchema, mode: z.enum(["DRIVE", "WALK", "TRANSIT"]) }),
]);

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const gatewayUrl = "https://connector-gateway.lovable.dev/google_maps";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return jsonResponse({ error: "Sign in to use live map search and navigation." }, 401);

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Sign in to use live map search and navigation." }, 401);

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!lovableApiKey || !googleMapsApiKey) {
      return jsonResponse({ error: "Google Maps is not connected yet." }, 503);
    }

    const request = parsed.data;
    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": googleMapsApiKey,
      "Content-Type": "application/json",
    };
    let upstream: Response;

    if (request.action === "autocomplete") {
      upstream = await fetch(`${gatewayUrl}/places/v1/places:autocomplete`, {
        method: "POST",
        headers: { ...headers, "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat" },
        body: JSON.stringify({ input: request.input, sessionToken: request.sessionToken, includedRegionCodes: ["IN"] }),
      });
    } else if (request.action === "details") {
      const placeId = request.placeId.replace(/^places\//, "");
      const query = request.sessionToken ? `?sessionToken=${encodeURIComponent(request.sessionToken)}` : "";
      upstream = await fetch(`${gatewayUrl}/places/v1/places/${encodeURIComponent(placeId)}${query}`, {
        headers: { ...headers, "X-Goog-FieldMask": "id,displayName,formattedAddress,location,internationalPhoneNumber,nationalPhoneNumber,websiteUri,regularOpeningHours" },
      });
    } else if (request.action === "search" || request.action === "nearby") {
      const center = request.center ?? { lat: 20.5937, lng: 78.9629 };
      upstream = await fetch(`${gatewayUrl}/places/v1/places:searchText`, {
        method: "POST",
        headers: { ...headers, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location" },
        body: JSON.stringify({
          textQuery: request.query,
          regionCode: "IN",
          pageSize: request.action === "nearby" ? 10 : 8,
          locationBias: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: request.action === "nearby" ? 25000 : 50000 } },
        }),
      });
    } else {
      const origin = { location: { latLng: { latitude: request.origin.lat, longitude: request.origin.lng } } };
      const destination = { location: { latLng: { latitude: request.destination.lat, longitude: request.destination.lng } } };
      const fieldMask = [
        "routes.distanceMeters", "routes.duration", "routes.polyline.encodedPolyline",
        "routes.legs.steps.distanceMeters", "routes.legs.steps.staticDuration",
        "routes.legs.steps.polyline.encodedPolyline", "routes.legs.steps.navigationInstruction.maneuver",
        "routes.legs.steps.navigationInstruction.instructions", "routes.legs.steps.transitDetails",
      ].join(",");
      upstream = await fetch(`${gatewayUrl}/routes/directions/v2:computeRoutes`, {
        method: "POST",
        headers: { ...headers, "X-Goog-FieldMask": fieldMask },
        body: JSON.stringify({
          origin,
          destination,
          travelMode: request.mode,
          ...(request.mode === "DRIVE" ? { routingPreference: "TRAFFIC_AWARE" } : {}),
          languageCode: "en",
        }),
      });
    }

    if (!upstream.ok) {
      const details = await upstream.text();
      console.error(`Google Maps request failed [${upstream.status}]: ${details}`);
      if (upstream.status === 403) {
        return jsonResponse({ error: "Google Maps denied this request. Check the connected Google Maps API access and billing settings.", status: upstream.status, details }, upstream.status);
      }
      return jsonResponse({ error: "Google Maps request failed.", status: upstream.status, details }, upstream.status);
    }

    const data = await upstream.json();
    if ((request.action === "route") && !data.routes?.[0]?.polyline?.encodedPolyline) {
      return jsonResponse({ error: "No drivable or walkable route was found for this trip." }, 404);
    }
    return jsonResponse(data);
  } catch (error) {
    console.error("maps-navigation error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to complete the map request." }, 500);
  }
});