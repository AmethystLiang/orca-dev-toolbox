import { BLACK, contrast, contrastLevel, parseColor, toHex, toHsl, toOklch, toRgb, WHITE } from '../tools/color.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'color',
  title: 'Color',
  group: 'Convert',
  icon: 'droplet',
  color: '#ec4899',
  description: 'HEX, RGB, HSL and OKLCH, with contrast against white and black',
  keywords: ['colour', 'hex', 'rgb', 'rgba', 'hsl', 'oklch', 'css', 'contrast', 'wcag', 'picker'],
  create() {
    const source = input({ placeholder: '#3b82f6, rgb(…), hsl(…) or oklch(…)' })
    const picker = h('input', { type: 'color', class: 'picker', 'aria-label': 'Pick a colour', value: '#3b82f6' })
    const swatch = h('div', { class: 'swatch', 'aria-hidden': 'true' })
    const result = h('div', { class: 'result' })
    function badge(ratio) {
      const level = contrastLevel(ratio)
      return { text: level, kind: level === 'Fails' ? 'bad' : level === 'AA large' ? '' : 'ok' }
    }
    function update() {
      try {
        const color = parseColor(source.value)
        if (!color) {
          swatch.style.boxShadow = ''
          return set(result, hint('Type or pick a colour. Alpha works in every form: #3b82f680, rgb(59 130 246 / 0.5).'))
        }
        // An inset shadow paints over the checkerboard, so alpha shows through it.
        swatch.style.boxShadow = `inset 0 0 0 32px ${toRgb(color)}`
        picker.value = toHex({ ...color, a: 1 })
        const onWhite = contrast(color, WHITE)
        const onBlack = contrast(color, BLACK)
        set(result,
          rows([
            ['HEX', toHex(color)],
            ['RGB', toRgb(color)],
            ['HSL', toHsl(color)],
            ['OKLCH', toOklch(color)]
          ]),
          h('div', { class: 'subhead' }, 'Text contrast (WCAG 2)'),
          rows([
            ['On white', `${onWhite.toFixed(2)}:1`, badge(onWhite)],
            ['On black', `${onBlack.toFixed(2)}:1`, badge(onBlack)]
          ]),
          color.outOfGamut ? hint('This OKLCH colour is outside sRGB; the values above are the nearest sRGB colour.') : null,
          color.a < 1 ? hint('Contrast ignores alpha: it compares the opaque colour.') : null)
      } catch (error) {
        swatch.style.boxShadow = ''
        set(result, errorText(error.message))
      }
    }
    function fill(value) {
      source.value = value
      update()
    }
    source.addEventListener('input', update)
    picker.addEventListener('input', () => fill(picker.value))
    fill('#3b82f6')
    return {
      node: h('div', {}, h('div', { class: 'inline color-input' }, swatch, field('Colour', source), picker), result),
      focus: source,
      fill
    }
  }
}
