import { ESCAPERS } from '../tools/escape.js'
import { errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

const NOTES = {
  html: { escape: 'Escapes & < > " and \' for HTML text and attributes.', unescape: 'Reads named (&hellip;) and numeric (&#8230; &#x2026;) references.' },
  json: { escape: 'The inside of a JSON or JavaScript string literal.', unescape: 'Surrounding quotes are optional.' },
  unicode: { escape: 'Non-ASCII characters as \\uXXXX, as JSON, JavaScript and Java read them.', unescape: 'Reads \\uXXXX, \\u{1F600}, \\xXX and U+XXXX.' }
}

export default {
  id: 'escape',
  title: 'Escape',
  group: 'Encode',
  icon: 'code',
  color: '#f97316',
  description: 'HTML entities, JSON strings and Unicode escapes, both ways',
  keywords: ['unescape', 'html', 'entities', 'entity', 'json', 'string', 'stringify', 'unicode', 'quote', 'backslash', '\\u'],
  create() {
    const source = textarea({ rows: 5, placeholder: 'Text to escape' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const note = hint('')
    const kind = segmented(Object.entries(ESCAPERS).map(([id, { label }]) => [id, label]), 'html', () => update(), 'Format')
    const direction = segmented([['escape', 'Escape'], ['unescape', 'Unescape']], 'escape', (value) => {
      source.placeholder = value === 'escape' ? 'Text to escape' : 'Escaped text to read'
      update()
    }, 'Direction')
    function update() {
      note.textContent = NOTES[kind.get()][direction.get()]
      if (!source.value) return set(result)
      try {
        out.set(ESCAPERS[kind.get()][direction.get()](source.value))
        set(result, out.node)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, h('div', { class: 'bar' }, kind.node, direction.node), field('Input', source), note, result),
      focus: source,
      fill(value) {
        source.value = value
        kind.set(/&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(value) ? 'html' : 'unicode')
        direction.set('unescape')
      }
    }
  }
}
