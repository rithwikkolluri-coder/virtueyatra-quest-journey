import { describe, expect, test } from "bun:test";
import { ARRIVAL_ALERT_METERS, decodePolyline, googleMapsDirections, haversine, isWithinTurnAlert, nextNavigationStep, parseDurationSeconds, positionOnRoute, shouldReroute } from "../src/lib/navigation";

describe("navigation geometry", () => {
  test("calculates straight-line distance in meters", () => {
    expect(Math.round(haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }))).toBe(111);
  });

  test("identifies when the user is more than 50 meters from the route", () => {
    const route = [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }];
    const position = positionOnRoute({ lat: 0.0005, lng: 0.0005 }, route);
    expect(position.distanceMeters).toBeGreaterThan(50);
    expect(position.distanceMeters).toBeLessThan(60);
  });

  test("returns the remaining route distance from the nearest point", () => {
    const route = [{ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }];
    const position = positionOnRoute({ lat: 0, lng: 0.0005 }, route);
    expect(Math.round(position.remainingMeters)).toBe(56);
  });

  test("decodes Google encoded route coordinates", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  test("parses fractional Google duration seconds without rounding", () => {
    expect(parseDurationSeconds("12.5s")).toBe(12.5);
    expect(parseDurationSeconds("bad")).toBeNull();
  });

  test("only flags a reroute beyond 50 m after repeated reliable readings", () => {
    expect(shouldReroute(55, 5, 3)).toBe(false);
    expect(shouldReroute(56, 5, 2)).toBe(false);
    expect(shouldReroute(56, 5, 3)).toBe(true);
  });

  test("warns about the upcoming turn within 100 m when GPS is accurate", () => {
    expect(isWithinTurnAlert(101, 10)).toBe(false);
    expect(isWithinTurnAlert(100, 10)).toBe(true);
    expect(isWithinTurnAlert(50, 70)).toBe(false);
  });

  test("preserves the arrival radius at 500 meters", () => {
    expect(ARRIVAL_ALERT_METERS).toBe(500);
  });

  test("advances to the next step after a turn, not before it", () => {
    const steps = [[{ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 }], [{ lat: 0, lng: 0.001 }, { lat: 0.001, lng: 0.001 }]];
    expect(nextNavigationStep({ lat: 0, lng: 0.0005 }, steps, 0, 5)).toBe(0);
    expect(nextNavigationStep({ lat: 0.0003, lng: 0.001 }, steps, 0, 5)).toBe(1);
  });

  test("passes the user's origin, destination and walking mode to Google Maps", () => {
    const link = new URL(googleMapsDirections({ lat: 17.36, lng: 78.47 }, "WALK", { lat: 17.37, lng: 78.49 }));
    expect(link.hostname + link.pathname).toBe("www.google.com/maps/dir/");
    expect(link.searchParams.get("origin")).toBe("17.37,78.49");
    expect(link.searchParams.get("destination")).toBe("17.36,78.47");
    expect(link.searchParams.get("travelmode")).toBe("walking");
  });
});