import { bitLength, codePointChar, formatInteger, group, parseInteger, twosComplement } from '../tools/number.js'
import { errorText, field, h, hint, input, rows, segmented, set } from '../ui.js'

const NAMES = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' }

export default {
  id: 'number',
  title: 'Number Base',
  group: 'Convert',
  icon: 'binary',
  color: '#6366f1',
  description: 'Decimal, hex, binary and octal, of any size',
  keywords: ['hex', 'hexadecimal', 'binary', 'octal', 'decimal', 'radix', 'base', 'bits', 'twos complement', 'bigint'],
  create() {
    const source = input({ placeholder: '255, 0xff, 0b1111_1111 or 0o377', class: 'mono' })
    const result = h('div', { class: 'result' })
    const base = segmented([['auto', 'Auto'], ['10', 'Dec'], ['16', 'Hex'], ['2', 'Bin'], ['8', 'Oct']], 'auto', () => update(), 'Input base')
    function update() {
      try {
        const parsed = parseInteger(source.value, base.get() === 'auto' ? 'auto' : Number(base.get()))
        if (!parsed) return set(result, hint('Any size: the conversion uses exact integers. Spaces, _ and , between digits are ignored.'))
        const { value, radix } = parsed
        const other = twosComplement(value)
        const char = codePointChar(value)
        const bits = bitLength(value)
        set(result,
          rows([
            ['Decimal', value.toString()],
            ['Hex', formatInteger(value, 16)],
            ['Binary', formatInteger(value, 2)],
            ['Octal', formatInteger(value, 8)],
            other ? [other.label, other.value.toString()] : null,
            char ? ['Character', char, { text: `U+${value.toString(16).toUpperCase().padStart(4, '0')}` }] : null
          ].filter(Boolean)),
          h('pre', { class: 'out bits', 'aria-label': 'Bits' }, group((value < 0n ? -value : value).toString(2), 4)),
          hint(`Read as ${NAMES[radix]}. ${bits} bit${bits === 1 ? '' : 's'}, ${Math.max(1, Math.ceil(bits / 8))} byte${bits > 8 ? 's' : ''}; ${group(value.toString().replace('-', ''), 3, ',')} in full.`))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Number', source), base.node, result),
      focus: source,
      fill(value) {
        source.value = value
        base.set('auto')
      }
    }
  }
}
