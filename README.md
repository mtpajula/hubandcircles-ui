# hubandcircles-ui

Vue 3 + MapLibre frontend for Napa ja piirit / Hub & Circles. Presentation only; the data comes
from the `hubandcircles-manager` build. Architecture: `../ARKKITEHTUURI.md`. Visual spec:
`UI-SPEC.md` (binding).

```
npm install
npm run types                                        # src/types/ from ../hubandcircles-manager/schema/
npm run dev                                          # serves ../hubandcircles-manager/dist at /data/
HC_DATA_DIR=/path/to/data npm run dev                # ... or any other manager build output
```

The dev server serves the data directory at `/data/` in memory only; `dist/` never contains
it (the manager tool refuses a frontend that carries a `data/` directory).

## Data contract

`src/types/catalog.ts` and `src/types/route.ts` are generated from the manager repo's
`catalog.schema.json` and `publishedroute.schema.json` with `npm run types` (override the schema
directory with `SCHEMA_DIR=...`). Never edit them by hand. The frontend reads `catalog.json` and
`routes/<id>/route.json` + `track.geojson` from `VITE_DATA_URL` (see `.env.example`) and refuses
to render an unknown `schema_version`.

The test fixture `src/test/fixtures/catalog.json` is a copy of the manager repo's golden
`tests/fixtures/expected/catalog.json`; QA keeps it in sync.

## Static assets

`public/landing/hero.mp4` (H.264, 1280x720, muted, 4.6 MB) and `public/landing/poster.jpg` are
the landing page hero video and its poster. They are used by the landing page (R3b).

## Language rule (P10)

All code, identifiers, file names, comments and translation keys are English. Finnish appears
only in `src/locales/fi.json` values. `src/test/language.test.ts` enforces this.

## Browser smoke test

`npm run smoke` drives Google Chrome (must be installed; `playwright-core` uses the `chrome`
channel, no browser download) against a running preview, `SMOKE_URL` (default
`http://127.0.0.1:8767`). It opens the landing page, a theme page, `all` and the first route of
`data/catalog.json`, and fails on page or console errors, a missing map canvas, a MapLibre worker
or track request that did not return 200, "undefined"/"NaN" in the visible text, or a route page
without the GPX button.

```
npm run build
(cd ../hubandcircles-manager && uv run python -m manager preview --data tests/fixtures/fx-full \
  --dist /tmp/hc-full --frontend ../hubandcircles-ui/dist --port 8767) &
npm run smoke
```

## Done means

```
npm run typecheck && npm run lint && npm test && npm run build
```

The repo does not publish itself; a version tag `v*` produces a release zip that the manager
tool merges with the data.
