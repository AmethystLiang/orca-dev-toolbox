import { decodePem } from '../tools/cert.js'
import { localString } from '../tools/time.js'
import { errorText, field, h, hint, rows, set, textarea } from '../ui.js'

const STATUS = { valid: 'ok', 'expires soon': '', expired: 'bad', 'not yet valid': 'bad' }

function certRows(c) {
  if (c.type === 'request') {
    return rows([
      ['Type', 'Certificate signing request'],
      ['Subject', c.subject.text],
      c.san.length ? ['Names (SAN)', c.san.join('\n')] : null,
      ['Key', c.key.label],
      ['Signature', c.signature]
    ].filter(Boolean))
  }
  const days = c.daysLeft >= 0 ? `${c.daysLeft} day${c.daysLeft === 1 ? '' : 's'} left` : `${-c.daysLeft} days ago`
  return rows([
    ['Common name', c.subject.cn ?? '—', c.selfSigned ? { text: 'self-signed' } : c.ca ? { text: 'CA' } : null],
    c.san.length ? ['Names (SAN)', c.san.join('\n')] : null,
    ['Expires', localString(c.notAfter), { text: `${c.status} · ${days}`, kind: STATUS[c.status] }],
    ['Valid from', localString(c.notBefore)],
    ['Issuer', c.issuer.text],
    ['Subject', c.subject.text],
    ['Key', c.key.label],
    ['Signature', c.signature],
    c.keyUsage.length ? ['Key usage', c.keyUsage.join(', ')] : null,
    c.extKeyUsage.length ? ['Extended usage', c.extKeyUsage.join(', ')] : null,
    ['Serial', c.serial],
    ['SHA-256', c.sha256],
    ['SHA-1', c.sha1]
  ].filter(Boolean))
}

export default {
  id: 'cert',
  title: 'Certificate Decoder',
  group: 'Inspect',
  icon: 'badge',
  color: '#22c55e',
  description: 'Expiry, names, issuer and fingerprints of a PEM certificate or CSR',
  keywords: ['ssl', 'tls', 'x509', 'x.509', 'pem', 'certificate', 'cert', 'csr', 'expiry', 'expire', 'san', 'fingerprint', 'https', 'letsencrypt', 'chain'],
  create() {
    const source = textarea({ rows: 6, placeholder: '-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----' })
    const result = h('div', { class: 'result' })
    function update() {
      try {
        const certs = decodePem(source.value)
        if (!certs) return set(result, hint('Paste one certificate, a whole chain (fullchain.pem) or a CSR. Get a server’s with: openssl s_client -connect host:443 -showcerts'))
        set(result, certs.map((c, i) => h('div', { class: 'stack' },
          certs.length > 1 ? h('div', { class: 'subhead' }, i === 0 ? 'Certificate 1 · leaf' : `Certificate ${i + 1}${c.ca ? ' · CA' : ''}`) : null,
          certRows(c))))
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('PEM', source), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
