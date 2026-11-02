// Data sizes (SI and binary units) and durations.

const SIZE_UNITS = {
  b: 1, byte: 1, bytes: 1,
  kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15,
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5,
  k: 1024, m: 1024 ** 2, g: 1024 ** 3, t: 1024 ** 4,
  bit: 1 / 8, bits: 1 / 8, kbit: 125, mbit: 125e3, gbit: 125e6
}

/** Bytes in "1.5 GB", "512MiB", "2g" (binary, as in JVM and Docker flags) or a bare number. */
export function parseSize(input) {
  const text = input.trim().replace(/,/g, '').toLowerCase()
  if (!text) return null
  const match = /^(\d+(?:\.\d+)?|\.\d+)\s*([a-z]*)$/.exec(text)
  if (!match) throw new Error('Not a size. Try 1536, 1.5 GB, 512 MiB or 2g.')
  const unit = match[2] || 'b'
  if (!(unit in SIZE_UNITS)) throw new Error(`Unknown unit “${match[2]}”. Use B, KB, MB, GB, TB, KiB, MiB, GiB or TiB.`)
  return Number(match[1]) * SIZE_UNITS[unit]
}

function trimNumber(value, digits = 2) {
  return Number(value.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits })
}

/** "1.5 GB" in powers of 1000 or "1.4 GiB" in powers of 1024. */
export function formatSize(bytes, binary = false) {
  const base = binary ? 1024 : 1000
  const units = binary ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let value = bytes
  let i = 0
  while (Math.abs(value) >= base && i < units.length - 1) {
    value /= base
    i++
  }
  return `${trimNumber(value)} ${units[i]}`
}

export function sizeRows(bytes) {
  const fixed = (value) => trimNumber(value, 6)
  return [
    ['Bytes', Math.round(bytes).toLocaleString('en-US')],
    ['Decimal', formatSize(bytes)],
    ['Binary', formatSize(bytes, true)],
    ['KB / KiB', `${fixed(bytes / 1e3)} / ${fixed(bytes / 1024)}`],
    ['MB / MiB', `${fixed(bytes / 1e6)} / ${fixed(bytes / 1024 ** 2)}`],
    ['GB / GiB', `${fixed(bytes / 1e9)} / ${fixed(bytes / 1024 ** 3)}`],
    ['Bits', Math.round(bytes * 8).toLocaleString('en-US')]
  ]
}

const DURATION_UNITS = {
  ns: 1e-6, us: 1e-3, µs: 1e-3, ms: 1, s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
  m: 60e3, min: 60e3, mins: 60e3, minute: 60e3, minutes: 60e3, h: 3600e3, hr: 3600e3, hrs: 3600e3,
  hour: 3600e3, hours: 3600e3, d: 864e5, day: 864e5, days: 864e5, w: 6048e5, week: 6048e5, weeks: 6048e5
}

/**
 * Milliseconds in "1h30m", "1d 2h", "90s", "250ms", "01:30:00", ISO 8601 "PT1H30M", or a bare number
 * read in `unit` (ms or s).
 */
export function parseDuration(input, unit = 'ms') {
  const text = input.trim().toLowerCase()
  if (!text) return null
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text) * (unit === 's' ? 1000 : 1)
  const clock = /^(\d+):([0-5]?\d)(?::([0-5]?\d(?:\.\d+)?))?$/.exec(text)
  if (clock) {
    const [h, m, s] = clock[3] === undefined ? [0, Number(clock[1]), Number(clock[2])] : [Number(clock[1]), Number(clock[2]), Number(clock[3])]
    return ((h * 60 + m) * 60 + s) * 1000
  }
  const iso = /^p(?:(\d+(?:\.\d+)?)w)?(?:(\d+(?:\.\d+)?)d)?(?:t(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?)?$/.exec(text)
  if (iso && text !== 'p' && text !== 'pt') {
    const [w, d, h, m, s] = iso.slice(1).map((v) => Number(v ?? 0))
    return ((((w * 7 + d) * 24 + h) * 60 + m) * 60 + s) * 1000
  }
  const parts = text.replace(/\band\b|,/g, ' ').match(/(\d+(?:\.\d+)?)\s*([a-zµ]+)/g)
  if (!parts || parts.join('').replace(/\s/g, '') !== text.replace(/\band\b|,|\s/g, '')) {
    throw new Error('Not a duration. Try 1h30m, 90s, 250ms, 01:30:00 or PT1H30M.')
  }
  let total = 0
  for (const part of parts) {
    const [, value, name] = /(\d+(?:\.\d+)?)\s*([a-zµ]+)/.exec(part)
    if (!(name in DURATION_UNITS)) throw new Error(`Unknown unit “${name}”. Use ms, s, m, h, d or w.`)
    total += Number(value) * DURATION_UNITS[name]
  }
  return total
}

/** "1d 2h 3m 4s" (largest units first, zero parts dropped). */
export function humanDuration(ms) {
  if (ms === 0) return '0s'
  const sign = ms < 0 ? '-' : ''
  let rest = Math.abs(ms)
  const out = []
  for (const [name, size] of [['d', 864e5], ['h', 3600e3], ['m', 60e3], ['s', 1000]]) {
    const n = Math.floor(rest / size)
    if (n) out.push(`${n}${name}`)
    rest -= n * size
  }
  if (rest) out.push(`${trimNumber(rest, 3)}ms`)
  return sign + out.join(' ')
}

export function isoDuration(ms) {
  let rest = Math.abs(Math.round(ms))
  const d = Math.floor(rest / 864e5)
  rest -= d * 864e5
  const h = Math.floor(rest / 3600e3)
  rest -= h * 3600e3
  const m = Math.floor(rest / 60e3)
  rest -= m * 60e3
  const s = rest / 1000
  const time = `${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${trimNumber(s, 3).replace(/,/g, '')}S` : ''}`
  return `${ms < 0 ? '-' : ''}P${d ? `${d}D` : ''}${time ? `T${time}` : d ? '' : 'T0S'}`
}

export function durationRows(ms) {
  const clock = (() => {
    const total = Math.abs(Math.round(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${ms < 0 ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()
  const fixed = (value) => trimNumber(value, 4)
  return [
    ['Human', humanDuration(ms)],
    ['Clock', clock],
    ['ISO 8601', isoDuration(ms)],
    ['Milliseconds', fixed(ms)],
    ['Seconds', fixed(ms / 1000)],
    ['Minutes', fixed(ms / 60e3)],
    ['Hours', fixed(ms / 3600e3)],
    ['Days', fixed(ms / 864e5)]
  ]
}
