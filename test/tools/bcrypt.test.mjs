import assert from 'node:assert/strict'
import { test } from 'node:test'

import { basicAuth, describeHash, hashPassword, htpasswdLine, verifyPassword } from '../../src/tools/bcrypt.js'

test('bcrypt matches known hashes; htpasswd and Basic auth', async () => {
  // OpenBSD test vector, and a hash written by Apache's htpasswd -nbB.
  assert.equal(await verifyPassword('U*U', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW'), true)
  assert.equal(await verifyPassword('hunter2', '$2y$05$HVeMaN2aHCobAD5OD4jw7ujuWVcWHhPoPOJ0pL16mIzXnci.xBBJW'), true)
  assert.equal(await verifyPassword('hunter3', '$2y$05$HVeMaN2aHCobAD5OD4jw7ujuWVcWHhPoPOJ0pL16mIzXnci.xBBJW'), false)
  const hash = await hashPassword('s3cret', 4)
  assert.equal(await verifyPassword('s3cret', hash), true)
  assert.deepEqual(describeHash(hash).cost, 4)
  assert.match(htpasswdLine('admin', hash), /^admin:\$2y\$04\$/)
  assert.equal(basicAuth('Aladdin', 'open sesame'), 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==')
  await assert.rejects(verifyPassword('x', 'not-a-hash'), /Not a bcrypt hash/)
})
