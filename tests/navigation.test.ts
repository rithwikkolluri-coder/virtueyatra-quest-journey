import { describe, expect, test } from "bun:test";
import { decodePolyline, haversine, parseDurationSeconds, positionOnRoute } from "../src/lib/navigation";

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
});