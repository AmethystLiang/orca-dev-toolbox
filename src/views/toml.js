import { convert, guessFormat, TOML_TARGETS } from '../tools/toml.js'
import { errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

const NAMES = { json: 'JSON', yaml: 'YAML', toml: 'TOML' }

export default {
  id: 'toml',
  title: 'TOML ↔ JSON / YAML',
  group: 'Convert',
  icon: 'cog',
  color: '#9333ea',
  description: 'Cargo.toml, pyproject.toml and other TOML to JSON or YAML, and back',
  keywords: ['toml', 'cargo', 'rust', 'pyproject', 'python', 'poetry', 'hugo', 'netlify', 'config', 'json', 'yaml', 'convert', 'ini'],
  create() {
    const source = textarea({ rows: 8, placeholder: '[package]\nname = "app"\nversion = "0.1.0"\n\n[dependencies]\nserde = { version = "1", features = ["derive"] }' })
    const target = segmented(TOML_TARGETS, 'json', () => update(), 'Convert to')
    const out = output('JSON')
    const result = h('div', { class: 'result' })
    function update() {
      if (!source.value.trim()) return set(result, hint('Paste TOML, JSON or YAML: the input format is recognised. TOML has no null and no top-level arrays, so those cannot go to TOML.'))
      const from = guessFormat(source.value)
      let to = target.get()
      if (to === from) to = from === 'toml' ? 'json' : 'toml'
      try {
        out.node.querySelector('.block-head span').textContent = `${NAMES[from]} → ${NAMES[to]}`
        out.set(convert(source.value, from, to))
        set(result, out.node, target.get() === from ? hint(`The input is already ${NAMES[from]}; showing ${NAMES[to]}.`) : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Input', source), field('Convert to', target.node), result),
      focus: source,
      fill(value) {
        source.value = value
        target.set(guessFormat(value) === 'toml' ? 'json' : 'toml')
      }
    }
  }
}
