import { processLines, SORTS } from '../tools/text.js'
import { checkbox, field, h, hint, output, set, textarea } from '../ui.js'

export default {
  id: 'lines',
  title: 'Line Tools',
  group: 'Text',
  icon: 'lines',
  color: '#3b82f6',
  description: 'Sort, dedupe, trim, reverse or shuffle lines',
  keywords: ['sort', 'unique', 'dedupe', 'duplicate', 'uniq', 'trim', 'empty', 'reverse', 'shuffle', 'list'],
  create() {
    const source = textarea({ rows: 7, placeholder: 'One item per line' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const sort = h('select', { 'aria-label': 'Order', onchange: () => update() }, SORTS.map(([value, label]) => h('option', { value }, label)))
    const trim = checkbox('Trim', () => update(), true)
    const dropEmpty = checkbox('Remove empty', () => update(), true)
    const unique = checkbox('Unique', () => update(), true)
    const ignoreCase = checkbox('Ignore case', () => update())
    function update() {
      if (!source.value) return set(result)
      const lines = processLines(source.value, {
        trim: trim.get(), dropEmpty: dropEmpty.get(), unique: unique.get(), ignoreCase: ignoreCase.get(), sort: sort.value
      })
      out.set(lines.text)
      const removed = lines.duplicates ? `, ${lines.duplicates} duplicate${lines.duplicates === 1 ? '' : 's'} removed` : ''
      set(result, out.node, hint(`${lines.before} lines → ${lines.after}${removed}. Sorting is natural: file9 before file10.`))
    }
    source.addEventListener('input', update)
    return {
      node: h('div', {},
        field('Lines', source),
        h('div', { class: 'inline' }, field('Order', sort)),
        h('div', { class: 'bar' }, trim.node, dropEmpty.node, unique.node, ignoreCase.node),
        result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
