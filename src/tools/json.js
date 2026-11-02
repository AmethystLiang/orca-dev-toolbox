function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]))
  }
  return value
}

/** Line and column (1-based) of a JSON.parse error, read from V8's "position N" message. */
function errorLocation(text, message) {
  const match = /position (\d+)/.exec(message)
  if (!match) return null
  const offset = Number(match[1])
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  return { line, column: offset - before.lastIndexOf('\n') }
}

/**
 * Parses JSON and prints it formatted (indent 2, 4 or '\t') or minified (indent 0).
 * Throws an Error whose message names the line and column of a syntax error.
 */
export function formatJson(text, { indent = 2, sort = false } = {}) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    const where = errorLocation(text, error.message)
    const reason = error.message.replace(/^JSON\.parse: /, '').replace(/ in JSON at position \d+.*$/, '').replace(/\s*\(line \d+ column \d+\)$/, '')
    throw new Error(where ? `Line ${where.line}, column ${where.column}: ${reason}` : reason)
  }
  if (sort) value = sortKeys(value)
  return JSON.stringify(value, null, indent === 0 ? undefined : indent)
}

/** A short summary of parsed JSON: its type and size. */
export function describeJson(text) {
  const value = JSON.parse(text)
  if (Array.isArray(value)) return `Array of ${value.length} item${value.length === 1 ? '' : 's'}`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).length
    return `Object with ${keys} key${keys === 1 ? '' : 's'}`
  }
  return value === null ? 'null' : typeof value
}
