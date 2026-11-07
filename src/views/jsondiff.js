import { diffJson, preview } from '../tools/jsondiff.js'
import { checkbox, copyButton, errorText, field, h, hint, input, set, textarea } from '../ui.js'

const LABELS = { added: 'Added', removed: 'Removed', changed: 'Changed', type: 'Type changed' }
const SIGNS = { added: '+', removed: '−', changed: '~', type: '~' }

export default {
  id: 'jsondiff',
  title: 'JSON Diff',
  group: 'Format',
  icon: 'compare',
  color: '#0891b2',
  description: 'What changed between two JSON documents, by path, whatever the key order',
  keywords: ['json', 'diff', 'compare', 'api', 'response', 'payload', 'snapshot', 'qa', 'qc', 'test', 'regression', 'deep equal', 'changes'],
  create() {
    const left = textarea({ rows: 6, placeholder: '{"id": 1, "status": "active", "tags": ["a", "b"]}', 'aria-label': 'Left JSON' })
    const right = textarea({ rows: 6, placeholder: '{"status": "inactive", "id": 1, "tags": ["a"]}', 'aria-label': 'Right JSON' })
    const ignore = input({ class: 'mono', placeholder: 'updatedAt, requestId', 'aria-label': 'Keys to ignore' })
    const unordered = checkbox('Arrays in any order', () => update())
    const result = h('div', { class: 'result' })
    let report = ''
    function update() {
      if (!left.value.trim() || !right.value.trim()) return set(result, hint('Paste two JSON documents, such as one API response from staging and one from production. Key order never counts.'))
      try {
        const keys = ignore.value.split(/[\s,]+/).filter(Boolean)
        const changes = diffJson(left.value, right.value, { unordered: unordered.get(), ignore: keys })
        if (!changes.length) {
          report = ''
          return set(result, h('p', { class: 'sentence ok-text' }, 'Same data.'), keys.length ? hint(`Ignoring ${keys.join(', ')}.`) : null)
        }
        const counts = Object.entries(Object.groupBy(changes, (c) => c.kind)).map(([kind, list]) => `${list.length} ${LABELS[kind].toLowerCase()}`)
        report = changes.map((c) => `${SIGNS[c.kind]} ${c.path}: ${c.kind === 'added' ? preview(c.to, 200) : c.kind === 'removed' ? preview(c.from, 200) : `${preview(c.from, 200)} → ${preview(c.to, 200)}`}`).join('\n')
        set(result,
          h('div', { class: 'block-head plain' }, h('span', {}, counts.join(' · ')), copyButton(() => report, 'Copy the changes')),
          h('div', { class: 'changes' }, changes.map((c) => h('div', { class: `change ${c.kind}` },
            h('span', { class: 'change-sign', 'aria-label': LABELS[c.kind] }, SIGNS[c.kind]),
            h('span', { class: 'change-body' },
              h('code', { class: 'change-path' }, c.path),
              c.kind === 'added' ? h('code', { class: 'change-new' }, preview(c.to)) : null,
              c.kind === 'removed' ? h('code', { class: 'change-old' }, preview(c.from)) : null,
              c.kind === 'changed' || c.kind === 'type' ? h('span', {}, h('code', { class: 'change-old' }, preview(c.from)), ' → ', h('code', { class: 'change-new' }, preview(c.to))) : null)))))
      } catch (error) {
        report = ''
        set(result, errorText(error.message))
      }
    }
    for (const control of [left, right, ignore]) control.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Left (before)', left), field('Right (after)', right), field('Ignore keys', ignore), unordered.node, result),
      focus: left,
      fill(value) {
        left.value = value
        update()
      }
    }
  }
}
