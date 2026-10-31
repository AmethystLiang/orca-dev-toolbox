// Seconds up to this many digits, milliseconds beyond: 10 digits covers 1973–2286 in seconds.
const UNITS = [
  { digits: 11, unit: 'seconds', factor: 1000 },
  { digits: 14, unit: 'milliseconds', factor: 1 },
  { digits: 17, unit: 'microseconds', factor: 1 / 1000 },
  { digits: 20, unit: 'nanoseconds', factor: 1 / 1e6 }
]

/** Reads a Unix timestamp (unit inferred from its length) or a date string. */
export function parseTime(input) {
  const text = input.trim()
  if (text === '') return null
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const digits = text.replace(/^-/, '').split('.')[0].length
    const { unit, factor } = UNITS.find((entry) => digits <= entry.digits) ?? UNITS[UNITS.length - 1]
    const date = new Date(Number(text) * factor)
    if (Number.isNaN(date.getTime())) throw new Error('That timestamp is out of range.')
    return { date, unit }
  }
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) throw new Error('Not a timestamp or a date. Try 1730000000, 1730000000000 or 2026-10-31T09:00:00Z.')
  return { date, unit: 'date' }
}

const RELATIVE = [
  ['year', 365 * 24 * 3600], ['month', 30 * 24 * 3600], ['week', 7 * 24 * 3600],
  ['day', 24 * 3600], ['hour', 3600], ['minute', 60], ['second', 1]
]

export function relative(date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of RELATIVE) {
    if (Math.abs(seconds) >= size || unit === 'second') return format.format(Math.round(seconds / size), unit)
  }
  return ''
}

const pad = (n, width = 2) => String(n).padStart(width, '0')

/** Local wall time with its UTC offset, e.g. 2026-10-31 16:05:09 GMT+07:00. */
export function localString(date) {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
    `GMT${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
}

export function timeRows(date, now = Date.now()) {
  const ms = date.getTime()
  return [
    ['Local', localString(date)],
    ['UTC', date.toUTCString()],
    ['ISO 8601', date.toISOString()],
    ['Relative', relative(date, now)],
    ['Unix seconds', String(Math.floor(ms / 1000))],
    ['Unix milliseconds', String(ms)]
  ]
}

/** The wall time in an IANA time zone, e.g. 2026-10-31 05:05:09 GMT-04:00. */
export function zoneString(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset'
  }).formatToParts(date).map((part) => [part.type, part.value]))
  const offset = parts.timeZoneName === 'GMT' ? 'GMT+00:00' : parts.timeZoneName
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${offset}`
}

export const COMMON_ZONES = [
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo',
  'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Ho_Chi_Minh',
  'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'
]

/** Every zone the runtime knows, common ones first. */
export function timeZones() {
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return [...COMMON_ZONES, ...all.filter((zone) => !COMMON_ZONES.includes(zone))]
}
