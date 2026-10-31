import { decodeJwt } from '../tools/jwt.js'
import { localString, relative } from '../tools/time.js'
import { errorText, field, h, hint, output, rows, set, textarea } from '../ui.js'

export default {
  id: 'jwt',
  title: 'JWT Decoder',
  group: 'Inspect',
  description: 'Header, claims and expiry of a JSON Web Token',
  keywords: ['token', 'bearer', 'auth', 'jws', 'claims', 'exp'],
  create() {
    const token = textarea({ rows: 5, placeholder: 'Paste a JWT (eyJ…), with or without “Bearer ”' })
    const result = h('div', { class: 'result' })
    const header = output('Header')
    const payload = output('Payload')
    function update() {
      if (!token.value.trim()) return set(result, hint('Decoded on this device; nothing leaves Orca. The signature is not verified.'))
      try {
        const jwt = decodeJwt(token.value)
        header.set(JSON.stringify(jwt.header, null, 2))
        payload.set(JSON.stringify(jwt.payload, null, 2))
        const times = jwt.times.map((t) => [
          t.label,
          localString(t.date),
          t.status ? { text: t.status, kind: t.status === 'valid' ? 'ok' : 'bad' } : { text: relative(t.date) }
        ])
        set(result,
          times.length ? rows(times) : null,
          header.node,
          payload.node,
          hint(jwt.unsigned ? 'Unsigned token (alg “none”).' : `Signed with ${jwt.header?.alg ?? 'an unknown algorithm'}; the signature is not verified.`))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    token.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Token', token), result),
      focus: token,
      fill(value) {
        token.value = value
        update()
      }
    }
  }
}
