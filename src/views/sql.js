import { formatSql, minifySql } from '../tools/sql.js'
import { checkbox, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'sql',
  title: 'SQL Formatter',
  group: 'Format',
  icon: 'database',
  color: '#3b82f6',
  description: 'Lay out a query: one clause per line, conditions and subqueries indented',
  keywords: ['sql', 'query', 'format', 'prettify', 'beautify', 'minify', 'postgres', 'mysql', 'sqlite', 'select', 'orm', 'log'],
  create() {
    const source = textarea({ rows: 7, placeholder: "select id, name from users where active = true and role = 'admin' order by name" })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const upper = checkbox('Uppercase keywords', () => update(), true)
    const style = segmented([['2', '2 spaces'], ['4', '4 spaces'], ['min', 'One line']], '2', () => update(), 'Layout')
    function update() {
      if (!source.value.trim()) return set(result, hint('For queries copied from logs and ORMs. Strings, quoted names and comments are kept as written; any dialect tokenises.'))
      const value = style.get()
      out.set(value === 'min' ? minifySql(source.value) : formatSql(source.value, { uppercase: upper.get(), indent: ' '.repeat(Number(value)) }).trimEnd())
      set(result, out.node)
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('SQL', source), h('div', { class: 'bar' }, style.node, upper.node), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
