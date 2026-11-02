// Standard five-field cron (minute hour day-of-month month day-of-week), as in crontab(5): lists,
// ranges, steps, month and weekday names, 7 for Sunday, and the @hourly/@daily/… shortcuts.
// When both day fields are restricted, a time matches either of them.

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTHS, offset: 1 },
  { name: 'day of week', min: 0, max: 7, names: DAYS, offset: 0 }
]

const SHORTCUTS = {
  '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *'
}

function value(token, field) {
  const upper = token.toUpperCase()
  const named = field.names?.indexOf(upper) ?? -1
  if (named !== -1) return named + field.offset
  if (!/^\d+$/.test(token)) throw new Error(`"${token}" is not a valid ${field.name}.`)
  const n = Number(token)
  if (n < field.min || n > field.max) throw new Error(`${field.name} must be ${field.min}–${field.max}; got ${n}.`)
  return n
}

function parseField(text, field) {
  const set = new Set()
  for (const item of text.split(',')) {
    const [range, stepText] = item.split('/')
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) throw new Error(`"${item}" has an invalid step in ${field.name}.`)
    let from, to
    if (range === '*') [from, to] = [field.min, field.name === 'day of week' ? 6 : field.max]
    else if (range.includes('-')) {
      const [a, b] = range.split('-')
      ;[from, to] = [value(a, field), value(b, field)]
      if (from > to) throw new Error(`"${range}" runs backwards in ${field.name}.`)
    } else {
      from = value(range, field)
      to = stepText === undefined ? from : field.max
    }
    for (let n = from; n <= to; n += step) set.add(field.name === 'day of week' && n === 7 ? 0 : n)
  }
  return set
}

export function parseCron(expression) {
  const text = SHORTCUTS[expression.trim().toLowerCase()] ?? expression.trim()
  const parts = text.split(/\s+/)
  if (parts.length === 6) throw new Error('Six fields: this tool reads standard five-field cron (no seconds or year).')
  if (parts.length !== 5) throw new Error('A cron expression has five fields: minute hour day-of-month month day-of-week.')
  const [minutes, hours, days, months, weekdays] = parts.map((part, i) => parseField(part, FIELDS[i]))
  return {
    minutes, hours, days, months, weekdays, parts
  }
}

// As in Vixie cron, a day field starting with * counts as unrestricted for the either-day rule.
function dayMatches(cron, date) {
  const dom = cron.days.has(date.getDate())
  const dow = cron.weekdays.has(date.getDay())
  const anyDom = cron.parts[2].startsWith('*')
  const anyDow = cron.parts[4].startsWith('*')
  if (anyDom || anyDow) return dom && dow
  return dom || dow
}

/** The next `count` local times the expression fires after `from`. */
export function nextRuns(expression, from = new Date(), count = 5) {
  const cron = parseCron(expression)
  const runs = []
  const date = new Date(from)
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  for (let guard = 0; guard < 200000 && runs.length < count; guard++) {
    if (!cron.months.has(date.getMonth() + 1)) {
      date.setMonth(date.getMonth() + 1, 1)
      date.setHours(0, 0)
    } else if (!dayMatches(cron, date)) {
      date.setDate(date.getDate() + 1)
      date.setHours(0, 0)
    } else if (!cron.hours.has(date.getHours())) {
      date.setHours(date.getHours() + 1, 0)
    } else if (!cron.minutes.has(date.getMinutes())) {
      date.setMinutes(date.getMinutes() + 1)
    } else {
      runs.push(new Date(date))
      date.setMinutes(date.getMinutes() + 1)
    }
  }
  return runs
}

const pad = (n) => String(n).padStart(2, '0')

function list(items) {
  if (items.length <= 2) return items.join(' and ')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Consecutive runs collapse to "a through b". */
function describeSet(values, name = String) {
  const sorted = [...values].sort((a, b) => a - b)
  const runs = []
  for (const n of sorted) {
    const last = runs[runs.length - 1]
    if (last && n === last[1] + 1) last[1] = n
    else runs.push([n, n])
  }
  return list(runs.map(([a, b]) => (a === b ? name(a) : b === a + 1 ? `${name(a)} and ${name(b)}` : `${name(a)} through ${name(b)}`)))
}

function step(part) {
  const match = /^\*\/(\d+)$/.exec(part)
  return match ? Number(match[1]) : null
}

/** An English sentence for the expression, e.g. "At 09:00, Monday through Friday". */
export function describeCron(expression) {
  const cron = parseCron(expression)
  const [minPart, hourPart, dayPart, monthPart, weekdayPart] = cron.parts
  let time
  const minuteStep = step(minPart)
  const hourStep = step(hourPart)
  if (cron.minutes.size === 1 && cron.hours.size === 1) {
    time = `At ${pad([...cron.hours][0])}:${pad([...cron.minutes][0])}`
  } else if (minPart === '*' && hourPart === '*') {
    time = 'Every minute'
  } else if (minuteStep && hourPart === '*') {
    time = `Every ${minuteStep} minutes`
  } else if (cron.minutes.size === 1 && hourPart === '*') {
    const m = [...cron.minutes][0]
    time = m === 0 ? 'Every hour, on the hour' : `Every hour at minute ${m}`
  } else if (cron.minutes.size === 1 && hourStep) {
    time = `At minute ${[...cron.minutes][0]} past every ${hourStep} hours`
  } else if (cron.minutes.size === 1 && cron.hours.size <= 6) {
    const m = [...cron.minutes][0]
    time = `At ${list([...cron.hours].sort((a, b) => a - b).map((h) => `${pad(h)}:${pad(m)}`))}`
  } else {
    const minutes = minPart === '*' ? 'every minute' : minuteStep ? `every ${minuteStep} minutes` : `minute ${describeSet(cron.minutes)}`
    const hours = hourPart === '*' ? 'every hour' : hourStep ? `every ${hourStep} hours` : `hour ${describeSet(cron.hours)}`
    time = `At ${minutes} of ${hours}`
  }
  const days = []
  if (dayPart !== '*') days.push(`on day ${describeSet(cron.days)} of the month`)
  if (weekdayPart !== '*') days.push(`on ${describeSet(cron.weekdays, (d) => DAY_NAMES[d])}`)
  let sentence = time
  if (days.length) sentence += `, ${days.join(dayPart.startsWith('*') || weekdayPart.startsWith('*') ? ' and ' : ' or ')}`
  if (monthPart !== '*') sentence += `, in ${describeSet(cron.months, (m) => MONTH_NAMES[m - 1])}`
  return sentence
}
