import { durationRows, parseDuration, parseSize, sizeRows } from '../tools/units.js'
import { errorText, field, h, hint, input, rows, segmented, set } from '../ui.js'

const PLACEHOLDERS = { size: '1.5 GB, 512 MiB, 2g or 1048576', duration: '1h30m, 90s, 250ms, 01:30:00 or PT1H30M' }

export default {
  id: 'units',
  title: 'Size & Duration',
  group: 'Convert',
  icon: 'ruler',
  color: '#eab308',
  description: 'Bytes ↔ KB, MiB, GB; durations ↔ ms, seconds, 1h 30m, ISO 8601',
  keywords: ['bytes', 'kb', 'mb', 'gb', 'kib', 'mib', 'gib', 'size', 'storage', 'memory', 'duration', 'time', 'ms', 'seconds', 'minutes', 'timeout', 'iso 8601', 'units'],
  create() {
    const source = input({ class: 'mono' })
    const result = h('div', { class: 'result' })
    const unit = segmented([['ms', 'ms'], ['s', 'seconds']], 'ms', () => update(), 'Bare numbers are')
    const unitField = h('div', { class: 'inline', hidden: true }, field('Bare numbers are', unit.node))
    const mode = segmented([['size', 'Data size'], ['duration', 'Duration']], 'size', (value) => {
      source.placeholder = PLACEHOLDERS[value]
      unitField.hidden = value !== 'duration'
      update()
    }, 'Kind')
    source.placeholder = PLACEHOLDERS.size
    function update() {
      try {
        if (mode.get() === 'size') {
          const bytes = parseSize(source.value)
          if (bytes === null) return set(result, hint('KB, MB and GB are powers of 1000; KiB, MiB and GiB are powers of 1024. A bare k, m or g, as in -Xmx2g or Docker’s --memory, is binary.'))
          set(result, rows(sizeRows(bytes)))
        } else {
          const ms = parseDuration(source.value, unit.get())
          if (ms === null) return set(result, hint('Go and Prometheus style (1h30m), clock time (01:30:00) and ISO 8601 (PT1H30M) are all read.'))
          set(result, rows(durationRows(ms)))
        }
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, mode.node, field('Value', source), unitField, result),
      focus: source,
      fill(value) {
        source.value = value
        mode.set(/^\s*(\d+(\.\d+)?\s*(b|bytes?|[kmgtp]i?b|[kmgt])\s*)$/i.test(value) ? 'size' : 'duration')
      }
    }
  }
}
