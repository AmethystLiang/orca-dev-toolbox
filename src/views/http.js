import { CLASSES, searchStatus } from '../tools/http.js'
import { field, h, hint, input, set } from '../ui.js'

export default {
  id: 'http',
  title: 'HTTP Status',
  group: 'Inspect',
  icon: 'globe',
  color: '#ef4444',
  description: 'What each HTTP status code means and when to use it',
  keywords: ['status', 'code', 'http', 'response', '404', '500', 'error', 'redirect', 'rest', 'api'],
  create() {
    const search = input({ placeholder: 'Code, name or word: 404, 4xx, redirect, rate', 'aria-label': 'Search status codes' })
    const list = h('div', { class: 'status-list' })
    function update() {
      const found = searchStatus(search.value)
      if (!found.length) return set(list, hint(`No status code matches “${search.value.trim()}”.`))
      const groups = []
      for (const [code, name, about] of found) {
        const cls = Math.floor(code / 100)
        if (groups[groups.length - 1]?.cls !== cls) groups.push({ cls, items: [] })
        groups[groups.length - 1].items.push(
          h('div', { class: `status c${cls}` },
            h('span', { class: 'status-code' }, code),
            h('span', { class: 'tool-text' }, h('span', { class: 'status-name' }, name), h('span', { class: 'tool-desc wrap' }, about))))
      }
      set(list, groups.map(({ cls, items }) => h('section', { class: 'group' }, h('h2', {}, `${cls}xx · ${CLASSES[cls]}`), items)))
    }
    search.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Search', search), list),
      focus: search,
      fill(value) {
        search.value = value
        update()
      }
    }
  }
}
