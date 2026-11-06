import assert from 'node:assert/strict'
import { test } from 'node:test'

import { portRange, PORTS, searchPorts } from '../../src/tools/ports.js'

test('port search', () => {
  assert.deepEqual(searchPorts('5432').map(([p]) => p), [5432])
  assert.deepEqual(searchPorts('postgres').map(([p]) => p), [5432])
  assert.deepEqual(searchPorts('3000-3001').map(([p]) => p), [3000, 3001])
  assert.ok(searchPorts('redis').some(([p]) => p === 6379))
  assert.ok(searchPorts('90').every(([p]) => String(p).startsWith('90')))
  assert.deepEqual(PORTS.map(([p]) => p), [...PORTS.map(([p]) => p)].sort((a, b) => a - b))
})

test('port ranges', () => {
  assert.match(portRange(80), /System/)
  assert.match(portRange(8080), /Registered/)
  assert.match(portRange(60000), /Dynamic/)
  assert.match(portRange(70000), /Not a port/)
})
