/* global fetch, document */
// Browser smoke test against a running preview (manager `preview` or any static host).
// Usage: SMOKE_URL=http://127.0.0.1:8767 npm run smoke   (requires Google Chrome installed)
//
// Visits the landing page, a theme page, the `all` view and the first route of catalog.json and
// fails on: page errors, console errors, a missing map canvas, a MapLibre worker or track request
// that did not return 200 (the AP34 regression), "undefined"/"NaN" in the visible text, and a
// route page without the GPX button. The map instance is not exposed by the app, so rendered
// features cannot be queried; the network assertions stand in for it.
import { chromium } from 'playwright-core'

const base = (process.env.SMOKE_URL ?? 'http://127.0.0.1:8767').replace(/\/$/, '')
const failures = []
const fail = (message) => failures.push(message)

async function readCatalog() {
  try {
    const response = await fetch(`${base}/data/catalog.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (e) {
    console.error(
      `smoke: cannot read ${base}/data/catalog.json: ${e.message} (is the preview running?)`,
    )
    process.exit(1)
  }
}
const catalog = await readCatalog()
const lang = catalog.project.default_language
const routeId = catalog.routes[0]?.id
// The route's own theme, so that the route page is reachable from the list it belongs to.
const theme = catalog.routes[0]?.themes[0] ?? catalog.project.default_theme
if (!routeId) {
  console.error('smoke: catalog.json has no routes')
  process.exit(1)
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const responses = []
page.on('response', (r) => responses.push({ url: r.url(), status: r.status() }))
page.on('pageerror', (e) => fail(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('GL Driver')) fail(`console error: ${m.text()}`)
})

const status = (pattern) => responses.filter((r) => pattern.test(r.url)).map((r) => r.status)

async function visit(hash, { map, route } = {}) {
  const before = failures.length
  // Cold load per page: a hash change alone would not reload the app or refetch the worker.
  // `responses` accumulates over the session because the browser may serve repeats from cache.
  await page.goto('about:blank')
  await page.goto(`${base}/${hash}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500) // let MapLibre load its worker and the overview
  const text = await page.evaluate(() => document.body.innerText)
  if (/\bundefined\b|\bNaN\b/.test(text)) fail(`${hash}: "undefined" or "NaN" in visible text`)
  if (map) {
    if ((await page.locator('.maplibregl-map canvas').count()) === 0) fail(`${hash}: no map canvas`)
    const worker = status(/\/assets\/maplibre-gl-worker-[^/]*\.js$/)
    if (!worker.includes(200)) fail(`${hash}: MapLibre worker request not 200 (${worker})`)
    const data = status(route ? /\/track\.geojson$/ : /\/overview\.geojson$/)
    if (!data.includes(200)) fail(`${hash}: track/overview request not 200 (${data})`)
  }
  if (route && (await page.locator('a.gpx[download]').count()) === 0) fail(`${hash}: no GPX button`)
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${hash}`)
}

await visit('#/')
await visit(`#/${lang}/${theme}/`, { map: true })
await visit(`#/${lang}/all/`, { map: true })
await visit(`#/${lang}/${theme}/route/${routeId}`, {
  map: true,
  route: true,
})
await browser.close()

if (failures.length > 0) {
  console.error(
    `smoke: ${failures.length} failure(s)\n${failures.map((f) => `  - ${f}`).join('\n')}`,
  )
  process.exit(1)
}
console.log('smoke: all pages ok')
