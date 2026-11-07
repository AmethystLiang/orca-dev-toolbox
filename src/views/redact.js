import { redact } from '../tools/redact.js'
import { checkbox, field, h, hint, output, set, textarea } from '../ui.js'

export default {
  id: 'redact',
  title: 'Redact Secrets',
  group: 'Text',
  icon: 'eyeoff',
  color: '#e11d48',
  description: 'Mask tokens, keys and passwords in logs before sharing them',
  keywords: ['redact', 'mask', 'secret', 'secrets', 'token', 'api key', 'password', 'credentials', 'sanitize', 'scrub', 'log', 'share', 'issue', 'obfuscate', 'pii', 'leak'],
  create() {
    const source = textarea({ rows: 8, placeholder: 'DATABASE_URL=postgres://app:hunter2@db:5432/prod\ncurl -H "Authorization: Bearer abc123…" …' })
    const emails = checkbox('Emails', () => update())
    const ips = checkbox('IP addresses', () => update())
    const keep = checkbox('Keep last 4 characters', () => update())
    const out = output('Redacted')
    const result = h('div', { class: 'result' })
    function update() {
      if (!source.value.trim()) return set(result, hint('Masks API keys and tokens (GitHub, OpenAI, Anthropic, AWS, Stripe, Slack…), JWTs, private keys, passwords in URLs, Authorization and Cookie headers, and values of fields named like password, secret or token. The same secret gets the same label each time.'))
      const { text, found, total } = redact(source.value, { emails: emails.get(), ips: ips.get(), keep: keep.get() ? 4 : 0 })
      out.set(text)
      set(result, out.node,
        total
          ? hint(`${total} value${total === 1 ? '' : 's'} masked: ${found.map(({ kind, count }) => `${count} ${kind.replace(/-/g, ' ')}`).join(', ')}. Check the result before sharing: unusual secrets can slip through.`)
          : hint('Nothing that looks like a secret. Check by eye before sharing all the same.'))
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Text', source), h('div', { class: 'bar' }, emails.node, ips.node, keep.node), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
