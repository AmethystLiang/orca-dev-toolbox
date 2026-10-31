import { CASES, convertCase } from '../tools/text.js'
import { field, h, hint, rows, set, textarea } from '../ui.js'

export default {
  id: 'case',
  title: 'Case Converter',
  group: 'Text',
  icon: 'type',
  color: '#a855f7',
  description: 'camelCase, snake_case, kebab-case, CONSTANT_CASE and more',
  keywords: ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'upper', 'lower', 'rename', 'identifier', 'slug'],
  create() {
    const source = textarea({ rows: 3, placeholder: 'userProfileId, user_profile_id or user profile id' })
    const result = h('div', { class: 'result' })
    function update() {
      if (!source.value.trim()) return set(result, hint('Each line converts on its own, so you can paste a list of names.'))
      set(result, rows(CASES.map(([name]) => [name, convertCase(source.value, name)])))
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Text', source), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
