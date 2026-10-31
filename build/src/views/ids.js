import { randomString, STRING_ALPHABETS, uuidv4, uuidv7, uuidv7Time } from '../tools/ids.js'
import { localString } from '../tools/time.js'
import { checkbox, copyButton, field, h, hint, input, segmented } from '../ui.js'

export default {
  id: 'ids',
  title: 'UUID & Random',
  group: 'Generate',
  description: 'UUID v4 and v7, and random strings for secrets and keys',
  keywords: ['guid', 'uuid', 'v4', 'v7', 'random', 'password', 'secret', 'token', 'id'],
  create() {
    const list = h('pre', { class: 'out ids' })
    const count = input({ type: 'number', min: 1, max: 100, value: 5, 'aria-label': 'How many' })
    const upper = checkbox('Uppercase', () => generate())
    const length = input({ type: 'number', min: 1, max: 512, value: 32, 'aria-label': 'Length' })
    const alphabet = h('select', { 'aria-label': 'Characters', onchange: () => generate() }, STRING_ALPHABETS.map((name) => h('option', { value: name }, name)))
    const options = h('div', { class: 'inline', hidden: true }, field('Length', length), field('Characters', alphabet))
    const inspected = h('p', { class: 'hint' })
    const kind = segmented([['v4', 'UUID v4'], ['v7', 'UUID v7'], ['string', 'Random string']], 'v4', () => {
      options.hidden = kind.get() !== 'string'
      generate()
    }, 'Kind')
    function generate() {
      const n = Math.min(100, Math.max(1, Number(count.value) || 1))
      const size = Math.min(512, Math.max(1, Number(length.value) || 32))
      const make = { v4: () => uuidv4(), v7: () => uuidv7(), string: () => randomString(size, alphabet.value) }[kind.get()]
      list.textContent = Array.from({ length: n }, make).map((id) => (upper.get() ? id.toUpperCase() : id)).join('\n')
    }
    count.addEventListener('input', generate)
    length.addEventListener('input', generate)
    generate()
    return {
      node: h('div', {},
        kind.node,
        h('div', { class: 'inline' }, field('How many', count), upper.node),
        options,
        h('div', { class: 'block' },
          h('div', { class: 'block-head' },
            h('span', {}, 'Generated'),
            h('button', { type: 'button', class: 'secondary small', onclick: generate }, 'Regenerate'),
            copyButton(() => list.textContent, 'Copy all')),
          list),
        inspected,
        hint('v7 ids begin with their creation time, so they sort by age; v4 is fully random. Both use the system’s secure random generator.')),
      focus: count,
      fill(value) {
        const time = uuidv7Time(value)
        inspected.textContent = time ? `${value.trim()} was created ${localString(time)}.` : ''
      }
    }
  }
}
