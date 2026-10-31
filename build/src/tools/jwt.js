import { base64ToBytes, bytesToText } from './codec.js'

const TIME_CLAIMS = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before', auth_time: 'Authenticated at' }

function part(segment, name) {
  let text
  try {
    text = bytesToText(base64ToBytes(segment))
  } catch {
    text = null
  }
  if (text === null) throw new Error(`The ${name} is not Base64URL-encoded text.`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`The ${name} is not JSON.`)
  }
}

/**
 * Decodes a JWS compact token without verifying its signature. Returns the header, the payload, and
 * the time claims as dates with their status at `now`.
 */
export function decodeJwt(input, now = Date.now()) {
  const token = input.trim().replace(/^Bearer\s+/i, '')
  const segments = token.split('.')
  if (segments.length === 5) throw new Error('This is an encrypted token (JWE); only signed tokens (JWS) can be read without the key.')
  if (segments.length !== 3) throw new Error('A JWT has three parts separated by dots: header.payload.signature.')
  const header = part(segments[0], 'header')
  const payload = part(segments[1], 'payload')
  const times = []
  if (payload && typeof payload === 'object') {
    for (const [claim, label] of Object.entries(TIME_CLAIMS)) {
      const value = payload[claim]
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      const date = new Date(value * 1000)
      let status = null
      if (claim === 'exp') status = date.getTime() <= now ? 'expired' : 'valid'
      if (claim === 'nbf' && date.getTime() > now) status = 'not yet valid'
      times.push({ claim, label, value, date, status })
    }
  }
  return { header, payload, signature: segments[2], times, unsigned: header?.alg === 'none' || segments[2] === '' }
}
