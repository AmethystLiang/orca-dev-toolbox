import { parseTime, timeRows } from '../tools/time.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'time',
  title: 'Timestamp',
  group: 'Inspect',
  description: 'Unix time ↔ local, UTC and ISO dates',
  keywords: ['unix', 'epoch', 'date', 'iso', 'utc', 'timezone', 'milliseconds'],
  create() {
    const source = input({ placeholder: 'Unix time (s, ms, µs) or a date' })
    const result = h('div', { class: 'result' })
    const now = h('button', { type: 'button', class: 'secondary', onclick: () => fill(String(Math.floor(Date.now() / 1000))) }, 'Now')
    function update() {
      try {
        const parsed = parseTime(source.value)
        if (!parsed) return set(result, hint('Seconds, milliseconds, microseconds and nanoseconds are told apart by length. Dates such as 2026-10-31 09:00 or ISO 8601 also work.'))
        set(result,
          rows(timeRows(parsed.date)),
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
    return { node: h('div', {}, h('div', { class: 'inline' }, field('Time', source), now), result), focus: source, fill }
  }
}
