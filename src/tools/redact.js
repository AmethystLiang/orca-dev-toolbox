// Masks secrets in logs, configs and stack traces before they are shared: in an issue, a chat or
// a prompt to an agent. Patterns cover well-known token formats, credentials in URLs and headers,
// and values under secret-sounding names. The same secret always gets the same label, so the
// redacted text still shows where one value repeats.

// Well-known token shapes, most specific first. Each is [kind, pattern].
const TOKENS = [
  ['private-key', /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g],
  ['jwt', /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,}/g],
  ['anthropic-key', /\bsk-ant-[\w-]{20,}/g],
  ['openai-key', /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g],
  ['gitlab-token', /\bglpat-[\w-]{20,}/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['slack-token', /\bxox[abprs]-[0-9A-Za-z-]{10,}/g],
  ['stripe-key', /\b(?:sk|rk|pk)_(?:live|test)_[0-9A-Za-z]{16,}/g],
  ['npm-token', /\bnpm_[A-Za-z0-9]{36}\b/g],
  ['sendgrid-key', /\bSG\.[\w-]{22}\.[\w-]{43}\b/g],
  ['twilio-key', /\bSK[0-9a-f]{32}\b/g]
]

// key = value, key: value, "key": "value", --key value and key=value in query strings; the name
// is checked word by word in the callback, so passwordField or author are not taken for secrets.
const ASSIGNMENT = /(["']?)([A-Za-z_][\w.-]*)\1(\s*(?:=|:(?!\/\/))\s*)(["']?)([^\s"',;&}]+|(?<=")[^"]*(?=")|(?<=')[^']*(?='))\4/g
const FLAG = /(--[A-Za-z][\w-]*)(=|\s+)([^\s"']+)/g
const SECRET_WORDS = new Set(['password', 'passwd', 'passphrase', 'pwd', 'pass', 'secret', 'secrets', 'token', 'apikey', 'credential', 'credentials', 'auth', 'signature', 'privatekey', 'secretkey', 'accesskey'])
const SECRET_PAIRS = new Set(['api key', 'access key', 'private key', 'secret key', 'session id', 'client secret', 'signing key', 'encryption key', 'master key'])
// Names that sit next to a secret without holding one: passwordField, TOKEN_URL, token_ttl.
const NOT_SECRET = new Set(['field', 'input', 'label', 'length', 'policy', 'prompt', 'placeholder', 'type', 'enabled', 'required', 'count', 'limit', 'max', 'min', 'ttl', 'expiry', 'expires', 'expiration', 'regex', 'pattern', 'name', 'file', 'path', 'url', 'uri', 'endpoint', 'hint', 'reset', 'changed', 'strength', 'rules', 'header', 'prefix'])

/** Whether a variable or field name sounds like it holds a secret. */
export function isSecretName(name) {
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[_.-]+/).filter(Boolean)
  if (!words.length || NOT_SECRET.has(words.at(-1))) return false
  if (words.some((word) => SECRET_WORDS.has(word))) return true
  return words.slice(1).some((word, i) => SECRET_PAIRS.has(`${words[i]} ${word}`))
}

const AUTH_HEADER = /\b((?:proxy-)?authorization\s*[:=]\s*["']?)(Bearer|Basic|Token|Bot|Digest)?\s*([^\s"',]+)/gi
const COOKIE_HEADER = /\b((?:set-)?cookie\s*:\s*)([^\r\n]+)/gi
const URL_CREDENTIALS = /\b([a-z][a-z0-9+.-]*:\/\/)([^\s:/@]+):([^\s/@]+)@/gi
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const IPV4 = /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g

// Values that name a secret without being one, such as `password: null` or `${TOKEN}`.
function placeholder(value) {
  // Code rather than a value: document.querySelector(…), process.env.TOKEN, an already masked one.
  if (/[()]/.test(value) || /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/.test(value) || /^[[<]|^\$\{/.test(value)) return true
  return !value || /^(null|undefined|none|true|false|\*+|x+|<[^>]*>|\$\{?[\w.]+\}?|\{\{[^}]*\}\}|%[\w]+%|redacted.*|\[redacted[^\]]*\])$/i.test(value) || value.length < 3
}

/**
 * Redacted text and what was found. Options: `emails` and `ips` mask those too; `keep` leaves the
 * last n characters of each secret visible so values can still be told apart.
 */
export function redact(text, { emails = false, ips = false, keep = 0 } = {}) {
  const labels = new Map()
  const counts = {}
  const label = (kind, secret) => {
    const known = labels.get(secret)
    if (known) return known
    counts[kind] = (counts[kind] ?? 0) + 1
    const tail = keep && secret.length >= keep * 3 ? `…${secret.slice(-keep)}` : ''
    const value = `[${kind.toUpperCase()}_${counts[kind]}${tail}]`
    labels.set(secret, value)
    return value
  }
  let value = String(text)
  for (const [kind, pattern] of TOKENS) value = value.replace(pattern, (match) => label(kind, match))
  value = value.replace(URL_CREDENTIALS, (match, scheme, user, password) => placeholder(password) ? match : `${scheme}${user}:${label('password', password)}@`)
  value = value.replace(AUTH_HEADER, (match, head, scheme, secret) => secret.startsWith('[') ? match : `${head}${scheme ? `${scheme} ` : ''}${label('auth', secret)}`)
  value = value.replace(COOKIE_HEADER, (match, head, cookies) => `${head}${cookies.replace(/(=)([^;\s]+)/g, (m, eq, v) => (v.startsWith('[') ? m : `${eq}${label('cookie', v)}`))}`)
  value = value.replace(FLAG, (match, flag, sep, secret) => !isSecretName(flag) || placeholder(secret) ? match : `${flag}${sep}${label('secret', secret)}`)
  value = value.replace(ASSIGNMENT, (match, quote, name, sep, valueQuote, secret) =>
    !isSecretName(name) || placeholder(secret) ? match : `${quote}${name}${quote}${sep}${valueQuote}${label('secret', secret)}${valueQuote}`)
  if (emails) value = value.replace(EMAIL, (match) => label('email', match))
  if (ips) value = value.replace(IPV4, (match) => (/^(127\.|0\.0\.0\.0$)/.test(match) ? match : label('ip', match)))
  const found = Object.entries(counts).map(([kind, count]) => ({ kind, count }))
  return { text: value, found, total: labels.size }
}
