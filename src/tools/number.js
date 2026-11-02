// Integers of any size between bases 2, 8, 10 and 16, with BigInt.

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
const PREFIXES = { x: 16, o: 8, b: 2 }
const BASE_NAMES = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' }

/**
 * { value: BigInt, radix } or null for empty text. `base` is 'auto' or 2, 8, 10, 16. In auto mode a
 * 0x, 0o or 0b prefix picks the base, and digits a–f without a prefix mean hexadecimal.
 */
export function parseInteger(input, base = 'auto') {
  let text = input.trim().replace(/[\s_,']/g, '').toLowerCase()
  if (!text) return null
  let negative = false
  if (/^[+-]/.test(text)) {
    negative = text[0] === '-'
    text = text.slice(1)
  }
  let radix = base === 'auto' ? 10 : Number(base)
  const prefix = /^0([xob])/.exec(text)
  if (prefix && (base === 'auto' || PREFIXES[prefix[1]] === radix)) {
    radix = PREFIXES[prefix[1]]
    text = text.slice(2)
  } else if (base === 'auto' && /^[0-9a-f]*[a-f][0-9a-f]*$/.test(text)) {
    radix = 16
  }
  const allowed = DIGITS.slice(0, radix)
  if (!text || ![...text].every((c) => allowed.includes(c))) {
    throw new Error(`Not a ${BASE_NAMES[radix]} number: only the digits ${radix === 16 ? '0–9 and a–f' : `0–${radix - 1}`} are allowed.`)
  }
  let value = 0n
  const big = BigInt(radix)
  for (const c of text) value = value * big + BigInt(allowed.indexOf(c))
  return { value: negative ? -value : value, radix }
}

export function formatInteger(value, radix) {
  const negative = value < 0n
  const digits = (negative ? -value : value).toString(radix)
  const prefix = { 16: '0x', 8: '0o', 2: '0b' }[radix] ?? ''
  return (negative ? '-' : '') + prefix + digits
}

/** Digits in groups from the right, for reading: 1111 0000, ff ff, 1,000,000. */
export function group(digits, size, separator = ' ') {
  const out = []
  for (let end = digits.length; end > 0; end -= size) out.unshift(digits.slice(Math.max(0, end - size), end))
  return out.join(separator)
}

export function bitLength(value) {
  const magnitude = value < 0n ? -value : value
  return magnitude === 0n ? 0 : magnitude.toString(2).length
}

const WIDTHS = [8, 16, 32, 64, 128]

/**
 * The same bits read the other way: a negative number as unsigned two's complement, or a positive
 * one with its top bit set as signed, in the narrowest of 8, 16, 32, 64 or 128 bits it fits.
 */
export function twosComplement(value) {
  if (value < 0n) {
    const width = WIDTHS.find((bits) => value >= -(1n << BigInt(bits - 1)))
    if (!width) return null
    const unsigned = (1n << BigInt(width)) + value
    return { width, label: `Unsigned ${width}-bit`, value: unsigned }
  }
  const width = WIDTHS.find((bits) => value < 1n << BigInt(bits))
  if (!width || value < 1n << BigInt(width - 1)) return null
  return { width, label: `Signed ${width}-bit`, value: value - (1n << BigInt(width)) }
}

/** The character at this code point, or null outside the printable range. */
export function codePointChar(value) {
  if (value < 0x20n || value > 0x10ffffn || (value >= 0x7fn && value < 0xa0n) || (value >= 0xd800n && value <= 0xdfffn)) return null
  return String.fromCodePoint(Number(value))
}
