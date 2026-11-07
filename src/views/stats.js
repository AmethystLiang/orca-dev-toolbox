import { countText } from '../tools/text.js'
import { field, h, hint, rows, set, textarea } from '../ui.js'

const format = (n) => n.toLocaleString('en-US')

export default {
  id: 'stats',
  title: 'Text Stats',
  group: 'Text',
  icon: 'gauge',
  color: '#f97316',
  description: 'Characters, words, lines, bytes and a token estimate',
  keywords: ['count', 'length', 'characters', 'chars', 'words', 'lines', 'bytes', 'size', 'tokens', 'llm'],
  create() {
    const source = textarea({ rows: 7, placeholder: 'Paste text to count' })
    const result = h('div', { class: 'result' })
    function update() {
      const c = countText(source.value)
      const minutes = c.readingMinutes < 1 ? 'under a minute' : `${Math.round(c.readingMinutes)} min`
      set(result,
        rows([
          ['Characters', format(c.characters)],
          ['Words', format(c.words)],
          ['Lines', format(c.lines)],
          ['Paragraphs', format(c.paragraphs)],
          ['Bytes (UTF-8)', format(c.bytes)],
          ['UTF-16 units', format(c.codeUnits), c.codeUnits !== c.characters ? { text: 'JS .length' } : null],
          ['Tokens', `≈ ${format(c.tokens)}`, { text: 'estimate' }]
        ]),
        hint(`Characters count what you see, so 👋🏽 is one. The token count is an estimate; Token Counter shows how much of a context window it fills. Reading time: ${minutes}.`))
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
