import assert from 'node:assert/strict'
import { test } from 'node:test'

import { describeJson, formatJson } from '../../src/tools/json.js'

test('JSON formatting, sorting and error positions', () => {
  assert.equal(formatJson('{"b":1,"a":[1,2]}', { indent: 0, sort: true }), '{"a":[1,2],"b":1}')
  assert.equal(formatJson('{"a":1}'), '{\n  "a": 1\n}')
  assert.throws(() => formatJson('{\n  "a": 1,\n}'), /^Error: Line 3, column 1/)
  assert.equal(describeJson('[1,2,3]'), 'Array of 3 items')
  assert.equal(describeJson('{"a":1}'), 'Object with 1 key')
})
