import { clean, inspect } from '../tools/chars.js'
import { copyButton, field, h, hint, rows, set, textarea } from '../ui.js'

const SHOWN = 400
const VISIBLE = { 0x20: '␠', 0x09: '⇥', 0x0a: '↵', 0x0d: '␍' }

export default {
  id: 'chars',
  title: 'Character Inspector',
  group: 'Inspect',
  icon: 'search',
  color: '#8b5cf6',
  description: 'Find hidden characters, look-alike letters and NFC/NFD accents',
  keywords: ['unicode', 'invisible', 'zero width', 'zwsp', 'bom', 'nbsp', 'homoglyph', 'confusable', 'code point', 'normalize', 'nfc', 'nfd', 'utf-8', 'bytes', 'hidden'],
  create() {
    const source = textarea({ rows: 4, placeholder: 'Paste text that “looks the same but isn’t”' })
    const result = h('div', { class: 'result' })
    function update() {
      const text = source.value
      if (!text) return set(result, hint('Shows each character with its code point and UTF-8 bytes, and flags zero-width characters, odd spaces, a BOM, letters from another script that look Latin, and accents stored in decomposed (NFD) form.'))
      const report = inspect(text)
      const summary = [
        ['Hidden characters', String(report.hidden), report.hidden ? { text: 'check', kind: 'bad' } : { text: 'none', kind: 'ok' }],
        ['Look-alike letters', String(report.lookalikes), report.lookalikes ? { text: 'check', kind: 'bad' } : { text: 'none', kind: 'ok' }],
        ['Accents stored as', report.normalization === 'plain' ? 'no accents' : report.normalization,
          report.normalization === 'NFD' || report.normalization === 'mixed' ? { text: 'decomposed', kind: 'bad' } : null],
        ['Non-ASCII', String(report.nonAscii)],
        ['Scripts', report.scripts.map(([name, n]) => `${name} ${n}`).join(', ') || '—']
      ]
      const cleaned = clean(text)
      const list = h('div', { class: 'chars' }, report.chars.slice(0, SHOWN).map((c) =>
        h('div', { class: `char ${c.flag ?? ''}` },
          h('span', { class: 'glyph' }, VISIBLE[c.cp] ?? (c.flag === 'hidden' || c.category === 'control' || c.category === 'format' ? '·' : c.char)),
          h('span', { class: 'code' }, c.code),
          h('span', { class: 'what' }, c.name ?? [c.script, c.category].filter(Boolean).join(' '), c.flag && c.flag !== 'non-ascii' ? h('span', { class: `badge ${c.flag === 'hidden' || c.flag === 'look-alike' ? 'bad' : ''}` }, c.flag) : null),
          h('span', { class: 'bytes' }, c.utf8))))
      set(result,
        rows(summary),
        cleaned !== text
          ? h('div', { class: 'bar' }, copyButton(() => cleaned, 'Copy cleaned text', 'Copy cleaned text'), h('span', { class: 'hint' }, 'Hidden characters removed, spaces made plain, accents composed (NFC).'))
          : null,
        list,
        report.chars.length > SHOWN ? hint(`Showing the first ${SHOWN} of ${report.chars.length} characters.`) : null)
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
