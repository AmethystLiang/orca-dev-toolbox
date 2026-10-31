import { diffLines, hunks, summarize, unifiedDiff } from '../tools/diff.js'
import { checkbox, copyButton, field, h, hint, set, textarea } from '../ui.js'

const SIGNS = { equal: ' ', delete: '−', insert: '+' }

function lineNode(line) {
  const content = line.parts
    ? line.parts.map((part) => (part.changed ? h(line.type === 'delete' ? 'del' : 'ins', {}, part.text) : part.text))
    : line.text || ' '
  return h('div', { class: `dl ${line.type}` },
    h('span', { class: 'ln' }, line.oldLine ?? ''),
    h('span', { class: 'ln' }, line.newLine ?? ''),
    h('span', { class: 'sign' }, SIGNS[line.type]),
    h('span', { class: 'code' }, content))
}

export default {
  id: 'diff',
  title: 'Text Diff',
  group: 'Text',
  icon: 'diff',
  color: '#06b6d4',
  description: 'Compare two texts line by line, with changed words marked',
  keywords: ['compare', 'difference', 'changes', 'patch', 'unified', 'git', 'delta'],
  create() {
    const before = textarea({ rows: 5, placeholder: 'Original text' })
    const after = textarea({ rows: 5, placeholder: 'Changed text' })
    const ignoreWhitespace = checkbox('Ignore whitespace', () => update())
    const result = h('div', { class: 'result' })
    let patch = ''
    const swap = h('button', { type: 'button', class: 'secondary', onclick: () => {
      ;[before.value, after.value] = [after.value, before.value]
      update()
    } }, 'Swap')
    function update() {
      if (!before.value && !after.value) return set(result)
      const lines = diffLines(before.value, after.value, { ignoreWhitespace: ignoreWhitespace.get() })
      if (!lines) return set(result, hint('These texts differ in too many places to compare here.'))
      const { added, removed } = summarize(lines)
      if (!added && !removed) return set(result, hint(ignoreWhitespace.get() ? 'No differences, ignoring whitespace.' : 'The texts are identical.'))
      patch = unifiedDiff(lines, { oldName: 'a/original', newName: 'b/changed' })
      const body = h('div', { class: 'diff' })
      let shown = 0
      for (const { from, to } of hunks(lines, 3)) {
        if (from > shown) body.append(h('div', { class: 'fold' }, `⋯ ${from - shown} unchanged line${from - shown === 1 ? '' : 's'}`))
        for (let i = from; i <= to; i++) body.append(lineNode(lines[i]))
        shown = to + 1
      }
      if (shown < lines.length) body.append(h('div', { class: 'fold' }, `⋯ ${lines.length - shown} unchanged line${lines.length - shown === 1 ? '' : 's'}`))
      set(result,
        h('div', { class: 'block' },
          h('div', { class: 'block-head' },
            h('span', {}, h('b', { class: 'added' }, `+${added}`), ' ', h('b', { class: 'removed' }, `−${removed}`)),
            copyButton(() => patch, 'Copy as patch')),
          body),
        hint('Copy gives a unified diff that git apply and patch accept.'))
    }
    before.addEventListener('input', update)
    after.addEventListener('input', update)
    return {
      node: h('div', {},
        field('Original', before),
        field('Changed', after),
        h('div', { class: 'bar' }, ignoreWhitespace.node, swap),
        result),
      focus: before,
      fill(value) {
        before.value = value
        update()
      }
    }
  }
}
