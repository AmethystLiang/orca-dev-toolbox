export const MAX_MATCHES = 500

/**
 * Runs a pattern over text. Returns the matches (index, text, numbered and named groups), or
 * throws the RegExp syntax error. Stops after MAX_MATCHES; zero-length matches advance by one.
 */
export function runRegex(pattern, flags, text) {
  const unique = [...new Set(flags.replace(/[^dgimsuyv]/g, ''))].join('')
  const global = unique.includes('g') ? unique : `${unique}g`
  const regex = new RegExp(pattern, global)
  const matches = []
  let truncated = false
  for (const match of text.matchAll(regex)) {
    if (matches.length === MAX_MATCHES) {
      truncated = true
      break
    }
    matches.push({
      index: match.index,
      text: match[0],
      groups: match.slice(1),
      named: match.groups ? { ...match.groups } : null
    })
    if (!unique.includes('g')) break
  }
  return { matches, truncated }
}

/** Replaces matches with `$1`-style references, as String.prototype.replace does. */
export function replaceRegex(pattern, flags, text, replacement) {
  const unique = [...new Set(flags.replace(/[^dgimsuyv]/g, ''))].join('')
  return text.replace(new RegExp(pattern, unique), replacement)
}
