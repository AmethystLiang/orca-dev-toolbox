import { parseUserAgent } from '../tools/useragent.js'
import { errorText, field, h, hint, rows, set, textarea } from '../ui.js'

const joined = (...parts) => parts.filter(Boolean).join(' ')

export default {
  id: 'useragent',
  title: 'User-Agent',
  group: 'Inspect',
  icon: 'monitor',
  color: '#2563eb',
  description: 'Browser, OS, device and bots from a User-Agent string',
  keywords: ['user agent', 'useragent', 'ua', 'browser', 'device', 'os', 'bot', 'crawler', 'mobile', 'header', 'parser', 'zalo', 'cốc cốc'],
  create() {
    const source = textarea({ rows: 4, placeholder: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 …' })
    const result = h('div', { class: 'result' })
    const mine = h('button', { type: 'button', class: 'secondary', onclick: () => { source.value = navigator.userAgent; update() } }, 'Use this panel’s UA')
    function update() {
      if (!source.value.trim()) return set(result, hint('Paste the header from a log line, an analytics row or DevTools.'))
      try {
        const r = parseUserAgent(source.value)
        const who = r.bot ?? r.client ?? r.browser
        set(result,
          rows([
            ['Kind', { bot: 'Bot or crawler', client: 'HTTP client or library', browser: 'Browser', unknown: 'Unknown' }[r.kind], r.kind === 'bot' ? { text: 'bot', kind: 'bad' } : null],
            who ? [r.kind === 'browser' ? 'Browser' : 'Name', joined(who.name, who.version)] : null,
            r.engine ? ['Engine', joined(r.engine.name, r.engine.version)] : null,
            r.os ? ['OS', joined(r.os.name, r.os.version)] : null,
            r.device ? ['Device', joined(r.device.type, '·', r.device.vendor, r.device.model).replace(/ · $/, '')] : null
          ].filter(Boolean)),
          r.engine?.note ? hint(r.engine.note) : null,
          r.notes.map((note) => hint(note)))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('User-Agent', source), h('div', { class: 'bar' }, mine), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
