# UI-SPEC – Hub & Circles web frontend

Binding visual specification for `hubandcircles-ui`, extracted from Claude Design rounds 3 and 4
(12 Sep 2026). `../ARKKITEHTUURI.md` is binding for structure and data; this file for dimensions,
colors, states and interaction rules. When they conflict, fix both in the same change. Round 1 and 2
frames were superseded and are not reproduced here.

All identifiers are English (P10). UI copy shown here is the Finnish design text; every string is
an i18n key with `fi` and `en` values.

## 1. Tokens (`src/assets/tokens.css`)

### 1.1 Base colors (code)

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#1C2B3A` | Text, logo hub, dashed circle, dark tooltips |
| `--color-ink-soft` | `#3C4C5C` | Body text in cards, secondary labels |
| `--color-ink-muted` | `#5A6B7A` | Captions, units, "Not rated" badge, eyebrow labels |
| `--color-snow` | `#F3F6F8` | Page background, sidebar background, route casing |
| `--color-lichen` | `#C9D3B8` | Neutral surfaces, frame borders |
| `--color-border` | `#DDE3E6` | Card and panel borders |
| `--color-border-soft` | `#EEF1F2` | Hairlines inside cards |
| `--color-river` | `#2F6F7E` | Links, interactive elements, default service marker |
| `--color-midnight-sun` | `#E8A33D` | Opened-route highlight on map, issue marker ring |
| `--color-night` | `#16222E` | Landing hero, dark theme cards, ride mode background |
| `--color-night-soft` | `#1C2B3A` at 95% | Ride-mode panels (`#1C2B3AF2`), border `#2C4056` |
| `--color-on-night` | `#E8EEF2` | Text on dark backgrounds |
| `--color-on-night-muted` | `#B9C9D6` / `#9FB6C8` | Secondary text on dark |
| `--color-notice-bg` | `#FFF7E8` | Maintenance notice pill background (card panel `#FFFBF2`) |
| `--color-notice-border` | `#E8C98A` | Maintenance notice border |
| `--color-notice-text` | `#7A4A00` | Maintenance notice text; icon ring uses gravel `#9A6414` |
| `--color-map-land` | `#EDF1F0` / `#E1E9DC` | Map placeholder tones (dev only) |

### 1.2 Theme colors (data → CSS variables set by `ThemeSwitcher`)

`--theme-primary`, `--theme-route`, `--theme-highlight` from `theme.colors`. Reference values:
winter `#2F5F96`, mtb `#6E4C8F`, gravel `#9A6414`, road `#A8323E`, touring `#3F6B4A`; highlight
`#E8A33D` for all. Derived: `--theme-primary-10` = primary at 10% alpha (selected pill background,
e.g. `#9A64141A`), `--theme-route-other` = route color lightened for non-selected routes of the same
theme (design uses `#C9A96B` for gravel; compute as 50% mix with white). Tinted surfaces per theme for
list cards: mtb `#F3F0F7`/text `#4A3163`, gravel border `#E4DCCB`, road border `#EDD9DB`,
touring border `#D9E3DB`, mtb border `#E3DCEC`.

Dark theme (`theme.dark === true`, winter): the whole map page turns dark – header and sidebar
`--color-night`, cards `#1E3243` with border `#2C425A`, text `--color-on-night`, muted `#9FB6C8`,
image placeholder `#22384A`, chips/tiles/share-bar tracks on `#22384A`, legend and layer picker
`#1E3243F2`. The map itself is NOT dimmed. On dark surfaces `--theme-primary` is too dark for text, so values and
the theme chip use `--theme-accent` (primary mixed 50 % with white, ≥ 4.5:1), links a 50 % river
tint, and ITRS badges get a 1 px hairline border so the black level stays visible. Theme identity must be visible in every theme: header
background tinted `--theme-primary-10`, the active theme pill filled with `--theme-primary` (white
text), sidebar header stripe 4 px `--theme-primary`, route list card left border 4 px
`--theme-primary` (already), key-figure values in `--theme-primary`.

### 1.3 ITRS palette (only for ITRS badges, filters and technical band)

| Level | Token | Value | Label fi / en |
|---|---|---|---|
| 1 | `--itrs-green` | `#2F7D46` | vihreä / green |
| 2 | `--itrs-blue` | `#1F5FA8` | sininen / blue |
| 3 | `--itrs-red` | `#B22B33` | punainen / red |
| 4 | `--itrs-black` | `#17181A` | musta / black |
| 5 | `--itrs-orange` | `#C25A17` | oranssi / orange |
| – | `--itrs-none` | `#5A6B7A` | Ei luokiteltu / Not rated |

Never use these on route lines.

### 1.4 Surface and traffic tokens

| Id | Fill | Note |
|---|---|---|
| `asphalt` | `#8C8F93` | solid |
| `paving` | `#A59B90` | solid |
| `gravel` | `#C2A878` | solid |
| `trail` | `repeating-linear-gradient(45deg,#9C7B4E 0 3px,#8A6C43 3px 6px)` | diagonal hatch |
| `boardwalk` | `repeating-linear-gradient(90deg,#B08A5A 0 4px,#9C7A4D 4px 7px)` | vertical stripes |
| `snow` | `#E3ECF2` + 1px border `#CBD8E0` | |
| `unknown` | `repeating-linear-gradient(45deg,#D6D9DB 0 3px,#C4C8CB 3px 6px)` | always hatched |
| `separated` | `#3F6B4A` | traffic |
| `quiet` | `#98A88B` | traffic |
| `busy` | `#8E5B3F` | traffic |

Every swatch has a text legend. Gravel vs trail differ by pattern, not only color.

### 1.5 Typography

Font: Atkinson Hyperlegible Next, self-hosted, weights 400/500/600/700. Fallback
`"Atkinson Hyperlegible", system-ui, sans-serif`. Scale (size/line-height):

| Role | Desktop | Mobile |
|---|---|---|
| Hero title | 700 62/1.08 | 700 32/1.12 |
| Page title (route card) | 700 26/1.2 | 700 21/1.2 |
| Section heading | 700 30/1.2 | – |
| Card title | 700 15–16/1.2 | 700 15/1.25 |
| Key figure value | 700 22/1.1 | 700 19/1.2 |
| Body | 400 15–16/1.55–1.6 | 400 13–15/1.5 |
| Label / caption | 400 11–12/1.2–1.4 | same |
| Eyebrow | 600 11/1, letter-spacing .08–.09em, uppercase, `--color-ink-muted` | same |
| Button | 600–700 13–15/1 | 700 16–17/1 in ride mode |
| Mono (ids, urls) | `ui-monospace, monospace` 11–12 | |

Numbers via `Intl.NumberFormat` (fi: `32,4 km`, `410 m`).

### 1.6 Shape and spacing

Pills and buttons: border-radius = half height (36 px → 18, 38 → 19, 44 → 22, 52 → 26, 56 → 28).
Cards: radius 8–10 px, border 1px `--color-border`. Badges (ITRS): radius 5–6 px, padding 5–6/10.
Chips (filters, tags): radius 14 px, padding 6/11, font 600 12. Shadows: cards
`0 3px 10px rgba(28,43,58,.16)`, floating map controls `0 3px 9px rgba(28,43,58,.22)`,
frames `0 18px 40px rgba(28,43,58,.14)`. Gap scale: 4, 6, 7, 8, 9, 10, 12, 14, 16, 22, 40.

### 1.7 Motion

Transitions only as a result of user action, ≤ 200 ms. `prefers-reduced-motion`: no transitions,
`fitBounds` without animation, landing video paused and poster shown.

## 2. Landing page (`#/`) – frame 4a/4b

Purpose: five theme buttons that lead straight to the map. No route list, search or map here.
A user arriving at a map URL never sees this page.

### 2.1 Desktop (1440 wide, hero 900 high)

- Hero: background `--color-night`; video or poster covers; two overlays: subtle diagonal texture
  (dev placeholder only) and gradient `linear-gradient(105deg, rgba(12,20,28,.92) 0 34%,
  rgba(12,20,28,.72) 52%, rgba(12,20,28,.34) 100%)` so text contrast never depends on the video.
- Header (absolute, height 76, padding 0 34): `HubLogo` 42 px dark variant + name (700 19, white)
  and subtitle (400 12, `#B9C9D6`); right: "Tietoa sivustosta" outline pill (38 h, border 1.5px
  `rgba(232,238,242,.45)`, text `#E8EEF2` 600 14) and language segment FI|EN (38 h, active segment
  filled `#E8EEF2` text `--color-night` 700 14, inactive text `#E8EEF2` 600 14).
- Copy block (left 34, top 186, width 780, gap 26): h2 62/1.08 white
  "Rovaniemen pyöräreitit yhdellä kartalla"; lead 400 19/1.55 `#DCE5EC` max-width 600.
- Eyebrow "Millä pyörällä liikut?" 600 12 uppercase `.12em` `#B9C9D6`.
- Theme cards row (gap 10, wrap): each 148 wide, white, radius 10, padding 14/14/13,
  `border-top: 4px solid <theme.primary>`; title 700 16 `--color-ink`, tagline 400 12/1.4
  `--color-ink-muted`, count line 700 13 in theme color "N reittiä →". Card is an `<a>` to
  `#/<lang>/<theme>/`. Count from `catalog.routes` filtered by theme.
- Below: outline pill 44 h "Avaa kartta kaikilla reiteillä" → `#/<lang>/all/`, and note
  "Valinta muistetaan, ja osoite on jaettavissa: `#/fi/gravel/`" (400 14, `#B9C9D6`, mono url).
- Bottom-right controls (right 34, bottom 34): "❚❚ Pysäytä video" pill (36 h, bg
  `rgba(12,20,28,.55)`, border 1px `rgba(232,238,242,.35)`), always visible when video plays;
  helper text 400 11 `#9FB6C8` max 230 wide.
- Bottom-center scroll hint "Mikä tämä sivusto on ↓" (400 12 + 15, `#B9C9D6`).
- Section 2 (padding 56/34/46, gap 40, border-bottom `--color-border`): left column 420 wide:
  h3 700 30 "Harrastajien kokoama sivusto", two paragraphs 400 16/1.6 `#2A3A49`, sample
  `MaintenanceNotice` pill + "tältä merkintä näyttää". Right: 2×2 grid (gap 14) of promise cards
  (border, radius 9, padding 16): "Vie reitti mukaasi", "Vaativuus sanoina", "Pinta ja liikenne",
  "Lähteet näkyvissä" (was "Kerro korjauksista" until AP39) – title 700 16, text 400 14/1.55.
- Header brand (logo + name + subtitle) on every page is a link to `#/` (landing), `aria-label`
  "Etusivulle".
- Footer (below section 3, padding 22/34, bg `--color-snow`, border-top, 400 12 muted): links
  "Saavutettavuusseloste" → `#/<lang>/accessibility` and "Tietosuojaseloste" → `#/<lang>/privacy`,
  plus "© <year> Napa ja piirit". The two statement pages are plain document pages (max-width 720,
  padding 40/34, headings 700 22/16, text 400 15/1.6) with the site header and a back link; their
  content lives in the locale files (`page.accessibility.*`, `page.privacy.*`).
- Section 3 (padding 36/34/40, bg `--color-snow`): "Mistä tiedot tulevat" (420 col) + wrapped
  source list 400 13 (`© OpenStreetMap-tekijät (ODbL)`, `© Maanmittauslaitos, maastokartta
  (CC BY 4.0)`, `© Luonnonvarakeskus, satoennusteet`, `Kunnan reittirekisteri (Lipas)`,
  `Visit Finland, palvelutiedot`) + 250-wide "Omalla vastuulla" disclaimer.

### 2.2 Mobile (390 × 844)

- Poster only, no video. Gradient `180deg rgba(12,20,28,.6) 0 22%, .9 52%, .96 100%`.
- Header row (top 60, inset 18): logo 34 px (3 arcs variant acceptable at this size), name 700 17
  white, right FI pill 32 h.
- Title 700 32/1.12 white "Rovaniemen pyöräreitit"; lead 400 15/1.5 `#DCE5EC`.
- Theme list (top 250, gap 9): rows 62 h, white, radius 10, `border-left: 5px solid theme`,
  padding 0 15; title 700 16, subline 400 12 muted "N reittiä · <short tagline>", arrow 700 17
  theme color at right. Then outline pill 50 h "Avaa kartta kaikilla reiteillä".
- Footer block (bottom 20): "Harrastajien kokoama sivusto" 700 14 white, note 400 13 `#B9C9D6`,
  "Lue lisää ↓" 600 13 `#DCE5EC` scrolls to sections 2–3 (same content, stacked).

### 2.3 Video

Files in `public/landing/`: `hero.mp4` (H.264, 1280×720, 24 fps, muted, 39 s, 4.6 MB) and
`poster.jpg` (186 kB, first second of the clip). Markup:
`<video muted autoplay loop playsinline poster="landing/poster.jpg"><source src="landing/hero.mp4" type="video/mp4"></video>`.
WebM is optional and currently absent (H.264 is universally supported; a second file would break
the bandwidth budget). Not loaded on viewports < 700 px, on `prefers-reduced-motion`, or when
`navigator.connection.saveData` is on or `effectiveType` is `slow-2g`/`2g` (3g and wired networks
misreported as 3g DO get the video: `preload="metadata"`, playback starts on `canplay`; until then
the poster shows). Missing files → poster; missing poster
→ flat `--color-night`. The footage is bright (autumn birch, blue sky): the hero gradient overlay
(§2.1) is what guarantees text contrast and must not be weakened. Keep any future re-cut's action
on the right third of the frame; the left third is darkened.

## 3. Map page (`#/<lang>/<theme>/`) – frame 3a

### 3.1 Layout (1440 × 900)

- Header 60 h, padding 0 20, gap 22, border-bottom `--color-border`: `HubLogo` 36 px light
  variant (selected theme full color 3.4 px, others opacity .3 2.6 px, dashed outer circle
  `--color-ink` opacity .45, hub `--color-ink`) + name 700 16 / subtitle 400 11 muted.
- `ThemeSwitcher` nav (`aria-label` "Teema"): pills 36 h, padding 0 13 0 10, gap 7; each has a
  10 px color dot + name 600 13. Inactive: white bg, border 1.5px `--color-border`, text
  `--color-ink-soft`. Active: bg `--theme-primary-10`, border 1.5px theme, text theme color.
  Names always visible (never color only). `aria-pressed`.
- Right group: language segment FI|EN (the `ReportButton` was removed 15.9.2026, AP39) (36 h, active `--color-ink` bg white text
  700 13, inactive text `--color-ink-soft` 600 13).
- Body: sidebar 404 wide, `--color-snow`, border-right; map fills the rest.

### 3.2 Sidebar – filters block (padding 15/18/13, border-bottom)

- Row: theme name 700 17 + "3 / 5 reittiä" 400 13 muted.
- `RouteFilters` from `theme.presentation.filters`, always in that order, each with an eyebrow
  label and chips:
  - `length`: three ranges "alle 20 km", "20–40 km", "yli 40 km". Active chip filled theme color,
    white text; inactive white, border `--color-border`, text `--color-ink-soft`.
  - `dominant_surface`: chips with 10×10 radius-2 swatch + name; `mixed` has no swatch.
  - `itrs_technical` ("enintään"): five 6-px-radius badges "1".."5" in ITRS colors; levels above the
    selected max are outlined (border `--color-border`, text muted).
  - `separated_share` ("vähintään"): 6 px slider track, fill `separated` color, value 700 13 "40 %".
  - `winter_maintenance`: chips `groomed` (filled theme), `plowed`, `none`.
  - `difficulty`: chips easy/moderate/demanding. `ascent`: chips "alle 200 m", "200–500 m", "yli 500 m".
- If routes without the field exist, a "ei tietoa" chip is always present so unknowns never
  silently disappear.
- Info box (white, border, radius 7, padding 8/10, 400 12/1.45): "Rajaus jätti N reittiä pois."

### 3.3 Sidebar – route list (padding 13/18, gap 10)

`RouteListCard`: white, radius 8, padding 12, border 1px `--color-border`,
`border-left: 4px solid` (selected: theme color + border theme color + shadow
`0 3px 10px <theme rgba .16>`; others: `--theme-route-other`). Content:
- Row: image 88×66 radius 5 (cover image or hardest section per `theme.presentation.hero_image`;
  placeholder when missing) + column: title 700 15/1.2 (+ `MaintenanceNotice` pill inline when
  `maintainer === 'non_municipal'`), then 2-col grid of the first two key figures (label 400 11
  muted + value 700 14).
- Third key figure below (e.g. `surface_shares` as `ShareBar` 12 h with caption
  "sora 66 % · asfaltti 22 % · …"). When the field is missing: omit entirely. Design shows an
  explanatory muted box only in the mock; production shows nothing.
- Hover/focus on card → highlight that route line on the map; clicking the line scrolls the list
  to the card. Selected badge on map top-left: white box radius 8 "Valittu: <name>".

### 3.4 Map

- Route lines: selected route theme `route` color width 6 with `--color-snow` casing 13, round
  caps; other routes of the theme `--theme-route-other` width 4, casing 9; start/end circles
  r 8 white with 3 px theme stroke. Opened route highlight `--color-midnight-sun` width 4.
- Topo coverage boundary: dashed 1.5 px `--color-ink` opacity .35, dash 7 7.
- Service markers: pill 34 h, white, radius 17, shadow, padding 0 11 0 6: 24 px circle icon
  (`--color-river`, lean_to/hut use touring green `#3F6B4A`) + name 600 13 + "km 4,2" 400 12 muted.
  Issue marker: 30 px white circle, 2.5 px `--color-midnight-sun` ring, "!" 700 13 gravel text.
- Band cursor marker: dark tooltip (`--color-ink`, radius 6, 600 12 white "km 19,4 · sora ·
  hiljainen tie"), 2 px stem 34 h, 14 px white dot with 3 px ink border.
- Controls top-right: 38×38 white tiles "+", "−", "Tasot" (600 12 river) stacked, radius 8, shadow.
- Layer picker (opens from the "Tasot" tile, `aria-expanded`, closes on Escape and outside click):
  popover below the controls (right 14, top 152, width 260, white, border, radius 9, shadow,
  padding 12/14). Section eyebrows 600 11 uppercase muted: "Pohjakartta" – radio list of the
  `base`-slot layers available for the theme (ARKKITEHTUURI 5.4 `available()`), plus "Ei
  pohjakarttaa"; "Tasot" – checkbox list of `raster`/`area`/`points` layers. Row: control + name
  600 13 `--color-ink`; caption below 400 11 muted "<attribution> · haettu <date>" (date only when
  `fetched_at`). Initial state per `on_initially()`; choices remembered per theme in
  `localStorage` (`layers:<theme>`). Empty catalog → tile disabled. Mobile: same popover, width
  calc(100vw − 28px).
- While a `base`-slot layer is selected, the hardcoded OSM basemap is hidden (base maps may be
  partly transparent; nothing must bleed through). "Ei pohjakarttaa" shows OSM again.
- No dim overlay on the map for `dark` themes (removed 14.9.2026 on review): the base map is shown as is.
- The picker's "Tasot" list starts with a frontend-only entry "Palvelut reitillä" (checkbox,
  default on, remembered with the layer state as `services`) that toggles the nearby-service
  pills of the open route and the all-services circle layer.
- Clicking a row in the route card's services block flies the map to the service (zoom 15) and
  sets the band cursor to its km.
- Raster layers with `legend` entries show them in the legend box (swatch 11×11 + label) while on.
- Legend box bottom-left (left 14, bottom 56, width 236, `#FFFFFFF2`, border, radius 9, padding
  11/13): title "Kartalla" 700 13; rows 400 12: selected route swatch 22×5 theme, other routes
  22×4 lighter, coverage dashed line, divider, service categories from
  `presentation.service_categories_first` (first labelled "· teeman ensisijainen"), issue marker.
- Attribution bottom-right: `#FFFFFFDB`, 400 11, "© OpenStreetMap-tekijät · © Maanmittauslaitos"
  (assembled from visible layers).

## 4. Route card (`#/<lang>/<theme>/route/<id>`) – frame 3b

### 4.1 Header (60 h)

Left: back link 600 14 `--color-river` "← Maasto · 6 reittiä". Right: `GpxButton` filled theme
pill 38 h "Lataa GPX" + size 400 11 opacity .8 "1,2 MB" (from `gpx_bytes`); "Aja reittiä" outline
pill 38 h (border 1.5px theme, text theme 600 14; on mobile this is primary); language segment.

### 4.2 Left panel (560 wide, scrolls, padding 18/22, gap 14)

Order of blocks is driven by the theme: mtb/winter put ITRS and hardest section before the
description; gravel/road put cover image and surface shares first.

1. Title 700 26/1.2 + chip row (gap 8): theme chip (theme tinted bg, e.g. `#F3F0F7` / `#4A3163`),
   seasons chip (`--color-snow` bg), "Vaativuus: vaativa" chip, `MaintenanceNotice` pill.
2. `MaintenanceNotice` panel (only when `non_municipal`): border `--color-notice-border`, bg
   `#FFFBF2`, radius 9, padding 13/14; title 700 14 notice-text "Ei kunnan ylläpitämä reitti";
   intro 400 13/1.55; bullet list of reasons from `non_municipal_reasons` (bullet "·" 700 gravel
   color, text 400 13/1.5 `#2A3A49`); optional `maintenance_note`. Tapping the pill scrolls here.
3. Eyebrow "Avainluvut" + `KeyFigures` 2-col grid (gap 9): tiles border radius 8 padding 11/12;
   label 400 11 muted; value: `ItrsBadge` for ITRS figures, else 700 22/1.1 value with unit.
   Below: 400 12 muted line "Altistus 1 · Erämaisuus 2 | Arvioija M. Pajula, 14.8.2026"
   (exposure/wilderness as plain numbers until scale is verified; assessed_by/on).
4. Eyebrow "Reitin vaativin kohta" + card (border, radius 9, flex): image 188×128 + text column
   padding 12/14: `ItrsBadge` small (11 px badge) + "km 19,4" 700 14; description 400 14/1.5;
   hint 400 12 river "Napauta: kartta keskittyy kohtaan" (click → `flyTo` km on track).
5. Eyebrow "Nauha" + caption "korkeus · tekninen vaikeus · pinta" (from `presentation.band`).
   `RouteBand` box (border, radius 9, padding 11/12, gap 6, position relative):
   - Elevation SVG height 84 (mobile 68), `preserveAspectRatio="none"`, area fill theme color
     opacity .14, line theme 2.2 px, `aria-label` "Korkeusprofiili".
   - Up to 3 lanes, each 14 h radius 3, gap 6, segments as flex children sized by length
     (`flex: <km>`); fills from §1.3/§1.4; `null` → `unknown` hatch.
   - Axis row 18 h: "0 km", midpoint, total "21,3 km" (400 11 muted).
   - Cursor: 1.5 px vertical `--color-ink` line across all lanes; tooltip (dark, 600 11/1.35)
     "km 19,4 · 248 m / punainen · polku". Hit target is the full band height, ≥ 44 px on touch.
     Cursor position mirrors to the map marker and vice versa via `track.properties.km`.
   - Legend row below (gap 14, 400 11): swatch 11×11 radius 2 + label; unknown shows "%".
6. Eyebrow "Tekninen vaikeus osuuksina" + `ShareBar` 16 h radius 8 border + legend chips
   "1 vihreä 20 %" etc. (same component for `surface_shares` and `traffic_shares`).
7. Eyebrow "Palvelut reitillä" + caption "vesipiste ja laavu ensin"; rows (border, radius 7,
   padding 9/11): 22 px category icon circle + name 400 14 + "km 2,1" 400 12 muted right.
   Order: `service_categories_first` categories first, then by km. Below: `--color-snow` box
   "Pisin väli ilman palveluja" 400 13 + "12,1 km" 700 15 + "km 8,7 → 20,8" 400 12 muted.
8. Description 400 15/1.6 `#2A3A49`, then sections (`Text`, `Gallery`, `Video`,
   `ElevationProfile`).

Missing data hides the block (P11). Exception: an ITRS key figure listed in the theme but missing
on the route renders `ItrsBadge` in `--itrs-none` with "Ei luokiteltu".

### 4.3 Map (right)

As §3.4 plus: hardest-section marker (dark tooltip "km 19,4 · vaativin kohta", 2 px stem 26 h,
18 px dot in `--itrs-red` with 3 px white border and shadow); `fitBounds` to route bbox padding 40.

## 5. Mobile route card and ride mode – frame 3e (390 × 844)

### 5.0 Map page below 700 px – bottom sheet (added 15.9.2026 after the mobile review)

- The map fills the viewport below the 56 px header; the sidebar becomes a **bottom sheet** over
  the map (white / `--surface-panel`, radius 16 16 0 0, shadow, drag handle 36×4 `--color-border`
  centred in a 24 px grab area). Two states: **open** (top at 45 dvh; the sheet scrolls inside)
  and **peek** (top at calc(100dvh − 64px): only the handle and the title row are visible – theme
  name + "3 / 5 reittiä", or the route title). Drag the handle or tap it to toggle; keyboard:
  the handle is a `button` with `aria-expanded`. State per page kept in the route query
  (`?sheet=peek`) so back/forward restores it. Default: list page open, route page open.
- A floating pill "Kartta koko näytölle" / "Näytä lista" is not needed: the handle is the control.
- Map controls (+ − Tasot) stay top-right and are never covered; the layer picker opens as a
  full-width sheet from the top (below the controls) on mobile.
- Legend box hidden below 700 px (already); attribution stays.
- Service pills on mobile: only services in the theme's `service_categories_first` categories
  get a pill; the rest are 10 px dots (theme stroke) – tapping a dot opens the popup. The picker's
  "Palvelut reitillä" hides both.
- The band cursor, hardest marker and popups work as on desktop.

### 5.1 Route card

- Hero image 176 h (hardest section or cover per theme) with floating "← Maasto" white pill
  (36 h, left/top 14) and bottom-left badges: `ItrsBadge` + "km 19,4" white pill `#FFFFFFE8`.
- Body padding 14/16 gap 13: title 700 21/1.2; `KeyFigures` 2×2 tiles (padding 9/11, value 700
  19); `RouteBand` compact (elevation 68 h, lanes 14 h, axis ends only); longest-gap box; pushed
  to bottom: primary pill 52 h filled theme "Aja reittiä", outline pill 52 h "Lataa GPX".
- Below 700 px the card is the bottom sheet body (§5.0); the hero image is the first block and
  the description/gallery/services follow the buttons in the scroll.

### 5.2 Ride mode (`…/ride`)

- Full-screen dark map (`--color-night`; route line in a lightened theme tint, e.g. `#A98BC8`
  for mtb, width 7 with 14 px night casing). No basemap labels needed.
- Status bar overlay 44 h `#1C2B3AE6`.
- Top panel (inset 14, top 56, `--color-night-soft`, border `#2C4056`, radius 12, padding 13/15):
  route name 700 15 white; "8,4" 700 34 white + "/ 21,3 km ajettu" 400 15 `#9FB6C8`; progress bar
  8 h radius 4 track `#2C4056`, fill theme tint.
- Position dot 22 px theme tint, 4 px white border, halo `0 0 0 8px rgba(<tint>,.28)`.
- Bottom stack (inset 14, bottom 20, gap 10): next-service card (34 px category icon, name 700 15
  white, "seuraava palvelu · 0,3 km" 400 15; the distance is `service.km − ridden km`); primary 56 h pill theme tint bg, `--color-night`
  text 700 17 "Keskitä sijaintiin"; outline 56 h "Lopeta" (border 1.5px `#7A8EA0`, text `#E8EEF2`
  600 16, translucent night fill behind the outline; "Ilmoita ongelmasta" removed per AP39); footnote 400 15 `#9FB6C8`
  centered "Näyttö pidetään päällä, jos selain tukee sitä. Ei ääniohjeita eikä käännösohjeita."
- Rules: ≤ 3 buttons, 56 px high; all text ≥ 15 px; geolocation permission requested only here
  (`navigator.geolocation.watchPosition`, high accuracy; an explicit "Salli sijainti" primary
  button appears first – iOS grants the permission only from a user gesture; denied → message
  and the map still shows the route); distance ridden = nearest index in `track.properties.km`
  (P3, no computation beyond the nearest coordinate); Screen Wake Lock if available; the position
  never leaves the browser (chapter 13). Basemap: OSM dimmed with a `--color-night` overlay at
  .55 so the route tint stands out; the theme's base layer is not used here.

## 6. Component catalogue

| Component | Props (data) | Notes |
|---|---|---|
| `HubLogo` | `themes`, `selected?`, `variant: 'light' \| 'dark'`, `size` | Rings from inner to outer by `order`; radii for 5 themes at viewBox −32..32: 7, 11, 15, 19, 23; dashed outer r 27–28 dash 3 5; hub r 3.4. Arc dasharray ≈ 78% of circumference, rotation offsets 0/20/60/100/140 for a spiral of gaps. Light variant: theme colors, selected 3.4 px others .3 opacity; dark variant: tints (`#7FA8D4`, `#A98BC8`, `#E2A94B`, `#E0737E`, `#7FBF9A`), white hub. |
| `ThemeSwitcher` | `themes`, `current` | §3.1 pills; sets `--theme-*` on `:root`; mobile collapses to logo + sheet. |
| `RouteFilters` | `filters`, `routes`, `model` | §3.2; pure filter function in `src/data/filters.ts`. |
| `RouteListCard` | `route`, `theme`, `selected` | §3.3. |
| `KeyFigures` | `figures`, `route`, `limit?` | Renders in theme order; `limit: 3` in list. |
| `ItrsBadge` | `level \| null`, `size: 'sm' \| 'md'` | "3 punainen"; null → "Ei luokiteltu" `--itrs-none`. Number precedes name; works in monochrome and screen readers. |
| `RouteBand` | `profile`, `segments`, `lanes`, `lengthKm`, `cursorKm` (v-model) | §4.2 item 5. |
| `ShareBar` | `shares`, `kind: 'surface' \| 'traffic' \| 'itrs'`, `height` | §4.2 item 6; legend text always. |
| `MaintenanceNotice` | `route`, `variant: 'pill' \| 'panel'` | Only when `maintainer === 'non_municipal'`; pill: bg notice-bg, border notice-border, text 700 11–12 notice-text, 12–14 px "i" ring gravel. |
| `GpxButton` | `href`, `bytes` | Filled theme pill with size. |
| `RideMode` | `route`, `track` | §5.2. |
| `Legend` (map) | `layers`, `theme` | §3.4 legend box. |
| `PoiPopup` | `service` | Name, category, source + fetched date, "Näytä lähde". |
| `ReportButton` | `route?` | Hint text before location pick; pick → drag to refine → preview (location, route) → GitHub form. |

## 7. Accessibility and quality gates

- Theme, ITRS, surface and traffic are never conveyed by color alone: names, numbers, patterns.
- All interactive elements keyboard reachable; pills `aria-pressed`; band has keyboard cursor
  (arrow keys move 0.1 km).
- Contrast ≥ 4.5:1 for text; theme primaries verified by build; notice-text on notice-bg 7.4:1.
- Touch targets ≥ 44 px (ride mode 56).
- `prefers-reduced-motion` honored everywhere (§1.7).
- New dependency ≤ 50 kB gzipped per feature (P9); report bundle size in every PR.
