import { parseUrl, urlDecode, urlEncode } from '../tools/codec.js'
import { checkbox, errorText, field, h, output, rows, segmented, set, textarea } from '../ui.js'

const PLACEHOLDERS = {
  parse: 'https://example.com/path?query=1#top',
  encode: 'Text to encode',
  decode: 'Encoded text, e.g. a%20b%26c'
}

export default {
  id: 'url',
  title: 'URL',
  group: 'Encode',
  icon: 'link',
  color: '#0ea5e9',
  description: 'Split a URL into parts and query, or percent-encode text',
  keywords: ['uri', 'query', 'percent', 'encodeURIComponent', 'params', 'link'],
  create() {
    const source = textarea({ rows: 4, placeholder: PLACEHOLDERS.parse })
    const result = h('div', { class: 'result' })
    const out = output('Result')
    const whole = checkbox('Whole URL (keep : / ? & =)', () => update())
    whole.node.hidden = true
    const mode = segmented([['parse', 'Parse'], ['encode', 'Encode'], ['decode', 'Decode']], 'parse', (value) => {
      source.placeholder = PLACEHOLDERS[value]
      whole.node.hidden = value !== 'encode'
      update()
    }, 'Mode')
    function update() {
      const text = source.value
      if (!text) return set(result)
      try {
        if (mode.get() === 'encode') {
          out.set(urlEncode(text, whole.get()))
          set(result, out.node)
        } else if (mode.get() === 'decode') {
          out.set(urlDecode(text))
          set(result, out.node)
        } else {
          const parts = parseUrl(text)
          if (!parts) return set(result, errorText('Not an absolute URL. Include the scheme, such as https://.'))
          const entries = [['Scheme', parts.protocol], ['User', parts.username], ['Host', parts.host], ['Port', parts.port], ['Path', parts.path], ['Fragment', parts.fragment]]
          set(result,
            rows(entries.filter(([, value]) => value)),
            parts.query.length ? h('div', { class: 'subhead' }, `Query parameters (${parts.query.length})`) : null,
            parts.query.length ? rows(parts.query) : null)
        }
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    return {
      node: h('div', {}, h('div', { class: 'bar' }, mode.node, whole.node), field('Input', source), result),
      focus: source,
      fill(value) {
        source.value = value
        mode.set(/%[0-9a-f]{2}/i.test(value) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? 'decode' : 'parse')
      }
    }
  }
}
