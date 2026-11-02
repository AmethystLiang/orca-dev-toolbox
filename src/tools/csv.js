// CSV ↔ JSON, RFC 4180: quoted fields, doubled quotes, line breaks inside quotes.

const DELIMITERS = [',', ';', '\t', '|']

/** The delimiter that splits the first line into the most, consistently, fields. */
export function guessDelimiter(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim()).slice(0, 10)
  let best = ','
  let bestScore = 0
  for (const delimiter of DELIMITERS) {
    const counts = lines.map((line) => parseCsv(line, delimiter)[0]?.length ?? 0)
    const consistent = counts.every((count) => count === counts[0])
    const score = counts[0] > 1 ? counts[0] * (consistent ? 2 : 1) : 0
    if (score > bestScore) [best, bestScore] = [delimiter, score]
  }
  return best
}

/** Rows of fields. */
export function parseCsv(text, delimiter = ',') {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  let i = 0
  const src = text.replace(/^﻿/, '')
  while (i < src.length) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"' && field === '') {
      quoted = true
      i++
    } else if (c === delimiter) {
      row.push(field)
      field = ''
      i++
    } else if (c === '\n' || c === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += c === '\r' && src[i + 1] === '\n' ? 2 : 1
    } else {
      field += c
      i++
    }
  }
  if (quoted) throw new Error('A quoted field is never closed.')
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function typed(value) {
  if (value === '') return null
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value) && Math.abs(Number(value)) <= Number.MAX_SAFE_INTEGER) return Number(value)
  if (value === 'true' || value === 'false') return value === 'true'
  if (value === 'null') return null
  return value
}

/** CSV with a header row as an array of objects; `types` reads numbers, booleans and empty cells. */
export function csvToJson(text, { delimiter = 'auto', types = true, header = true } = {}) {
  const sep = delimiter === 'auto' ? guessDelimiter(text) : delimiter
  const rows = parseCsv(text, sep).filter((row) => !(row.length === 1 && row[0] === ''))
  if (!rows.length) return { value: [], delimiter: sep, columns: 0 }
  const read = types ? typed : (v) => v
  if (!header) return { value: rows.map((row) => row.map(read)), delimiter: sep, columns: rows[0].length }
  const names = rows[0].map((name, i) => name.trim() || `column${i + 1}`)
  const value = rows.slice(1).map((row) => Object.fromEntries(names.map((name, i) => [name, read(row[i] ?? '')])))
  return { value, delimiter: sep, columns: names.length }
}

function cell(value, delimiter) {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\r\n]/.test(text) || text.includes(delimiter) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** An array of objects (or of arrays) as CSV; columns are the union of keys in first-seen order. */
export function jsonToCsv(text, { delimiter = ',' } = {}) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`Not valid JSON: ${error.message}`)
  }
  if (!Array.isArray(value)) value = [value]
  if (value.every(Array.isArray)) return value.map((row) => row.map((v) => cell(v, delimiter)).join(delimiter)).join('\n')
  if (!value.every((row) => row && typeof row === 'object' && !Array.isArray(row))) throw new Error('Use an array of objects, or an array of arrays.')
  const columns = [...new Set(value.flatMap((row) => Object.keys(row)))]
  return [columns.map((c) => cell(c, delimiter)).join(delimiter), ...value.map((row) => columns.map((c) => cell(row[c], delimiter)).join(delimiter))].join('\n')
}
