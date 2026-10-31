import { parseTime, timeRows, timeZones, zoneString } from '../tools/time.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'time',
  title: 'Timestamp',
  group: 'Inspect',
  icon: 'clock',
  color: '#3b82f6',
  description: 'Unix time ↔ local, UTC and ISO dates',
  keywords: ['unix', 'epoch', 'date', 'iso', 'utc', 'timezone', 'time zone', 'milliseconds', 'convert'],
  create() {
    const source = input({ placeholder: 'Unix time (s, ms, µs) or a date' })
    const result = h('div', { class: 'result' })
    const zones = timeZones()
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const zone = h('select', { 'aria-label': 'Also show in time zone', onchange: () => update() },
      zones.map((name) => h('option', { value: name }, name.replace(/_/g, ' '))))
    zone.value = localZone === 'America/New_York' ? 'Europe/London' : 'America/New_York'
    const now = h('button', { type: 'button', class: 'secondary', onclick: () => fill(String(Math.floor(Date.now() / 1000))) }, 'Now')
    function update() {
      try {
        const parsed = parseTime(source.value)
        if (!parsed) return set(result, hint('Seconds, milliseconds, microseconds and nanoseconds are told apart by length. Dates such as 2026-10-31 09:00 or ISO 8601 also work.'))
        const zoneRows = timeRows(parsed.date)
        zoneRows.splice(1, 0, [zone.value.replace(/_/g, ' ').replace(/^.*\//, ''), zoneString(parsed.date, zone.value)])
        set(result,
          rows(zoneRows),
          hint(parsed.unit === 'date' ? 'Read as a date in your local time zone unless it names one.' : `Read as ${parsed.unit} since 1970-01-01 UTC.`))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    function fill(value) {
      source.value = value
      update()
    }
    source.addEventListener('input', update)
    fill(String(Math.floor(Date.now() / 1000)))
    return {
      node: h('div', {}, h('div', { class: 'inline' }, field('Time', source), now), field('Also in', zone), result),
      focus: source,
      fill
    }
  }
}
