const encoder = new TextEncoder()
const strictDecoder = new TextDecoder('utf-8', { fatal: true })

export function bytesToBase64(bytes, urlSafe = false) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  }
  const base64 = btoa(binary)
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64
}

/** Accepts standard and URL-safe alphabets, with or without padding and whitespace. */
export function base64ToBytes(text) {
  const clean = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error('Not Base64: only A–Z, a–z, 0–9, +, /, - and _ are allowed.')
  const unpadded = clean.replace(/=+$/, '')
  if (unpadded.length % 4 === 1) throw new Error('Not Base64: the length is off by one character.')
  const binary = atob(unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const utf8 = (text) => encoder.encode(text)

/** The bytes as UTF-8 text, or null when they are not valid UTF-8. */
export function bytesToText(bytes) {
  try {
    return strictDecoder.decode(bytes)
  } catch {
    return null
  }
}

export function toHex(bytes, separator = '') {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(separator)
}

export function base64Encode(text, urlSafe = false) {
  return bytesToBase64(utf8(text), urlSafe)
}

/** `{ text }` for UTF-8 content, otherwise `{ hex }` of the raw bytes. */
export function base64Decode(input) {
  const bytes = base64ToBytes(input)
  const text = bytesToText(bytes)
  return text === null ? { hex: toHex(bytes, ' '), size: bytes.length } : { text, size: bytes.length }
}

export function urlEncode(text, whole = false) {
  return whole ? encodeURI(text) : encodeURIComponent(text)
}

export function urlDecode(text, plusAsSpace = true) {
  try {
    return decodeURIComponent(plusAsSpace ? text.replace(/\+/g, ' ') : text)
  } catch {
    throw new Error('Not URL-encoded: a % is not followed by two hex digits.')
  }
}

/** The parts of an absolute URL, with its query as decoded name/value pairs; null when it is not one. */
export function parseUrl(text) {
  let url
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  return {
    protocol: url.protocol.replace(/:$/, ''),
    username: url.username,
    host: url.hostname,
    port: url.port,
    path: decodeSafe(url.pathname),
    query: [...url.searchParams.entries()],
    fragment: decodeSafe(url.hash.replace(/^#/, ''))
  }
}

function decodeSafe(text) {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}
