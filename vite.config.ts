import vue from '@vitejs/plugin-vue'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
}

/**
 * Serves the manager build output at /data/ in the dev server only, so it never lands in dist/
 * (manager publish refuses a frontend that carries a data/ directory).
 */
function devData(dir: string): Plugin {
  return {
    name: 'dev-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res) => {
        const file = resolve(dir, decodeURIComponent(req.url ?? '/').replace(/^\/+/, ''))
        if (!file.startsWith(join(dir, '/')) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404
          return res.end()
        }
        res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [vue(), devData(resolve(process.env.HC_DATA_DIR ?? '../hubandcircles-manager/dist'))],
})
