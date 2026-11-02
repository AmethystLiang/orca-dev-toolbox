// Shows what is really in a string: invisible characters, look-alike letters from other scripts,
// and composed versus decomposed accents (NFC/NFD), each a common cause of "the strings look
// equal but are not".

const NAMES = {
  0x00: 'NULL', 0x09: 'TAB', 0x0a: 'LINE FEED', 0x0d: 'CARRIAGE RETURN', 0x20: 'SPACE',
  0xa0: 'NO-BREAK SPACE', 0xad: 'SOFT HYPHEN', 0x034f: 'COMBINING GRAPHEME JOINER', 0x061c: 'ARABIC LETTER MARK',
  0x115f: 'HANGUL CHOSEONG FILLER', 0x1680: 'OGHAM SPACE MARK', 0x180e: 'MONGOLIAN VOWEL SEPARATOR',
  0x2000: 'EN QUAD', 0x2001: 'EM QUAD', 0x2002: 'EN SPACE', 0x2003: 'EM SPACE', 0x2004: 'THREE-PER-EM SPACE',
  0x2005: 'FOUR-PER-EM SPACE', 0x2006: 'SIX-PER-EM SPACE', 0x2007: 'FIGURE SPACE', 0x2008: 'PUNCTUATION SPACE',
  0x2009: 'THIN SPACE', 0x200a: 'HAIR SPACE', 0x200b: 'ZERO WIDTH SPACE', 0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER', 0x200e: 'LEFT-TO-RIGHT MARK', 0x200f: 'RIGHT-TO-LEFT MARK',
  0x2028: 'LINE SEPARATOR', 0x2029: 'PARAGRAPH SEPARATOR', 0x202a: 'LEFT-TO-RIGHT EMBEDDING',
  0x202b: 'RIGHT-TO-LEFT EMBEDDING', 0x202c: 'POP DIRECTIONAL FORMATTING', 0x202d: 'LEFT-TO-RIGHT OVERRIDE',
  0x202e: 'RIGHT-TO-LEFT OVERRIDE', 0x202f: 'NARROW NO-BREAK SPACE', 0x205f: 'MEDIUM MATHEMATICAL SPACE',
  0x2060: 'WORD JOINER', 0x2061: 'FUNCTION APPLICATION', 0x2062: 'INVISIBLE TIMES', 0x2063: 'INVISIBLE SEPARATOR',
  0x2064: 'INVISIBLE PLUS', 0x2066: 'LEFT-TO-RIGHT ISOLATE', 0x2067: 'RIGHT-TO-LEFT ISOLATE',
  0x2068: 'FIRST STRONG ISOLATE', 0x2069: 'POP DIRECTIONAL ISOLATE', 0x3000: 'IDEOGRAPHIC SPACE',
  0x3164: 'HANGUL FILLER', 0xfe0f: 'VARIATION SELECTOR-16', 0xfeff: 'BYTE ORDER MARK (ZERO WIDTH NO-BREAK SPACE)',
  0xfffc: 'OBJECT REPLACEMENT CHARACTER', 0xfffd: 'REPLACEMENT CHARACTER'
}

const SCRIPTS = ['Latin', 'Cyrillic', 'Greek', 'Armenian', 'Hebrew', 'Arabic', 'Han', 'Hiragana', 'Katakana', 'Hangul', 'Thai']
const scriptTests = SCRIPTS.map((name) => [name, new RegExp(`\\p{Script=${name}}`, 'u')])

function category(char) {
  if (/\p{L}/u.test(char)) return 'letter'
  if (/\p{M}/u.test(char)) return 'mark'
  if (/\p{N}/u.test(char)) return 'number'
  if (/\p{Zs}/u.test(char)) return 'space'
  if (/\p{P}/u.test(char)) return 'punctuation'
  if (/\p{S}/u.test(char)) return 'symbol'
  if (/\p{Cc}/u.test(char)) return 'control'
  if (/\p{Cf}/u.test(char)) return 'format'
  return 'other'
}

const scriptOf = (char) => scriptTests.find(([, test]) => test.test(char))?.[0] ?? null

// Characters that render as nothing, or as an ordinary space, but are not one.
export function isHidden(cp) {
  return (cp !== 0x09 && cp !== 0x0a && cp !== 0x0d && cp !== 0x20 && (cp < 0x20 || (cp >= 0x7f && cp < 0xa0))) ||
    (cp in NAMES && ![0x09, 0x0a, 0x0d, 0x20].includes(cp)) ||
    /\p{Cf}/u.test(String.fromCodePoint(cp))
}

const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`

/** Every code point with its details, and a summary of what deserves a look. */
export function inspect(text) {
  const encoder = new TextEncoder()
  const letters = [...text].filter((c) => /\p{L}/u.test(c))
  const scripts = new Map()
  for (const c of letters) {
    const script = scriptOf(c) ?? 'Other'
    scripts.set(script, (scripts.get(script) ?? 0) + 1)
  }
  // The main script is the most common; letters of Cyrillic or Greek among Latin may be look-alikes.
  const main = [...scripts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const chars = [...text].map((char, index) => {
    const cp = char.codePointAt(0)
    const script = /\p{L}/u.test(char) ? scriptOf(char) : null
    const hidden = isHidden(cp)
    const lookalike = main === 'Latin' && (script === 'Cyrillic' || script === 'Greek')
    return {
      index,
      char,
      cp,
      code: hex(cp),
      name: NAMES[cp] ?? null,
      category: category(char),
      script,
      utf8: [...encoder.encode(char)].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
      flag: hidden ? 'hidden' : lookalike ? 'look-alike' : cp > 0x7e ? 'non-ascii' : null
    }
  })
  const nfc = text.normalize('NFC')
  const nfd = text.normalize('NFD')
  return {
    chars,
    hidden: chars.filter((c) => c.flag === 'hidden').length,
    lookalikes: chars.filter((c) => c.flag === 'look-alike').length,
    nonAscii: chars.filter((c) => c.cp > 0x7e).length,
    scripts: [...scripts.entries()],
    normalization: text === nfc && text === nfd ? 'plain' : text === nfc ? 'NFC' : text === nfd ? 'NFD' : 'mixed'
  }
}

/** The text without hidden characters, odd spaces made plain, line separators made \n, and NFC. */
export function clean(text) {
  let out = ''
  for (const char of text) {
    const cp = char.codePointAt(0)
    if (cp === 0x2028 || cp === 0x2029) out += '\n'
    else if (/\p{Zs}/u.test(char)) out += ' '
    else if (isHidden(cp) && cp !== 0xfe0f && cp !== 0x200d) out += '' // keep emoji joiners intact
    else out += char
  }
  return out.normalize('NFC')
}
