import assert from 'node:assert/strict'
import { test } from 'node:test'

import { describeMode, parseMode, toOctal, toSymbolic } from '../../src/tools/chmod.js'
import { group } from '../../src/tools/number.js'

test('chmod modes read both ways', () => {
  assert.equal(parseMode('755'), 0o755)
  assert.equal(parseMode('chmod 0644'), 0o644)
  assert.equal(parseMode('rwxr-xr-x'), 0o755)
  assert.equal(parseMode('-rwsr-xr-x'), 0o4755)
  assert.equal(parseMode('drwxrwxrwt'), 0o1777)
  assert.equal(toSymbolic(0o4755), 'rwsr-xr-x')
  assert.equal(toSymbolic(0o1666), 'rw-rw-rwT')
  assert.equal(toOctal(0o644), '644')
  assert.equal(toOctal(0o2755), '2755')
  assert.equal(describeMode(0o644), 'Owner can read and write; group and others can read.')
  assert.equal(describeMode(0o700), 'Owner can read, write and execute; group and others have no access.')
  assert.throws(() => parseMode('999'), /Not a mode/)
})
