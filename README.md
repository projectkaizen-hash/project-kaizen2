# Project Kaizen — Next.js Rebuild

A faithful Next.js/TypeScript/Tailwind rebuild of the "Project Kaizen" wireframe deck
(Website update — Guides and Clues, 24 frames), reproducing the grid system, typography,
and interaction patterns shown in the mockups:

- **12-column grid** with a `clamp()`-based outer margin/gutter standing in for the
  100px margin & gutter called out throughout the wireframes.
- **Desaturated → full-colour image treatment** (`.kz-image`) matching the
  "0% saturation / 50% opacity → 100% / 100%" hover rule shown on the People and
  Projects grids.
- **Pages**: Home (hero + featured strip), Projects (filterable grid: /all,
  /competition, /building, /interior, plus category filter), Project detail
  (credits panel + image gallery that swaps for a scrollable "// INFO +" copy panel,
  exactly like the CERM Bangladesh frames), People (team grid), Person detail (bio +
  "also on the team"), Contact/Location (map placeholder, coordinates, connect links),
  and Process (styled consistently, not present in the source wireframes but added to
  complete the nav).

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

## Notes on assets

The wireframes only ever specify placeholder blocks ("actual image", "50% opacity
image", etc.) — no real photography was supplied, so `PlaceholderImage` generates a
distinct gradient per project/person as a stand-in. Swap it for `next/image` with real
assets in `src/components/PlaceholderImage.tsx` usages.

Content (project names, team names, contact details) is taken directly from the
wireframe copy; anything the wireframe left as "Name / Title" placeholders is kept as
sample data in `src/lib/data.ts` — edit that file to drop in real copy.
