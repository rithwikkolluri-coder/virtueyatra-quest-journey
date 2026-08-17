# Make VirtueYatra content dynamic (database-driven)

Right now destinations, experiences, home-page copy and the map's itinerary stops are all hardcoded in the React components. This moves them into the backend database so content can be changed without touching code, seeded with the exact content that exists today (no visible change on first load).

## What gets stored in the database

New public, read-only tables (anyone can read; no one can write from the app — you edit rows directly):

- **destinations** — slug, name/location/description per language (English, Hindi, Telugu), category, tags, latitude, longitude, trending flag, sort order, active flag
- **experiences** — slug, title/description per language, icon name, duration, difficulty, gradient, category, sort order, active flag
- **site_content** — key + text per language, for the hero badge/title/subtitle, section headings and stats (the copy currently coming from the translation files)
- **destination_places** — the itinerary stops for a destination: destination reference, place name, short note, latitude, longitude, stop order

All four are seeded with the current content, including the nine existing destinations, the eight experiences, the home copy, and a curated list of real stops per destination (with coordinates) for the map.

Ratings, review counts and prices are intentionally not carried over — they stay out of the UI per the project's display rules.

## What changes in the app

- **Destinations section** loads its cards from the database. Category tabs are derived from the categories present in the data. The existing letter-search and type-anywhere keyboard filtering keep working, now matching against the loaded names/locations.
- **Experiences section** loads its cards from the database, mapping the stored icon name to the matching icon.
- **Hero and section headings** read from `site_content`, falling back to the current translation strings if a key is missing.
- **Trip map** — when a destination is selected, the app first looks for that destination's stored stops and plots those numbered markers plus the route line. Only if no stored stops exist does it fall back to the current "top tourist attractions" Google Places search. This makes the map itinerary match your curated trip content and cuts Places calls.
- A small loading skeleton shows while content is fetched; if the fetch fails, the current hardcoded content is used as a fallback so the page never breaks.

## Technical notes

- Tables live in the public schema with row-level security enabled, a public read policy, and read grants for anonymous and signed-in users. No insert/update/delete policies — content is managed directly in the database.
- A shared `useSiteContent` / `useDestinations` / `useExperiences` hook set in `src/hooks/` wraps the queries so components stay thin.
- Language selection picks the right column (`name_en` / `name_hi` / `name_te`) via the existing `LanguageContext`, falling back to English when a translation is empty.
- `TripMap.tsx` gains a lookup by destination slug/name before its Places `searchByText` path; polyline, distance and 500 m proximity logic are unchanged.
- Fallback constants keep the current arrays in the components so an empty table or a failed request degrades gracefully.
