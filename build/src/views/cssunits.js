import { lengthRows, parseLength, pxToRemInCss, toPx } from '../tools/cssunits.js'
import { errorText, field, h, hint, input, output, rows, set, textarea } from '../ui.js'

export default {
  id: 'cssunits',
  title: 'px ↔ rem',
  group: 'Convert',
  icon: 'ruler',
  color: '#0ea5e9',
  description: 'CSS lengths in px, rem, em, pt, vw and Tailwind steps; px to rem in a stylesheet',
  keywords: ['px', 'rem', 'em', 'pt', 'vw', 'vh', 'css', 'units', 'font size', 'tailwind', 'spacing', 'convert'],
  create() {
    const value = input({ placeholder: '24px, 1.5rem, 12pt, 50vw', class: 'mono', value: '24px' })
    const root = input({ type: 'number', value: 16, min: 1, 'aria-label': 'Root font size' })
    const width = input({ type: 'number', value: 1440, min: 1, 'aria-label': 'Viewport width' })
    const css = textarea({ rows: 5, placeholder: '.card { padding: 24px 16px; font-size: 14px; border: 1px solid; }' })
    const result = h('div', { class: 'result' })
    const cssResult = h('div', { class: 'result' })
    const out = output('As rem')
    function update() {
      const base = Number(root.value) || 16
      try {
        const length = parseLength(value.value)
        set(result, length ? rows(lengthRows(toPx(length, { root: base, width: Number(width.value) || 1440 }), { root: base, width: Number(width.value) || 1440 })) : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
      if (!css.value.trim()) return set(cssResult)
      const converted = pxToRemInCss(css.value, base)
      out.set(converted.css)
      set(cssResult, out.node, hint(`${converted.count} length${converted.count === 1 ? '' : 's'} converted; 0 and 1px (hairline borders) are left as they are.`))
    }
    for (const control of [value, root, width, css]) control.addEventListener('input', update)
    update()
    return {
      node: h('div', {},
        field('Length', value),
        h('div', { class: 'inline' }, field('Root font size (px)', root), field('Viewport width (px)', width)),
        result,
        field('Or convert a stylesheet, px → rem', css),
        cssResult),
      focus: value,
      fill(text) {
        value.value = text
        update()
      }
    }
  }
}
