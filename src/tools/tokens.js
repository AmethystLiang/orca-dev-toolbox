// Rough LLM token counts, offline. Real tokenizers ship vocabularies of megabytes and differ by
// model; this estimate follows how byte-pair tokenizers split text: common English words are one
// token, long words and numbers break into pieces, accented and non-Latin text costs more per
// character, and indentation runs merge.

const PIECE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|(?:(?![\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}])[\p{L}\p{M}])+|\p{N}+|\n|[ \t]+|[^\s\p{L}\p{M}\p{N}]/gu
const CJK = /^(\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul})$/u

function pieceTokens(piece) {
  if (piece === '\n') return 1
  if (/^[ \t]+$/.test(piece)) return piece.length === 1 ? 0 : Math.ceil(piece.length / 4)
  if (CJK.test(piece)) return 1
  if (/^[A-Za-z]+$/.test(piece)) return piece.length <= 8 ? 1 : Math.ceil(piece.length / 7)
  if (/^\p{N}+$/u.test(piece)) return Math.ceil(piece.length / 3)
  if (/^\p{L}/u.test(piece)) {
    // Vietnamese and other accented words: the plain letters group, each accented letter tends
    // to cost about one token of its own.
    const letters = [...piece.normalize('NFC')]
    const accented = letters.filter((c) => c > '\u007f').length
    return Math.max(1, Math.ceil((letters.length - accented) / 4) + accented)
  }
  return 1
}

/** Characters, words, lines and an estimated token count. */
export function countTokens(text) {
  const value = String(text)
  let tokens = 0
  for (const [piece] of value.matchAll(PIECE)) tokens += pieceTokens(piece)
  return {
    tokens,
    characters: [...value].length,
    bytes: new TextEncoder().encode(value).length,
    words: value.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’_-]*/gu)?.length ?? 0,
    lines: value ? value.split(/\r?\n/).length : 0
  }
}

// Context sizes current at the time of writing, as round sizes: the panel compares, it does not
// name model versions that change every few months.
export const WINDOWS = [
  ['32K', 32_000],
  ['128K', 128_000],
  ['200K', 200_000],
  ['1M', 1_000_000]
]

/** "≈ 1,234" with a ±15% range, since the count is an estimate. */
export function tokenRange(tokens) {
  const low = Math.floor(tokens * 0.85)
  const high = Math.ceil(tokens * 1.15)
  return { low, high }
}

/** Cost in dollars at `perMillion` dollars per million tokens. */
export function tokenCost(tokens, perMillion) {
  const price = Number(String(perMillion).replace(',', '.'))
  if (!Number.isFinite(price) || price < 0) return null
  return (tokens / 1_000_000) * price
}
