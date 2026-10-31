import { describeCron, nextRuns } from '../tools/cron.js'
import { localString, relative } from '../tools/time.js'
import { errorText, field, h, input, rows, set } from '../ui.js'

const PRESETS = [
  ['*/5 * * * *', 'Every 5 min'], ['0 * * * *', 'Hourly'], ['0 9 * * 1-5', 'Weekdays 9:00'],
  ['0 0 * * 0', 'Weekly'], ['0 0 1 * *', 'Monthly']
]

export default {
  id: 'cron',
  title: 'Cron',
  group: 'Inspect',
  description: 'Explain a cron schedule and list its next runs',
  keywords: ['crontab', 'schedule', 'job', 'github actions', 'every'],
  create() {
    const source = input({ class: 'mono', placeholder: 'minute hour day month weekday', value: '0 9 * * 1-5' })
    const result = h('div', { class: 'result' })
    function update() {
      if (!source.value.trim()) return set(result)
      try {
        set(result,
          h('p', { class: 'sentence' }, describeCron(source.value)),
          h('div', { class: 'subhead' }, 'Next runs (local time)'),
          rows(nextRuns(source.value, new Date(), 5).map((date) => [relative(date), localString(date)])))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    function fill(value) {
      source.value = value
      update()
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {},
        field('Expression', source),
        h('div', { class: 'chips' }, PRESETS.map(([value, label]) => h('button', { type: 'button', class: 'chip', onclick: () => fill(value) }, label))),
        result),
      focus: source,
      fill
    }
  }
}
