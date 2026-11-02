import { basicAuth, describeHash, hashPassword, htpasswdLine, MAX_BYTES, tooLong, verifyPassword } from '../tools/bcrypt.js'
import { errorText, field, h, hint, input, rows, segmented, set } from '../ui.js'

export default {
  id: 'bcrypt',
  title: 'bcrypt & Basic Auth',
  group: 'Generate',
  icon: 'shield',
  color: '#64748b',
  description: 'Hash or check a bcrypt password; htpasswd lines and Basic auth headers',
  keywords: ['bcrypt', 'password', 'hash', 'verify', 'compare', 'htpasswd', 'nginx', 'apache', 'basic auth', 'authorization', 'header', 'seed'],
  create() {
    const user = input({ placeholder: 'Username (for htpasswd and Basic auth)', value: 'admin' })
    const password = input({ type: 'text', placeholder: 'Password' })
    const hash = input({ placeholder: '$2b$10$…', class: 'mono' })
    const cost = input({ type: 'number', min: 4, max: 15, value: 10, 'aria-label': 'Cost' })
    const result = h('div', { class: 'result' })
    let run = 0
    const hashFields = h('div', { class: 'stack' }, h('div', { class: 'inline' }, field('Username', user), field('Cost', cost)))
    const verifyFields = h('div', { class: 'stack', hidden: true }, field('Hash', hash))
    const mode = segmented([['hash', 'Hash'], ['verify', 'Verify']], 'hash', (value) => {
      hashFields.hidden = value !== 'hash'
      verifyFields.hidden = value !== 'verify'
      update()
    }, 'Mode')
    async function update() {
      const id = ++run
      const pw = password.value
      if (!pw) return set(result, hint('Hashing runs on this device. Cost 10 to 12 suits most servers; each step doubles the time.'))
      const warning = tooLong(pw) ? errorText(`bcrypt ignores everything past ${MAX_BYTES} bytes of the password.`) : null
      try {
        if (mode.get() === 'hash') {
          const rounds = Math.min(15, Math.max(4, Number(cost.value) || 10))
          set(result, hint(`Hashing at cost ${rounds}…`))
          const started = performance.now()
          const value = await hashPassword(pw, rounds)
          if (id !== run) return
          const took = Math.round(performance.now() - started)
          set(result,
            rows([
              ['bcrypt', value],
              ['htpasswd', htpasswdLine(user.value || 'admin', value)],
              ['Basic auth', basicAuth(user.value || 'admin', pw)]
            ]),
            warning,
            hint(`Took ${took} ms. A new salt each time, so the hash changes on every run; any of them verifies.`))
        } else {
          if (!hash.value.trim()) return set(result, hint('Paste a bcrypt hash to check the password against.'))
          const ok = await verifyPassword(pw, hash.value)
          if (id !== run) return
          const info = describeHash(hash.value)
          set(result,
            rows([
              ['Result', ok ? 'matches' : 'does not match', ok ? { text: 'match', kind: 'ok' } : { text: 'no match', kind: 'bad' }],
              ['Cost', String(info.cost)],
              ['Version', `$${info.version}$`]
            ]),
            warning)
        }
      } catch (error) {
        if (id === run) set(result, errorText(error.message))
      }
    }
    for (const control of [user, password, hash, cost]) control.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, mode.node, field('Password', password), hashFields, verifyFields, result),
      focus: password,
      fill(value) {
        hash.value = value.trim()
        mode.set('verify')
      }
    }
  }
}
