import { CLASSES, describeMode, has, parseMode, PERMS, SPECIAL, toggle, toOctal, toSymbolic } from '../tools/chmod.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'chmod',
  title: 'Chmod',
  group: 'Convert',
  icon: 'lock',
  color: '#f43f5e',
  description: 'Unix file permissions: 755 ↔ rwxr-xr-x',
  keywords: ['permissions', 'mode', 'unix', 'octal', 'rwx', 'file', 'setuid', 'sticky', 'umask'],
  create() {
    let mode = 0o755
    const source = input({ placeholder: '755, 0644 or rwxr-xr-x', class: 'mono' })
    const result = h('div', { class: 'result' })
    const boxes = CLASSES.map((_, who) => PERMS.map((_, perm) =>
      h('input', { type: 'checkbox', 'aria-label': `${CLASSES[who]} ${PERMS[perm].toLowerCase()}`, onchange: (event) => {
        mode = toggle(mode, who, perm, event.target.checked)
        render(true)
      } })))
    const specials = SPECIAL.map(([name, bit, about]) =>
      h('label', { class: 'check', title: about },
        h('input', { type: 'checkbox', onchange: (event) => {
          mode = event.target.checked ? mode | bit : mode & ~bit
          render(true)
        } }), name))
    const grid = h('table', { class: 'perm-grid' },
      h('thead', {}, h('tr', {}, h('th', {}), PERMS.map((perm) => h('th', { scope: 'col' }, perm)))),
      h('tbody', {}, CLASSES.map((name, who) => h('tr', {}, h('th', { scope: 'row' }, name), boxes[who].map((box) => h('td', {}, box))))))
    function render(fromGrid = false) {
      boxes.forEach((row, who) => row.forEach((box, perm) => (box.checked = has(mode, who, perm))))
      specials.forEach((label, index) => (label.firstChild.checked = Boolean(mode & SPECIAL[index][1])))
      if (fromGrid) source.value = toOctal(mode)
      set(result,
        rows([
          ['Octal', toOctal(mode)],
          ['Symbolic', toSymbolic(mode)],
          ['Command', `chmod ${toOctal(mode)} file`]
        ]),
        hint(describeMode(mode)))
    }
    function update() {
      try {
        const parsed = parseMode(source.value)
        if (parsed === null) return
        mode = parsed
        render()
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    source.value = '755'
    render()
    return {
      node: h('div', {}, field('Mode', source), grid, h('div', { class: 'bar' }, specials), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
