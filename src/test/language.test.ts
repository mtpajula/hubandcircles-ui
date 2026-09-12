import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import fi from '../locales/fi.json'

/**
 * P10 guard: all code, identifiers, file names and translation keys are English. Finnish is
 * allowed only in `fi.json` values. String literals and comments are stripped best-effort before
 * scanning so that Finnish UI text in tests or log messages does not trip the guard.
 */

/** Finnish word stems that must not appear as a whole camelCase / snake_case segment. */
const FINNISH_STEMS = new Set(
  (
    'reitti reitit teema teemat taso tasot nimi kaudet vaativuus jalki palvelu palvelut kieli ' +
    'kielet valinta polku polut skeema muotoilu paikat teksti kartta tila lataa virhe avattu ' +
    'valmis alusta tyyli vari korostus oletus'
  ).split(' '),
)

// a-umlaut, o-umlaut, a-ring in both cases, built from code points so this file passes its own check.
const FINNISH_LETTERS = new RegExp(`[${String.fromCharCode(0xe4, 0xf6, 0xe5, 0xc4, 0xd6, 0xc5)}]`)
const IDENTIFIER = /[A-Za-z_][A-Za-z0-9_]*/g

/** Every src/**\/*.{ts,vue} file as raw text, except the generated src/types/. */
const sourceFiles: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob('/src/**/*.{ts,vue}', { query: '?raw', import: 'default', eager: true }),
  )
    .filter(([file]) => !file.startsWith('/src/types/'))
    .map(([file, source]) => [file.replace(/^\/src\//, ''), source as string]),
)

/** Splits an identifier into lower-cased camelCase / snake_case / kebab-case segments. */
function segments(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-.]+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean)
}

interface StripOptions {
  quotes: string
  lineComments: boolean
}

/** Removes string literals (with their template expressions) and comments from code. */
function stripLiterals(code: string, opts: StripOptions): string {
  let out = ''
  let i = 0
  while (i < code.length) {
    const ch = code[i]!
    const next = code[i + 1]
    if (opts.lineComments && ch === '/' && next === '/') {
      const end = code.indexOf('\n', i)
      i = end === -1 ? code.length : end
      continue
    }
    if (ch === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? code.length : end + 2
      out += ' '
      continue
    }
    if (opts.quotes.includes(ch)) {
      let j = i + 1
      while (j < code.length && code[j] !== ch) {
        if (code[j] === '\\') j += 1
        if (ch !== '`' && code[j] === '\n') break
        j += 1
      }
      i = j + 1
      out += ' '
      continue
    }
    out += ch
    i += 1
  }
  return out
}

/** Vue SFC -> scannable code: script and style blocks as-is, template without text nodes. */
function scannableCode(file: string, source: string): string {
  if (file.endsWith('.ts')) return stripLiterals(source, { quotes: '\'"`', lineComments: true })

  const blocks: string[] = []
  const rest = source
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (_m, body: string) => {
      blocks.push(stripLiterals(body, { quotes: '\'"`', lineComments: true }))
      return ''
    })
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (_m, body: string) => {
      blocks.push(stripLiterals(body, { quotes: '\'"', lineComments: false }))
      return ''
    })
  // Template: keep interpolations and tags (attribute expressions), drop comments and text nodes.
  const template = rest.replace(/<!--[\s\S]*?-->/g, ' ')
  const interpolations = [...template.matchAll(/\{\{([\s\S]*?)\}\}/g)].map((m) => m[1] ?? '')
  const tagsOnly = template.replace(/>[^<]*</g, '><')
  blocks.push(
    stripLiterals([tagsOnly, ...interpolations].join('\n'), { quotes: "'`", lineComments: false }),
  )
  return blocks.join('\n')
}

function finnishIdentifiers(code: string): string[] {
  const hits = new Set<string>()
  for (const match of code.match(IDENTIFIER) ?? []) {
    if (segments(match).some((s) => FINNISH_STEMS.has(s))) hits.add(match)
  }
  return [...hits]
}

function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

function leafValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((v) =>
    typeof v === 'object' && v !== null ? leafValues(v as Record<string, unknown>) : [String(v)],
  )
}

const files = Object.keys(sourceFiles)

describe('language rule (P10)', () => {
  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('file and directory names are English', () => {
    const offending = files.filter(
      (rel) =>
        FINNISH_LETTERS.test(rel) ||
        rel.split('/').some((part) => segments(part).some((s) => FINNISH_STEMS.has(s))),
    )
    expect(offending).toEqual([])
  })

  it('code identifiers are English', () => {
    const offending: Record<string, string[]> = {}
    for (const [file, source] of Object.entries(sourceFiles)) {
      const code = scannableCode(file, source)
      const hits = finnishIdentifiers(code)
      if (FINNISH_LETTERS.test(code)) hits.push('<non-ASCII letters in code>')
      if (hits.length > 0) offending[file] = hits.sort()
    }
    expect(offending).toEqual({})
  })

  it('translation keys are English', () => {
    const offending = keyPaths(fi).filter(
      (key) => FINNISH_LETTERS.test(key) || segments(key).some((s) => FINNISH_STEMS.has(s)),
    )
    expect(offending).toEqual([])
  })

  it('en.json values contain no Finnish letters', () => {
    expect(leafValues(en).filter((v) => FINNISH_LETTERS.test(v))).toEqual([])
  })
})
