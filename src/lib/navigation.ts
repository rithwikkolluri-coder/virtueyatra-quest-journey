export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePosition {
  distanceMeters: number;
  remainingMeters: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

export const haversine = (a: LatLng, b: LatLng): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lng - a.lng);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(value));
};

export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) return [];
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      if (index >= encoded.length) return [];
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }

  return points;
};

export const positionOnRoute = (point: LatLng, path: LatLng[]): RoutePosition => {
  if (path.length < 2) return { distanceMeters: Number.POSITIVE_INFINITY, remainingMeters: 0 };

  let bestDistance = Number.POSITIVE_INFINITY;
  let remainingMeters = 0;
  let distanceAfterClosestSegment = 0;

  for (let index = path.length - 2; index >= 0; index -= 1) {
    const start = path[index];
    const end = path[index + 1];
    if (!start || !end) continue;

    const meanLatitude = ((start.lat + end.lat + point.lat) / 3) * (Math.PI / 180);
    const metersPerLongitudeDegree = 111_320 * Math.cos(meanLatitude);
    const startX = start.lng * metersPerLongitudeDegree;
    const endX = end.lng * metersPerLongitudeDegree;
    const pointX = point.lng * metersPerLongitudeDegree;
    const startY = start.lat * 111_320;
    const endY = end.lat * 111_320;
    const pointY = point.lat * 111_320;
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;
    const progress = segmentLengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((pointX - startX) * segmentX + (pointY - startY) * segmentY) / segmentLengthSquared));
    const nearest = {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress,
    };
    const distance = haversine(point, nearest);
    const segmentLength = haversine(start, end);

    if (distance < bestDistance) {
      bestDistance = distance;
      remainingMeters = distanceAfterClosestSegment + segmentLength * (1 - progress);
    }

    distanceAfterClosestSegment += segmentLength;
  }

  return { distanceMeters: bestDistance, remainingMeters };
};

export const parseDurationSeconds = (duration: unknown): number | null => {
  if (typeof duration !== "string") return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration);
  if (!match?.[1]) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds : null;
};