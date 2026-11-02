import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { decodePem } from '../../src/tools/cert.js'
import { sha256 } from '../../src/tools/hash.js'

const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')

test('certificates and CSRs decode as openssl reads them', () => {
  // Fields checked against: openssl x509 -in test/fixtures/server.pem -noout -text -fingerprint -sha256
  const [cert] = decodePem(fixture('server.pem'), Date.UTC(2026, 11, 1))
  assert.equal(cert.subject.text, 'C=VN, O=Orca Test, CN=api.example.com')
  assert.deepEqual(cert.san, ['DNS:api.example.com', 'DNS:*.example.com', 'IP:10.0.0.1', 'IP:2001:db8::1'])
  assert.equal(cert.serial, '4B:9F:36:20:3C:6D:BE:D1:D4:74:12:89:88:8A:7E:20:8A:68:4B:BE')
  assert.equal(cert.sha256, '1F:5E:9B:63:0A:32:89:C1:4F:B7:50:1E:FB:FC:26:45:EC:ED:ED:D9:25:05:F4:9B:C7:4E:83:13:B7:53:2B:A7')
  assert.equal(cert.notAfter.toISOString(), '2027-01-29T12:46:36.000Z')
  assert.equal(cert.key.label, 'RSA 2048-bit')
  assert.equal(cert.signature, 'SHA-256 with RSA')
  assert.deepEqual(cert.keyUsage, ['Digital signature', 'Key encipherment'])
  assert.deepEqual(cert.extKeyUsage, ['TLS server', 'TLS client'])
  assert.equal(cert.selfSigned, true)
  assert.equal(cert.status, 'valid')
  assert.equal(decodePem(fixture('server.pem'), Date.UTC(2027, 0, 20))[0].status, 'expires soon')
  assert.equal(decodePem(fixture('server.pem'), Date.UTC(2027, 5, 1))[0].status, 'expired')
  const [csr] = decodePem(fixture('request.csr'))
  assert.deepEqual([csr.type, csr.subject.text, csr.key.label, csr.san], ['request', 'CN=shop.example.vn, O=Shop', 'EC P-256', ['DNS:shop.example.vn']])
  assert.equal(decodePem(fixture('server.pem') + '\n' + fixture('server.pem')).length, 2)
  assert.throws(() => decodePem('-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----'), /private key/)
  assert.throws(() => decodePem('hello'), /PEM block/)
  const bare = fixture('server.pem').replace(/-----[A-Z ]+-----/g, '')
  assert.equal(decodePem(bare)[0].subject.cn, 'api.example.com')
})
