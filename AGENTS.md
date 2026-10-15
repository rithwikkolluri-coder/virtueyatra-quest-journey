# Architecture Rules

- Keep reusable navigation geometry and distance calculations in `src/lib/navigation.ts` so route guidance can be tested independently of the map UI.