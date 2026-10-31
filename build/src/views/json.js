import { describeJson, formatJson } from '../tools/json.js'
import { checkbox, errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'json',
  title: 'JSON Formatter',
  group: 'Format',
  icon: 'braces',
  color: '#eab308',
  description: 'Validate, pretty-print, minify and sort JSON',
  keywords: ['format', 'prettify', 'beautify', 'minify', 'validate', 'lint', 'sort'],
  create() {
    const source = textarea({ rows: 8, placeholder: '{"paste": "JSON here"}' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const sort = checkbox('Sort keys', () => update())
    const style = segmented([['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'Tab'], ['0', 'Minify']], '2', () => update(), 'Indent')
    function update() {
      if (!source.value.trim()) return set(result)
      try {
        const indent = style.get() === 'tab' ? '\t' : Number(style.get())
        out.set(formatJson(source.value, { indent, sort: sort.get() }))
        set(result, hint(`Valid JSON · ${describeJson(source.value)}`), out.node)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    return {
      node: h('div', {}, field('JSON', source), h('div', { class: 'bar' }, style.node, sort.node), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
