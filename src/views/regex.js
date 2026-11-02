import { MAX_MATCHES, replaceRegex, runRegex } from '../tools/regex.js'
import { errorText, field, h, hint, input, output, set, textarea } from '../ui.js'

const SHOWN = 50

function groupName(match, index) {
  const named = match.named && Object.entries(match.named).find(([, value]) => value === match.groups[index])
  return named ? named[0] : `$${index + 1}`
}

export default {
  id: 'regex',
  title: 'Regex Tester',
  group: 'Text',
  icon: 'regex',
  color: '#d946ef',
  description: 'Test a JavaScript regular expression, see groups and replace',
  keywords: ['regexp', 'pattern', 'match', 'replace', 'groups', 'test'],
  create() {
    const pattern = input({ placeholder: 'e.g. (\\w+)@(\\w+)\\.com', class: 'mono' })
    const flags = input({ value: 'g', class: 'mono flags', 'aria-label': 'Flags', maxlength: 8 })
    const text = textarea({ rows: 5, placeholder: 'Text to test against' })
    const replacement = input({ placeholder: 'Optional, e.g. $2/$1', class: 'mono' })
    const result = h('div', { class: 'result' })
    function update() {
      if (!pattern.value) return set(result, hint('Flags: g all matches, i ignore case, m multiline, s dot matches newlines, u Unicode.'))
      try {
        const { matches, truncated } = runRegex(pattern.value, flags.value, text.value)
        const preview = h('pre', { class: 'out highlight' })
        let last = 0
        for (const match of matches) {
          if (match.text === '') continue
          preview.append(text.value.slice(last, match.index), h('mark', {}, match.text))
          last = match.index + match.text.length
        }
        preview.append(text.value.slice(last))
        let replaced = null
        if (replacement.value) {
          replaced = output('Replaced')
          replaced.set(replaceRegex(pattern.value, flags.value, text.value, replacement.value))
        }
        const count = `${matches.length}${truncated ? '+' : ''} match${matches.length === 1 ? '' : 'es'}`
        set(result,
          h('div', { class: 'subhead' }, truncated ? `${count} (first ${MAX_MATCHES})` : count),
          text.value ? preview : null,
          replaced?.node,
          matches.slice(0, SHOWN).map((match, i) =>
            h('div', { class: 'match' },
              h('div', { class: 'match-head' }, `#${i + 1} at index ${match.index}`),
              h('code', {}, match.text === '' ? '(empty)' : match.text),
              match.groups.map((group, g) => h('div', { class: 'capture' }, h('span', {}, groupName(match, g)), h('code', {}, group ?? '(none)'))))),
          matches.length > SHOWN ? hint(`Showing the first ${SHOWN} matches.`) : null)
      } catch (error) {
        set(result, errorText(error.message.replace(/^Invalid regular expression: /, '')))
      }
    }
    for (const control of [pattern, flags, text, replacement]) control.addEventListener('input', update)
    update()
    return {
      node: h('div', {},
        h('div', { class: 'inline' }, field('Pattern', pattern), field('Flags', flags)),
        field('Test text', text),
        field('Replace with', replacement),
        result),
      focus: pattern,
      fill(value) {
        text.value = value
        update()
      }
    }
  }
}
