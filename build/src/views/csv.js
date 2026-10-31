import { csvToJson, jsonToCsv } from '../tools/csv.js'
import { checkbox, errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

const NAMES = { ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }

export default {
  id: 'csv',
  title: 'CSV ↔ JSON',
  group: 'Convert',
  icon: 'table',
  color: '#22c55e',
  description: 'CSV or TSV to JSON objects, and JSON arrays back to CSV',
  keywords: ['csv', 'tsv', 'spreadsheet', 'excel', 'table', 'json', 'convert', 'comma'],
  create() {
    const source = textarea({ rows: 8, placeholder: 'name,email\nAda,ada@example.com' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const header = checkbox('First row is the header', () => update(), true)
    const types = checkbox('Read numbers and booleans', () => update(), true)
    const delimiter = h('select', { 'aria-label': 'Delimiter', onchange: () => update() },
      [['auto', 'Detect'], [',', 'Comma'], [';', 'Semicolon'], ['\t', 'Tab'], ['|', 'Pipe']].map(([value, label]) => h('option', { value }, label)))
    const options = h('div', { class: 'bar' }, header.node, types.node)
    const direction = segmented([['toJson', 'CSV → JSON'], ['toCsv', 'JSON → CSV']], 'toJson', (value) => {
      options.hidden = value !== 'toJson'
      source.placeholder = value === 'toJson' ? 'name,email\nAda,ada@example.com' : '[{"name": "Ada", "email": "ada@example.com"}]'
      update()
    }, 'Direction')
    function update() {
      if (!source.value.trim()) return set(result, hint('Quoted fields, doubled quotes and line breaks inside quotes are read as RFC 4180 describes.'))
      try {
        if (direction.get() === 'toJson') {
          const parsed = csvToJson(source.value, { delimiter: delimiter.value, types: types.get(), header: header.get() })
          out.set(JSON.stringify(parsed.value, null, 2))
          set(result, out.node, hint(`${parsed.value.length} rows × ${parsed.columns} columns, ${NAMES[parsed.delimiter]}-separated.`))
        } else {
          const sep = delimiter.value === 'auto' ? ',' : delimiter.value
          out.set(jsonToCsv(source.value, { delimiter: sep }))
          set(result, out.node)
        }
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, direction.node, field('Input', source), h('div', { class: 'inline' }, field('Delimiter', delimiter)), options, result),
      focus: source,
      fill(value) {
        source.value = value
        direction.set('toJson')
      }
    }
  }
}
