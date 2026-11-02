import { base64Decode, base64Encode, utf8 } from '../tools/codec.js'
import { checkbox, errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'base64',
  title: 'Base64',
  group: 'Encode',
  icon: 'swap',
  color: '#14b8a6',
  description: 'Encode text to Base64 or decode it back, URL-safe too',
  keywords: ['b64', 'decode', 'encode', 'base64url', 'atob', 'btoa'],
  create() {
    const source = textarea({ rows: 5, placeholder: 'Text to encode' })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const urlSafe = checkbox('URL-safe, no padding', () => update())
    const mode = segmented([['encode', 'Encode'], ['decode', 'Decode']], 'encode', (value) => {
      source.placeholder = value === 'encode' ? 'Text to encode' : 'Base64 to decode'
      urlSafe.node.hidden = value === 'decode'
      update()
    }, 'Direction')
    function update() {
      const text = source.value
      if (!text) return set(result)
      try {
        if (mode.get() === 'encode') {
          out.set(base64Encode(text, urlSafe.get()))
          set(result, out.node, hint(`${utf8(text).length} bytes → ${out.body.textContent.length} characters`))
        } else {
          const decoded = base64Decode(text)
          out.set(decoded.text ?? decoded.hex)
          set(result, out.node, hint(decoded.text === undefined ? `${decoded.size} bytes of binary data, shown as hex` : `${decoded.size} bytes of UTF-8 text`))
        }
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    return {
      node: h('div', {}, h('div', { class: 'bar' }, mode.node, urlSafe.node), field('Input', source), result),
      focus: source,
      fill(value) {
        source.value = value
        mode.set('decode')
      }
    }
  }
}
