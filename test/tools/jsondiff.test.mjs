import assert from 'node:assert/strict'
import { test } from 'node:test'

import { diffJson, pathOf, preview } from '../../src/tools/jsondiff.js'

const LEFT = JSON.stringify({ id: 1, name: 'Ann', tags: ['a', 'b'], meta: { ts: '2026-01-01', v: 1 }, items: [{ x: 1 }, { x: 2 }], 'odd key': true })
const RIGHT = JSON.stringify({ name: 'Ann B', id: 1, tags: ['b', 'a', 'c'], meta: { ts: '2026-02-02', v: 1 }, items: [{ x: 1 }], extra: null, 'odd key': 'true' })

test('changes by path, whatever the key order', () => {
  assert.deepEqual(diffJson(LEFT, RIGHT).map((c) => [c.kind, c.path]), [
    ['changed', '$.name'],
    ['changed', '$.tags[0]'],
    ['changed', '$.tags[1]'],
    ['added', '$.tags[2]'],
    ['changed', '$.meta.ts'],
    ['removed', '$.items[1]'],
    ['type', '$["odd key"]'],
    ['added', '$.extra']
  ])
  assert.deepEqual(diffJson('{"a": 1, "b": [1, {"c": 2}]}', '{"b": [1, {"c": 2}], "a": 1}'), [])
})

test('arrays in any order, ignored keys and number tolerance', () => {
  assert.deepEqual(diffJson(LEFT, RIGHT, { unordered: true, ignore: ['ts'] }).map((c) => [c.kind, c.path]), [
    ['changed', '$.name'],
    ['added', '$.tags[*]'],
    ['removed', '$.items[*]'],
    ['type', '$["odd key"]'],
    ['added', '$.extra']
  ])
  // Duplicates count: one of two equal elements removed.
  assert.deepEqual(diffJson('[1, 1, 2]', '[2, 1]', { unordered: true }), [{ kind: 'removed', path: '$[*]', from: 1 }])
  assert.deepEqual(diffJson('{"v": 1.0001}', '{"v": 1}', { numbers: 0.001 }), [])
})

test('paths, previews and errors', () => {
  assert.equal(pathOf(['a', 0, 'b-c', '$x']), '$.a[0]["b-c"].$x')
  assert.equal(preview('x'.repeat(100), 10), '"xxxxxxxx…')
  assert.throws(() => diffJson('{', '{}'), /^Error: Left is not valid JSON/)
  assert.throws(() => diffJson('{}', 'nope'), /^Error: Right is not valid JSON/)
})
