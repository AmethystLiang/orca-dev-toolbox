import { portRange, searchPorts } from '../tools/ports.js'
import { field, h, hint, input, set } from '../ui.js'

export default {
  id: 'ports',
  title: 'Ports',
  group: 'Inspect',
  icon: 'plug',
  color: '#7c3aed',
  description: 'What usually listens on a port: 5432, 6379, 3000…',
  keywords: ['port', 'tcp', 'udp', 'service', 'listen', 'firewall', 'postgres', 'redis', 'mysql', 'ssh', 'localhost', 'lsof', 'netstat'],
  create() {
    const search = input({ placeholder: 'Port, range or name: 5432, 8000-8999, redis', class: 'mono', 'aria-label': 'Search ports' })
    const list = h('div', { class: 'status-list' })
    function update() {
      const q = search.value.trim()
      const found = searchPorts(q)
      const number = /^\d+$/.test(q) ? Number(q) : null
      set(list,
        number !== null ? hint(portRange(number)) : null,
        found.length
          ? found.map(([port, proto, name, about]) => h('div', { class: 'status port' },
            h('span', { class: 'status-code' }, port),
            h('span', { class: 'tool-text' }, h('span', { class: 'status-name' }, name, h('span', { class: 'badge' }, proto)), h('span', { class: 'tool-desc wrap' }, about))))
          : hint(`No common service on “${q}”.`),
        q ? null : hint('Find what holds a port: lsof -i :5432 (macOS, Linux) or netstat -ano | findstr :5432 (Windows).'))
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
