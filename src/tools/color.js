// CSS colours: read hex, rgb(), hsl() and oklch(); write all four; WCAG contrast.
// Channels are kept as floats (r, g, b in 0–255, a in 0–1) and rounded only when written.

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))
const round = (value, digits = 0) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor + 0 // + 0 turns -0 into 0
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function number(text, { percent = 1, angle = false } = {}) {
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/i.exec(text)
  if (!match) throw new Error(`“${text}” is not a number.`)
  const value = Number(match[1])
  const unit = match[2]?.toLowerCase()
  if (unit === '%') return (value / 100) * percent
  if (unit && !angle) throw new Error(`“${text}” has a unit where none belongs.`)
  if (unit === 'rad') return (value * 180) / Math.PI
  if (unit === 'grad') return value * 0.9
  if (unit === 'turn') return value * 360
  return value
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

function oklchToRgb(L, C, H) {
  const radians = (H * Math.PI) / 180
  const a = C * Math.cos(radians)
  const b = C * Math.sin(radians)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
  const gamma = linear.map((c) => fromLinear(c) * 255)
  return { rgb: gamma.map((c) => clamp(c, 0, 255)), outOfGamut: gamma.some((c) => c < -0.5 || c > 255.5) }
}

/** { r, g, b, a, outOfGamut } or null when the text is empty. Throws on a malformed colour. */
export function parseColor(input) {
  const text = input.trim().toLowerCase()
  if (!text) return null
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text)
  if (hex) {
    let digits = hex[1]
    if (digits.length <= 4) digits = [...digits].map((c) => c + c).join('')
    const [r, g, b, a = 255] = digits.match(/../g).map((pair) => parseInt(pair, 16))
    return { r, g, b, a: round(a / 255, 3), outOfGamut: false }
  }
  const fn = /^(rgba?|hsla?|oklch)\(\s*(.*?)\s*\)$/.exec(text)
  if (!fn) throw new Error('Not a colour. Try #3b82f6, rgb(59 130 246), hsl(217 91% 60%) or oklch(62% 0.19 260).')
  const [name, body] = [fn[1], fn[2]]
  const [main, slash] = body.split('/')
  const parts = main.split(/[\s,]+/).filter(Boolean)
  let alphaText = slash?.trim()
  if (!alphaText && parts.length === 4) alphaText = parts.pop()
  if (parts.length !== 3) throw new Error(`${name}() takes three values, and an optional alpha after “/”.`)
  const a = alphaText ? clamp(number(alphaText), 0, 1) : 1
  if (name.startsWith('rgb')) {
    const [r, g, b] = parts.map((part) => clamp(number(part, { percent: 255 }), 0, 255))
    return { r, g, b, a, outOfGamut: false }
  }
  if (name.startsWith('hsl')) {
    const h = number(parts[0], { angle: true })
    const s = clamp(number(parts[1], { percent: 100 }), 0, 100) / 100
    const l = clamp(number(parts[2], { percent: 100 }), 0, 100) / 100
    const [r, g, b] = hslToRgb(h, s, l)
    return { r, g, b, a, outOfGamut: false }
  }
  const L = clamp(number(parts[0], { percent: 1 }), 0, 1)
  const C = Math.max(0, number(parts[1], { percent: 0.4 }))
  const H = number(parts[2], { angle: true })
  const { rgb, outOfGamut } = oklchToRgb(L, C, H)
  return { r: rgb[0], g: rgb[1], b: rgb[2], a, outOfGamut }
}

const byte = (c) => clamp(Math.round(c), 0, 255)

export function toHex({ r, g, b, a = 1 }) {
  const channels = [r, g, b].map(byte)
  if (a < 1) channels.push(Math.round(a * 255))
  return '#' + channels.map((c) => c.toString(16).padStart(2, '0')).join('')
}

export function toRgb({ r, g, b, a = 1 }) {
  const values = [r, g, b].map(byte).join(', ')
  return a < 1 ? `rgba(${values}, ${round(a, 3)})` : `rgb(${values})`
}

export function hsl({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((c) => byte(c) / 255)
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s: s * 100, l: l * 100 }
}

export function toHsl(color) {
  const { h, s, l } = hsl(color)
  const values = `${round(h)}, ${round(s)}%, ${round(l)}%`
  return color.a < 1 ? `hsla(${values}, ${round(color.a, 3)})` : `hsl(${values})`
}

export function oklch({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((c) => toLinear(byte(c) / 255))
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(a, bb)
  const H = C < 0.0002 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { L, C, H }
}

export function toOklch(color) {
  const { L, C, H } = oklch(color)
  const values = `${round(L * 100, 1)}% ${round(C, 3)} ${round(H, 1)}`
  return color.a < 1 ? `oklch(${values} / ${round(color.a, 3)})` : `oklch(${values})`
}

export function luminance({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((c) => toLinear(byte(c) / 255))
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** The WCAG 2 contrast ratio of two opaque colours, 1 to 21. */
export function contrast(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** WCAG 2 level for normal text at this ratio. */
export function contrastLevel(ratio) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA large'
  return 'Fails'
}

export const WHITE = { r: 255, g: 255, b: 255, a: 1 }
export const BLACK = { r: 0, g: 0, b: 0, a: 1 }
