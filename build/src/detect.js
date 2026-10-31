// Recognises what a pasted value is, so the home screen can open the right tool with it filled
// in. Returns a tool id or null; checks run from the most specific shape to the loosest.
import { base64ToBytes, bytesToText } from './tools/codec.js'
import { parseCron } from './tools/cron.js'

const JWT = /^(Bearer\s+)?eyJ[\w-]*\.eyJ[\w-]*\.[\w-]*$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TIMESTAMP = /^\d{9,10}(\d{3})?(\d{3})?$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/
const URL_LIKE = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i
const PERCENT = /%[0-9a-f]{2}/i
const BASE64 = /^[A-Za-z0-9+/_-]{8,}={0,2}$/
const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COLOR_FN = /^(rgba?|hsla?|oklch)\([^()]*\)$/i
const PREFIXED_NUMBER = /^-?0(x[0-9a-f_]+|b[01_]+|o[0-7_]+)$/i
const SYMBOLIC_MODE = /^[-dl]?[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/
const ESCAPED = /&(#\d+|#x[0-9a-f]+|[a-z]+\d*);|\\u(\{[0-9a-f]+\}|[0-9a-f]{4})/i

function isJson(text) {
  if (!/^[[{]/.test(text)) return false
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function isCron(text) {
  if (!/^(@\w+|(\S+\s+){4}\S+)$/.test(text)) return false
  try {
    parseCron(text)
    return true
  } catch {
    return false
  }
}

// Base64 of readable text only: plain words such as "password" also fit the alphabet.
function isBase64Text(text) {
  if (!BASE64.test(text) || /^[a-z]+$/i.test(text)) return false
  try {
    const decoded = bytesToText(base64ToBytes(text))
    return decoded !== null && /^[\p{L}\p{N}\p{P}\p{S}\s]+$/u.test(decoded) && !/[\u0000-\u0008\u000e-\u001f]/.test(decoded)
  } catch {
    return false
  }
}

export function detect(value) {
  const text = value.trim()
  if (!text) return null
  if (JWT.test(text)) return 'jwt'
  if (UUID.test(text)) return 'ids'
  if (TIMESTAMP.test(text) || ISO_DATE.test(text)) return 'time'
  if (HEX_COLOR.test(text) || COLOR_FN.test(text)) return 'color'
  if (PREFIXED_NUMBER.test(text)) return 'number'
  if (SYMBOLIC_MODE.test(text)) return 'chmod'
  if (isJson(text)) return 'json'
  if (URL_LIKE.test(text)) return 'url'
  if (isCron(text)) return 'cron'
  if (!/\s/.test(text) && PERCENT.test(text)) return 'url'
  if (isBase64Text(text)) return 'base64'
  if (ESCAPED.test(text)) return 'escape'
  return null
}
