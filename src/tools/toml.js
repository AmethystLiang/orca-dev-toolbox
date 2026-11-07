// TOML ↔ JSON and YAML, with smol-toml (BSD-3-Clause), bundled.
import { parse, stringify } from 'smol-toml'
import { dump } from 'js-yaml'
import { parseYaml } from './yaml.js'

export const TOML_TARGETS = [['json', 'JSON'], ['yaml', 'YAML'], ['toml', 'TOML']]

/** Which format pasted text is in: JSON when it parses as an object, TOML, else YAML. */
export function guessFormat(text) {
  const value = text.trim()
  if (/^[[{]/.test(value)) {
    try {
      JSON.parse(value)
      return 'json'
    } catch {}
  }
  // A [table] header or key = value at the start of a line, and no YAML key: value lines.
  if (/^\s*\[\[?[\w."' -]+\]\]?\s*$/m.test(value) || /^\s*[\w."-]+\s*=\s*\S/m.test(value)) {
    if (!/^\s*[\w."-]+:\s/m.test(value) || /^\s*\[[\w."' -]+\]\s*$/m.test(value)) return 'toml'
  }
  return 'yaml'
}

function readToml(text) {
  try {
    return parse(text)
  } catch (error) {
    const where = error.line ? ` (line ${error.line}, column ${error.column})` : ''
    throw new Error(`Not valid TOML${where}: ${String(error.message).split('\n')[0].replace(/^Invalid TOML document: /, '')}`)
  }
}

/** The value of text in `format`: json, yaml or toml. */
export function readValue(text, format) {
  if (format === 'toml') return readToml(text)
  if (format === 'json') {
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new Error(`Not valid JSON: ${error.message}`)
    }
  }
  return parseYaml(text).value
}

// TOML has no null, and its top level must be a table; dates are written as plain strings.
function tomlReady(value, path = '') {
  if (value === null || value === undefined) throw new Error(`TOML has no null: ${path || 'the document'} needs a value or to be left out.`)
  if (Array.isArray(value)) return value.map((item, i) => tomlReady(item, `${path}[${i}]`))
  if (value instanceof Date) return value
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tomlReady(item, path ? `${path}.${key}` : key)]))
  return value
}

// Dates from TOML become ISO strings in JSON and YAML; TOML's local dates and times keep their text.
function plain(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(plain)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]))
  return value
}

/** Text in `to` (json, yaml or toml) for a value read from another format. */
export function writeValue(value, to) {
  if (to === 'json') return JSON.stringify(plain(value), null, 2)
  if (to === 'yaml') return dump(plain(value), { indent: 2, lineWidth: -1, noRefs: true })
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('TOML documents are tables: the top level must be an object.')
  return stringify(tomlReady(value)).trimEnd() + '\n'
}

export function convert(text, from, to) {
  return writeValue(readValue(text, from), to)
}
