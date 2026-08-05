# Midnight Meter

An unofficial SvelteKit record of the ratings delivered by Van Lathan, Charles Holmes, Jomi Adeniran, and Steve Ahlman on The Midnight Boys podcast.

The podcast is the source of record. The independent `@MidnightMeter` X account is used only as an accurate historical archive for the older entries.

## Run locally

```sh
npm install
npm run dev
```

## Frontend

One scrolling page in the show's palette — teal card stock, neon inks, black keylines, 3D extruded Anton logotype, halftone and starburst texture.

- **Hero** (`src/lib/pop/Hero.svelte`) — logotype and the highest / lowest / most-debated titles up top, then one tilting card per host with rank, career average, a 12-bucket score-distribution histogram, score counts, and their highest and lowest verdicts. Sized so the top of the ratings list peeks under the fold.
- **Ticker** — looping marquee of recent verdicts.
- **Ratings list** (`src/lib/pop/Archive.svelte`) — sticky search (`/` focuses it), type and sort controls, all 86 rows; expanding a row reveals one rail per scorer with how far that score sat from their own career average, then all-time rank, spread, format and verdict.
- **Scale**, **Footer** — the 1–10 / 11–12 tiers and the source note.

Shared: `src/lib/data.ts` (ratings, host stats, archive summary), `src/lib/motion/` (reveal / tilt / parallax / sticky actions), `src/lib/components/` (the meter, animated counter, icons). All motion respects `prefers-reduced-motion`.

### The meter

`src/lib/components/Meter.svelte` is the broadcast instrument, rebuilt: a 1–12 rail with a numeral and a node at every stop, and a **fixed spectrum painted across the whole track** — coral at 1 through mint and lilac to gold at 12. A score never picks a colour, it only unmasks how far along the rail the verdict got, so the same score always looks the same everywhere on the site. 12 is its own oversized bubble at the end, lighting gold only when a scorer actually gives one.

Takes a `score` (fractional is fine — averages land between stops), an optional `label` for the purple nameplate, and a reveal `delay`. The outer element is only the query container; the grid lives on `.meter__body` inside it, since a container can't respond to its own container queries. Below 430px the nameplate steps above the rail instead of beside it; below 260px the numerals drop and the nodes carry the reading.

## Add a new rating

Post–March 20, 2026 ratings belong in `data/manual-ratings.json`. Add a newest-first object with this shape:

```json
{
  "id": "manual-project-slug-2026-08-03",
  "title": "PROJECT TITLE",
  "ratedAt": "2026-08-03",
  "scores": {
    "van": 9,
    "charles": 8,
    "jomi": 10,
    "steve": null
  },
  "guests": [
    { "name": "Guest Name", "score": 9 }
  ],
  "rawText": "Optional transcription or source note.",
  "archiveUrl": null,
  "note": "Optional context, such as a rewatch or joke score."
}
```

Use `null` when a host did not score the title. Preserve unusual scores and context exactly as delivered on the show.

## Refresh the historical X archive

```sh
npm run import:archive
```

The importer reads `data/archive-post-ids.json` and `data/archive-overrides.json`, then regenerates `data/archive-ratings.json`. It never overwrites the manual ratings file.

## Verify

```sh
npm run check
npm run build
```
