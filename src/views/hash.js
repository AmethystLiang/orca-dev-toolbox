import { bytesToBase64, utf8 } from '../tools/codec.js'
import { DIGESTS, hex, hmac } from '../tools/hash.js'
import { field, h, hint, input, rows, segmented, set, textarea } from '../ui.js'

export default {
  id: 'hash',
  title: 'Hash & HMAC',
  group: 'Generate',
  icon: 'hash',
  color: '#84cc16',
  description: 'MD5, SHA-1, SHA-256, SHA-512, and HMAC with a key',
  keywords: ['md5', 'sha', 'sha1', 'sha256', 'sha512', 'digest', 'checksum', 'hmac', 'signature', 'webhook'],
  create() {
    const source = textarea({ rows: 4, placeholder: 'Text to hash (UTF-8)' })
    const key = input({ placeholder: 'Optional: secret key for HMAC' })
    const result = h('div', { class: 'result' })
    const encoding = segmented([['hex', 'Hex'], ['base64', 'Base64']], 'hex', () => update(), 'Output encoding')
    function update() {
      const message = utf8(source.value)
      const secret = key.value ? utf8(key.value) : null
      const encode = encoding.get() === 'hex' ? hex : (bytes) => bytesToBase64(bytes)
      set(result,
        rows(Object.keys(DIGESTS).map((name) => [
          secret ? `HMAC-${name}` : name,
          encode(secret ? hmac(name, secret, message) : DIGESTS[name].digest(message))
        ])),
        hint(secret
          ? 'HMAC of the text with the key, as GitHub, Stripe and Slack sign webhook payloads.'
          : 'MD5 and SHA-1 suit checksums, not security.'))
    }
    source.addEventListener('input', update)
    key.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Text', source), field('HMAC key', key), encoding.node, result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
