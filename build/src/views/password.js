import { generatePassword, strength } from '../tools/ids.js'
import { checkbox, copyButton, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'password',
  title: 'Password Generator',
  group: 'Generate',
  icon: 'asterisk',
  color: '#f43f5e',
  description: 'Strong random passwords, with the character sets you choose',
  keywords: ['password', 'passphrase', 'secret', 'random', 'generate', 'strong', 'entropy', 'api key'],
  create() {
    const length = input({ type: 'number', min: 4, max: 128, value: 20, 'aria-label': 'Length' })
    const options = {
      lower: checkbox('a–z', () => generate(), true),
      upper: checkbox('A–Z', () => generate(), true),
      digits: checkbox('0–9', () => generate(), true),
      symbols: checkbox('!@#$', () => generate(), true),
      avoidAmbiguous: checkbox('Avoid look-alikes (l 1 I O 0)', () => generate())
    }
    const out = h('pre', { class: 'out password' })
    const result = h('div', { class: 'result' })
    function generate() {
      const n = Math.min(128, Math.max(4, Number(length.value) || 20))
      const settings = Object.fromEntries(Object.entries(options).map(([key, box]) => [key, box.get()]))
      const list = Array.from({ length: 5 }, () => generatePassword({ length: n, ...settings }))
      out.textContent = list.map((p) => p.password).join('\n')
      const level = strength(list[0].entropy)
      set(result,
        h('div', { class: 'block' },
          h('div', { class: 'block-head' },
            h('span', {}, 'Passwords'),
            h('button', { type: 'button', class: 'secondary small', onclick: generate }, 'Regenerate'),
            copyButton(() => out.textContent.split('\n')[0], 'Copy the first', 'Copy first')),
          out),
        rows([['Strength', `${list[0].entropy} bits`, { text: level.label, kind: level.kind }]]),
        hint('Each password has at least one character from every set you tick. Made with the system’s secure random generator, on this device.'))
    }
    length.addEventListener('input', generate)
    generate()
    return {
      node: h('div', {}, field('Length', length), h('div', { class: 'bar' }, Object.values(options).map((box) => box.node)), result),
      focus: length
    }
  }
}
