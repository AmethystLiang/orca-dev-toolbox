import { jsonToTypes, TYPE_LANGUAGES } from '../tools/types.js'
import { errorText, field, h, hint, input, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'types',
  title: 'JSON to Types',
  group: 'Convert',
  icon: 'cube',
  color: '#0ea5e9',
  description: 'TypeScript, Go, Rust or Python types from a JSON sample',
  keywords: ['typescript', 'interface', 'go', 'golang', 'struct', 'rust', 'serde', 'python', 'dataclass', 'schema', 'model', 'quicktype'],
  create() {
    const source = textarea({ rows: 8, placeholder: '{"id": 1, "name": "Ada", "tags": ["admin"]}' })
    const rootName = input({ value: 'Root', 'aria-label': 'Root type name' })
    const result = h('div', { class: 'result' })
    const out = output('Types')
    const language = segmented(TYPE_LANGUAGES, 'typescript', () => update(), 'Language')
    function update() {
      if (!source.value.trim()) return set(result, hint('Paste an API response. In arrays of objects, fields missing from some become optional and fields that are sometimes null become nullable.'))
      try {
        out.set(jsonToTypes(source.value, language.get(), rootName.value.trim() || 'Root'))
        set(result, out.node)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    rootName.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, language.node, field('JSON sample', source), field('Root type', rootName), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
