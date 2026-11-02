// Escaping for HTML, JSON strings and Unicode escape sequences, both ways.

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// The named references people meet in practice; numeric ones cover everything else.
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«',
  raquo: '»', bull: '•', middot: '·', deg: '°', plusmn: '±', times: '×', divide: '÷', euro: '€',
  pound: '£', yen: '¥', cent: '¢', sect: '§', para: '¶', shy: '­', larr: '←', rarr: '→',
  uarr: '↑', darr: '↓', harr: '↔', le: '≤', ge: '≥', ne: '≠', infin: '∞', check: '✓', hearts: '♥',
  frac12: '½', frac14: '¼', frac34: '¾', iexcl: '¡', iquest: '¿', ensp: ' ', emsp: ' ',
  thinsp: ' ', zwj: '‍', zwnj: '‌'
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

export function unescapeHtml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, ref) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole
    }
    return NAMED[ref] ?? NAMED[ref.toLowerCase()] ?? whole
  })
}

/** The inside of a JSON string literal, without the surrounding quotes. */
export function escapeJsonString(text) {
  return JSON.stringify(text).slice(1, -1)
}

/** Reads the inside of a JSON or JavaScript string, with or without its quotes. */
export function unescapeJsonString(text) {
  let body = text
  if (/^"[\s\S]*"$/.test(body) && body.length >= 2) body = body.slice(1, -1)
  // Bare quotes and line breaks are not allowed inside JSON strings; accept them as written.
  body = body
    .replace(/\\'/g, "'")
    .replace(/(^|[^\\])((?:\\\\)*)"/g, '$1$2\\"')
    .replace(/(^|[^\\])((?:\\\\)*)"/g, '$1$2\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
  try {
    return JSON.parse(`"${body}"`)
  } catch {
    throw new Error('Not a valid string escape: a backslash must be followed by " \\ / b f n r t or u and four hex digits.')
  }
}

/** Non-ASCII and control characters as \uXXXX (surrogate pairs above U+FFFF), as JS and JSON read them. */
export function escapeUnicode(text, { braces = false } = {}) {
  let out = ''
  for (const char of text) {
    const code = char.codePointAt(0)
    if (code >= 0x20 && code < 0x7f) out += char
    else if (char === '\n') out += '\\n'
    else if (char === '\t') out += '\\t'
    else if (char === '\r') out += '\\r'
    else if (braces && code > 0xffff) out += `\\u{${code.toString(16).toUpperCase()}}`
    else for (let i = 0; i < char.length; i++) out += '\\u' + char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')
  }
  return out
}

/** Reads \uXXXX, \u{X…}, \xXX, U+XXXX and \n-style escapes; leaves other text alone. */
export function unescapeUnicode(text) {
  return text.replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})|U\+([0-9a-f]{4,6})|\\([nrt\\])/gi, (whole, braced, four, two, plus, simple) => {
    if (simple) return { n: '\n', r: '\r', t: '\t', '\\': '\\' }[simple]
    const code = parseInt(braced ?? four ?? two ?? plus, 16)
    if (four) return String.fromCharCode(code)
    return code <= 0x10ffff ? String.fromCodePoint(code) : whole
  })
}

export const ESCAPERS = {
  html: { label: 'HTML', escape: escapeHtml, unescape: unescapeHtml },
  json: { label: 'JSON string', escape: escapeJsonString, unescape: unescapeJsonString },
  unicode: { label: 'Unicode', escape: escapeUnicode, unescape: unescapeUnicode }
}
