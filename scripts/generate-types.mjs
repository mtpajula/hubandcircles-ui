// Generates TypeScript types from repo A's JSON Schema (ARKKITEHTUURI.md chapter 11).
// Usage: SCHEMA_DIR=../hubandcircles-manager/schema node scripts/generate-types.mjs
import { compile } from 'json-schema-to-typescript'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const schemaDir = path.resolve(root, process.env.SCHEMA_DIR ?? '../hubandcircles-manager/schema')
const outDir = path.join(root, 'src', 'types')

// The contract is the published data schema (chapter 11). Source data and tool models are not
// part of the frontend. Schema name -> output file name (without .ts).
const CONTRACT = { catalog: 'catalog', publishedroute: 'route', service: 'service' }
const files = (await readdir(schemaDir))
  .filter((n) => n.replace(/\.schema\.json$/, '') in CONTRACT)
  .sort()
if (files.length === 0) {
  console.error(`No schema files found in ${schemaDir}`)
  process.exit(1)
}

// json-schema-to-typescript does not know draft 2020-12's `prefixItems` (pydantic v2 tuples).
// Convert it to the draft-07 tuple form `items: [...]` before compiling.
function convertPrefixItems(node) {
  if (Array.isArray(node)) return node.map(convertPrefixItems)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(node)) {
      if (key === 'prefixItems' && !('items' in node)) out.items = convertPrefixItems(value)
      else if (key !== 'prefixItems') out[key] = convertPrefixItems(value)
    }
    return out
  }
  return node
}

await mkdir(outDir, { recursive: true })
for (const file of files) {
  const schemaName = file.replace(/\.schema\.json$/, '')
  const outName = CONTRACT[schemaName]
  const schema = convertPrefixItems(JSON.parse(await readFile(path.join(schemaDir, file), 'utf8')))
  const ts = await compile(schema, outName, {
    bannerComment: `/* eslint-disable */\n/**\n * GENERATED FILE - do not edit by hand.\n * Source: ${file} (repo A, hubandcircles-manager/schema).\n * Regenerate with: npm run types\n */`,
    additionalProperties: false,
    style: { semi: false, singleQuote: true, printWidth: 100 },
  })
  await writeFile(path.join(outDir, `${outName}.ts`), ts)
  console.log(`${file} -> src/types/${outName}.ts`)
}
