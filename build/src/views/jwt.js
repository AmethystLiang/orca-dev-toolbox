import { decodeJwt, signJwt, SIGNING_ALGS, verifyJwt } from '../tools/jwt.js'
import { localString, relative } from '../tools/time.js'
import { copyButton, errorText, field, h, hint, input, output, rows, segmented, set, textarea } from '../ui.js'

const SAMPLE_PAYLOAD = () => JSON.stringify({ sub: 'user_123', name: 'Ada', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }, null, 2)

export default {
  id: 'jwt',
  title: 'JWT Decoder',
  group: 'Inspect',
  icon: 'key',
  color: '#f59e0b',
  description: 'Decode a JSON Web Token, check its HMAC signature, or sign one',
  keywords: ['token', 'bearer', 'auth', 'jws', 'claims', 'exp', 'verify', 'sign', 'hs256', 'secret', 'encode'],
  create() {
    // Decode
    const token = textarea({ rows: 5, placeholder: 'Paste a JWT (eyJ…), with or without “Bearer ”' })
    const secret = input({ placeholder: 'Optional: HS256/384/512 secret' })
    const result = h('div', { class: 'result' })
    const header = output('Header')
    const payload = output('Payload')
    function decode() {
      if (!token.value.trim()) return set(result, hint('Decoded on this device; nothing leaves Orca.'))
      try {
        const jwt = decodeJwt(token.value)
        header.set(JSON.stringify(jwt.header, null, 2))
        payload.set(JSON.stringify(jwt.payload, null, 2))
        const times = jwt.times.map((t) => [
          t.label,
          localString(t.date),
          t.status ? { text: t.status, kind: t.status === 'valid' ? 'ok' : 'bad' } : { text: relative(t.date) }
        ])
        let check
        if (jwt.unsigned) check = hint('Unsigned token (alg “none”): anyone could have written it.')
        else if (!secret.value) check = hint(`Signed with ${jwt.header?.alg ?? 'an unknown algorithm'}. Enter the secret to check the signature.`)
        else {
          const valid = verifyJwt(token.value, secret.value)
          check = valid === null
            ? hint(`${jwt.header.alg} signatures need the issuer’s public key; only HMAC (HS256, HS384, HS512) can be checked here.`)
            : rows([['Signature', jwt.header.alg, valid ? { text: 'verified', kind: 'ok' } : { text: 'invalid', kind: 'bad' }]])
        }
        set(result, times.length ? rows(times) : null, check, header.node, payload.node)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    token.addEventListener('input', decode)
    secret.addEventListener('input', decode)
    const decodePane = h('div', { class: 'stack' }, field('Token', token), field('Secret', secret), result)

    // Sign
    const claims = textarea({ rows: 7, placeholder: '{"sub": "user_123"}' })
    claims.value = SAMPLE_PAYLOAD()
    const signSecret = input({ placeholder: 'Shared secret' })
    const alg = h('select', { 'aria-label': 'Algorithm', onchange: () => sign() }, SIGNING_ALGS.map((name) => h('option', { value: name }, name)))
    const signed = h('div', { class: 'result' })
    const tokenOut = h('pre', { class: 'out' })
    function sign() {
      if (!signSecret.value) return set(signed, hint('Enter a secret to sign. Use test secrets only: anyone with the secret can mint tokens.'))
      let value
      try {
        value = JSON.parse(claims.value)
      } catch (error) {
        return set(signed, errorText(`The payload is not JSON: ${error.message}`))
      }
      tokenOut.textContent = signJwt(value, signSecret.value, alg.value)
      set(signed, h('div', { class: 'block' }, h('div', { class: 'block-head' }, h('span', {}, 'Token'), copyButton(() => tokenOut.textContent)), tokenOut))
    }
    claims.addEventListener('input', sign)
    signSecret.addEventListener('input', sign)
    const signPane = h('div', { class: 'stack', hidden: true },
      field('Payload', claims),
      h('div', { class: 'inline' }, field('Secret', signSecret), field('Algorithm', alg)),
      signed)

    const mode = segmented([['decode', 'Decode'], ['sign', 'Sign']], 'decode', (value) => {
      decodePane.hidden = value !== 'decode'
      signPane.hidden = value !== 'sign'
      ;(value === 'decode' ? token : claims).focus()
    }, 'Mode')
    decode()
    sign()
    return {
      node: h('div', {}, mode.node, decodePane, signPane),
      focus: token,
      fill(value) {
        mode.set('decode')
        token.value = value
        decode()
      }
    }
  }
}
