import { jsonToYaml, parseYaml } from '../tools/yaml.js'
import { checkbox, errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'yaml',
  title: 'YAML ↔ JSON',
  group: 'Convert',
  icon: 'file',
  color: '#14b8a6',
  description: 'Convert YAML to JSON and back, with errors by line',
  keywords: ['yml', 'json', 'convert', 'kubernetes', 'k8s', 'compose', 'config', 'validate'],
  create() {
    const source = textarea({ rows: 8, placeholder: 'name: app\nreplicas: 2\nports:\n  - 80' })
    const result = h('div', { class: 'result' })
    const out = output('JSON')
    const sort = checkbox('Sort keys', () => update())
    const direction = segmented([['toJson', 'YAML → JSON'], ['toYaml', 'JSON → YAML']], 'toJson', (value) => {
      source.placeholder = value === 'toJson' ? 'name: app\nreplicas: 2\nports:\n  - 80' : '{"name": "app", "replicas": 2}'
      update()
    }, 'Direction')
    function update() {
      if (!source.value.trim()) return set(result, hint('Several YAML documents separated by --- become a JSON array.'))
      try {
        if (direction.get() === 'toJson') {
          const { value, documents } = parseYaml(source.value)
          out.node.querySelector('.block-head span').textContent = 'JSON'
          out.set(JSON.stringify(sort.get() ? sortKeys(value) : value, null, 2))
          set(result, out.node, documents > 1 ? hint(`${documents} documents, as an array.`) : null)
        } else {
          out.node.querySelector('.block-head span').textContent = 'YAML'
          out.set(jsonToYaml(source.value, { sortKeys: sort.get() }))
          set(result, out.node)
        }
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, h('div', { class: 'bar' }, direction.node, sort.node), field('Input', source), result),
      focus: source,
      fill(value) {
        source.value = value
        direction.set(/^\s*[[{]/.test(value) ? 'toYaml' : 'toJson')
      }
    }
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]))
  return value
}
