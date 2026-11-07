import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isSecretName, redact } from '../../src/tools/redact.js'

// Fake credentials in each provider's documented shape.
const GITHUB = `ghp_${'a'.repeat(36)}`
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

test('well-known token formats', () => {
  const { text, found } = redact(`export GITHUB_TOKEN=${GITHUB}\njwt ${JWT}\nAKIAIOSFODNN7EXAMPLE then AKIAIOSFODNN7EXAMPLE\nsk-ant-api03-${'b'.repeat(40)}\n-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----`)
  assert.equal(text, 'export GITHUB_TOKEN=[GITHUB-TOKEN_1]\njwt [JWT_1]\n[AWS-ACCESS-KEY_1] then [AWS-ACCESS-KEY_1]\n[ANTHROPIC-KEY_1]\n[PRIVATE-KEY_1]')
  assert.deepEqual(found.map((f) => f.kind).sort(), ['anthropic-key', 'aws-access-key', 'github-token', 'jwt', 'private-key'])
})

test('credentials in URLs, headers, flags and named fields', () => {
  const log = [
    'connect postgres://app:S3cr3tPass@db.internal:5432/prod failed',
    `curl -H "Authorization: Bearer abcdef1234567890abcdef" -H 'X-Api-Key: zzzz9999yyyy' https://api.example.com/v1?token=qwerty12345&page=2`,
    'DATABASE_PASSWORD=hunter22hunter',
    '{"client_secret": "very secret value", "retries": 3}',
    'Cookie: session=abc123def456',
    'mysql --password=rootpw123 -h db'
  ].join('\n')
  assert.equal(redact(log).text, [
    'connect postgres://app:[PASSWORD_1]@db.internal:5432/prod failed',
    `curl -H "Authorization: Bearer [AUTH_1]" -H 'X-Api-Key: [SECRET_2]' https://api.example.com/v1?token=[SECRET_3]&page=2`,
    'DATABASE_PASSWORD=[SECRET_4]',
    '{"client_secret": "[SECRET_5]", "retries": 3}',
    'Cookie: session=[COOKIE_1]',
    'mysql --password=[SECRET_1] -h db'
  ].join('\n'))
})

test('placeholders, code and look-alike names stay', () => {
  const safe = 'password: null\ntoken: ${GITHUB_TOKEN}\nconst passwordField = document.querySelector("#password")\nauthor: Ann\nTOKEN_URL=https://example.com/oauth\napi_key: <your key>\nsecret = process.env.SECRET'
  assert.equal(redact(safe).text, safe)
  assert.deepEqual(['apiKey', 'DB_PASSWORD', 'x-api-key', 'clientSecret', 'session_id', 'author', 'passwordField', 'token_ttl', 'tokenizer'].map(isSecretName),
    [true, true, true, true, true, false, false, false, false])
})

test('emails, IPs and the last characters', () => {
  const { text } = redact('ann@example.com from 10.0.0.12 and 127.0.0.1, password=abcdefghijkl', { emails: true, ips: true, keep: 4 })
  assert.equal(text, '[EMAIL_1….com] from [IP_1] and 127.0.0.1, password=[SECRET_1…ijkl]')
  assert.equal(redact('ann@example.com').text, 'ann@example.com')
})
