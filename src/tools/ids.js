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

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** ULID: 48-bit millisecond time and 80 random bits in Crockford Base32, 26 characters. */
export function ulid(now = Date.now(), bytes = random(10)) {
  let time = ''
  let t = now
  for (let i = 0; i < 10; i++) {
    time = CROCKFORD[t % 32] + time
    t = Math.floor(t / 32)
  }
  let bits = 0n
  for (const byte of bytes) bits = (bits << 8n) | BigInt(byte)
  let rest = ''
  for (let i = 0; i < 16; i++) {
    rest = CROCKFORD[Number(bits & 31n)] + rest
    bits >>= 5n
  }
  return time + rest
}

/** The creation time inside a ULID, or null when it is not one. */
export function ulidTime(text) {
  const id = text.trim().toUpperCase()
  if (!/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(id)) return null
  let time = 0
  for (const c of id.slice(0, 10)) time = time * 32 + CROCKFORD.indexOf(c)
  return new Date(time)
}

/** Nano ID: 21 URL-safe characters, as the nanoid package makes them. */
export const nanoid = (size = 21) => randomString(size, 'url-safe')

const CLASSES = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~'
}
const AMBIGUOUS = /[Il1O0o|`'"]/g

/** A random index below `n`, without modulo bias. */
function below(n) {
  const limit = 2 ** 32 - (2 ** 32 % n)
  for (;;) {
    const [value] = crypto.getRandomValues(new Uint32Array(1))
    if (value < limit) return value % n
  }
}

/**
 * A password with at least one character of each chosen class, shuffled. Returns { password,
 * entropy } where entropy is in bits for the whole pool.
 */
export function generatePassword({ length = 20, lower = true, upper = true, digits = true, symbols = true, avoidAmbiguous = false } = {}) {
  const chosen = Object.entries({ lower, upper, digits, symbols }).filter(([, on]) => on).map(([name]) => CLASSES[name])
  const sets = (chosen.length ? chosen : [CLASSES.lower]).map((set) => (avoidAmbiguous ? set.replace(AMBIGUOUS, '') : set))
  const pool = sets.join('')
  const size = Math.max(length, sets.length)
  const chars = sets.map((set) => set[below(set.length)])
  while (chars.length < size) chars.push(pool[below(pool.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = below(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return { password: chars.join(''), entropy: Math.round(size * Math.log2(pool.length)) }
}

export function strength(entropy) {
  if (entropy < 40) return { label: 'weak', kind: 'bad' }
  if (entropy < 60) return { label: 'fair', kind: '' }
  if (entropy < 100) return { label: 'strong', kind: 'ok' }
  return { label: 'very strong', kind: 'ok' }
}
