// Text utilities: identifier case, line operations and counts.
import { countTokens } from './tokens.js'

/** Splits identifiers and phrases into words: "parseHTTPResponse_v2" → parse, HTTP, Response, v2. */
export function words(text) {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

const lower = (word) => word.toLowerCase()
const capital = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

export const CASES = [
  ['camelCase', (w) => w.map((word, i) => (i ? capital(word) : lower(word))).join('')],
  ['PascalCase', (w) => w.map(capital).join('')],
  ['snake_case', (w) => w.map(lower).join('_')],
  ['CONSTANT_CASE', (w) => w.map((word) => word.toUpperCase()).join('_')],
  ['kebab-case', (w) => w.map(lower).join('-')],
  ['Train-Case', (w) => w.map(capital).join('-')],
  ['dot.case', (w) => w.map(lower).join('.')],
  ['path/case', (w) => w.map(lower).join('/')],
  ['Title Case', (w) => w.map(capital).join(' ')],
  ['Sentence case', (w) => w.map((word, i) => (i ? lower(word) : capital(word))).join(' ')],
  ['lowercase', (w) => w.map(lower).join(' ')],
  ['UPPERCASE', (w) => w.map((word) => word.toUpperCase()).join(' ')]
]

/** Converts each line on its own, so a list of names converts as a list. */
export function convertCase(text, name) {
  const convert = CASES.find(([label]) => label === name)[1]
  return text.split('\n').map((line) => convert(words(line))).join('\n')
}

export const SORTS = [
  ['keep', 'Keep order'],
  ['asc', 'A → Z'],
  ['desc', 'Z → A'],
  ['length', 'Length'],
  ['reverse', 'Reverse'],
  ['shuffle', 'Shuffle']
]

/**
 * Applies, in order: trim, drop empty lines, remove duplicates, sort. Sorting is natural, so
 * "file10" follows "file9". Returns { text, before, after, duplicates }.
 */
export function processLines(text, { trim = false, dropEmpty = false, unique = false, ignoreCase = false, sort = 'keep', random = Math.random } = {}) {
  let lines = text.split(/\r\n|\r|\n/)
  const before = text === '' ? 0 : lines.length
  if (trim) lines = lines.map((line) => line.trim())
  if (dropEmpty) lines = lines.filter((line) => line.trim() !== '')
  let duplicates = 0
  if (unique) {
    const seen = new Set()
    lines = lines.filter((line) => {
      const key = ignoreCase ? line.toLowerCase() : line
      if (seen.has(key)) return duplicates++, false
      seen.add(key)
      return true
    })
  }
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: ignoreCase ? 'base' : 'variant' })
  if (sort === 'asc') lines.sort(collator.compare)
  else if (sort === 'desc') lines.sort((a, b) => collator.compare(b, a))
  else if (sort === 'length') lines.sort((a, b) => a.length - b.length || collator.compare(a, b))
  else if (sort === 'reverse') lines.reverse()
  else if (sort === 'shuffle') {
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[lines[i], lines[j]] = [lines[j], lines[i]]
    }
  }
  const out = lines.join('\n')
  return { text: out, before, after: out === '' && lines.length <= 1 ? 0 : lines.length, duplicates }
}

const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
const wordSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null

/** Counts that differ for good reasons: an emoji is one character, two code units and four bytes. */
export function countText(text) {
  const characters = graphemes ? [...graphemes.segment(text)].length : [...text].length
  const wordCount = wordSegmenter
    ? [...wordSegmenter.segment(text)].filter((segment) => segment.isWordLike).length
    : (text.match(/[\p{L}\p{N}]+/gu) ?? []).length
  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length
  return {
    characters,
    words: wordCount,
    lines,
    paragraphs: text.split(/\n\s*\n/).filter((part) => part.trim()).length,
    bytes: new TextEncoder().encode(text).length,
    codeUnits: text.length,
    codePoints: [...text].length,
    whitespace: (text.match(/\s/g) ?? []).length,
    // A rough guide for LLM context: about four characters a token for English and code.
    tokens: countTokens(text).tokens,
    readingMinutes: wordCount / 230
  }
}
