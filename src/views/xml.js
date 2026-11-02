import { describeXml, formatXml, minifyXml } from '../tools/xml.js'
import { checkbox, errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'xml',
  title: 'XML Formatter',
  group: 'Format',
  icon: 'brackets',
  color: '#f97316',
  description: 'Pretty-print, minify and check XML, SVG and plists',
  keywords: ['xml', 'svg', 'plist', 'pom', 'maven', 'android', 'rss', 'soap', 'format', 'prettify', 'beautify', 'minify', 'validate'],
  create() {
    const source = textarea({ rows: 8, placeholder: '<config><item id="1">value</item></config>' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const comments = checkbox('Keep comments', () => update(), true)
    const style = segmented([['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'Tab'], ['min', 'Minify']], '2', (value) => {
      comments.node.hidden = value !== 'min'
      update()
    }, 'Indent')
    comments.node.hidden = true
    function update() {
      if (!source.value.trim()) return set(result, hint('Checks that tags nest and close; it does not validate against a schema.'))
      try {
        const value = style.get()
        out.set(value === 'min' ? minifyXml(source.value, { comments: comments.get() }) : formatXml(source.value, { indent: value === 'tab' ? '\t' : Number(value) }))
        const { root, elements } = describeXml(source.value)
        set(result, hint(`Well-formed · root <${root ?? '—'}> · ${elements} element${elements === 1 ? '' : 's'}`), out.node)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('XML', source), h('div', { class: 'bar' }, style.node, comments.node), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
