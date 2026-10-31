import { toHex } from './codec.js'

const random = (size) => crypto.getRandomValues(new Uint8Array(size))

function format(bytes) {
  const hex = toHex(bytes)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** RFC 9562 version 4: random. */
export function uuidv4(bytes = random(16)) {
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return format(bytes)
}

/** RFC 9562 version 7: a 48-bit Unix millisecond time then random bits, so ids sort by creation. */
export function uuidv7(now = Date.now(), bytes = random(16)) {
  let time = now
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256
    time = Math.floor(time / 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return format(bytes)
}

/** The creation time inside a version 7 UUID, or null for other versions. */
export function uuidv7Time(uuid) {
  const hex = uuid.trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(hex)) return null
  return new Date(parseInt(hex.slice(0, 8) + hex.slice(9, 13), 16))
}

const ALPHABETS = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  hex: '0123456789abcdef',
  'url-safe': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  symbols: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+-=?@^_~'
}

/** A random string from one of ALPHABETS, without modulo bias. */
export function randomString(length, alphabet = 'alphanumeric') {
  const chars = ALPHABETS[alphabet]
  const limit = 256 - (256 % chars.length)
  let out = ''
  while (out.length < length) {
    for (const byte of random(length * 2)) {
      if (byte < limit) out += chars[byte % chars.length]
      if (out.length === length) break
    }
  }
  return out
}

export const STRING_ALPHABETS = Object.keys(ALPHABETS)
