import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decodeJwt, signJwt, verifyJwt } from '../../src/tools/jwt.js'

test('JWT decoding reads claims and expiry without a key', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const decoded = decodeJwt(`Bearer ${token}`, Date.UTC(2026, 0, 1))
  assert.deepEqual(decoded.header, { alg: 'HS256', typ: 'JWT' })
  assert.equal(decoded.payload.name, 'John Doe')
  assert.deepEqual(decoded.times.map((t) => [t.claim, t.status]), [['exp', 'expired'], ['iat', null]])
  assert.equal(decoded.times[0].date.toISOString(), '2018-01-18T02:30:22.000Z')
  assert.throws(() => decodeJwt('abc'), /three parts/)
  assert.throws(() => decodeJwt('a.b.c.d.e'), /encrypted/)
  assert.throws(() => decodeJwt('e30.bm90IGpzb24.x'), /payload is not JSON/)
})

test('JWT signing and verification', () => {
  const jwtIo = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  assert.equal(signJwt({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, 'your-256-bit-secret'), jwtIo)
  assert.equal(verifyJwt(jwtIo, 'your-256-bit-secret'), true)
  assert.equal(verifyJwt(`Bearer ${jwtIo}`, 'wrong'), false)
  for (const alg of ['HS384', 'HS512']) assert.equal(verifyJwt(signJwt({ a: 1 }, 's', alg), 's'), true)
})
