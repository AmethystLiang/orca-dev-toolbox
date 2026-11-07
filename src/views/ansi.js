import { stripAnsi } from '../tools/ansi.js'
import { checkbox, field, h, hint, output, set, textarea } from '../ui.js'

export default {
  id: 'ansi',
  title: 'Clean Terminal Output',
  group: 'Format',
  icon: 'eraser',
  color: '#475569',
  description: 'Strip colour and cursor codes from terminal output and CI logs',
  keywords: ['ansi', 'escape', 'color', 'colour', 'terminal', 'console', 'log', 'strip', 'clean', 'tty', 'x1b', '033', 'ci', 'output'],
  create() {
    const source = textarea({ rows: 8, placeholder: '\\x1b[32m✓\\x1b[0m 12 passed\n\\x1b[31m✗\\x1b[0m 1 failed' })
    const trim = checkbox('Trim line ends', () => update(), true)
    const squeeze = checkbox('Fold blank lines', () => update())
    const out = output('Plain text')
    const result = h('div', { class: 'result' })
    function update() {
      if (!source.value) return set(result, hint('Paste output from a terminal, CI log or agent session. Escapes written out as text (\\x1b[, \\033[, \\e[, ^[[) are removed too.'))
      const clean = stripAnsi(source.value, { trim: trim.get(), squeeze: squeeze.get() })
      out.set(clean.text)
      set(result, out.node, hint(clean.removed ? `${clean.removed} escape code${clean.removed === 1 ? '' : 's'} removed.` : 'No escape codes found.'))
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Terminal output', source), h('div', { class: 'bar' }, trim.node, squeeze.node), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
