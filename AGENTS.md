# Architecture Rules

- Keep reusable navigation geometry and distance calculations in `src/lib/navigation.ts` so route guidance can be tested independently of the map UI.
- Keep billable Places and Routes requests in the authenticated `maps-navigation` function and use Maps JavaScript only for rendering so browser credentials never need server API access.