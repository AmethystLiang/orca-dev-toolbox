import assert from 'node:assert/strict'
import { test } from 'node:test'

import { searchStatus } from '../../src/tools/http.js'

test('HTTP status search', () => {
  assert.deepEqual(searchStatus('404').map(([c]) => c), [404])
  assert.deepEqual(searchStatus('30x').map(([c]) => c), [300, 301, 302, 303, 304, 307, 308])
  assert.ok(searchStatus('rate').some(([c]) => c === 429))
  assert.equal(searchStatus('teapot')[0][0], 418)
})
