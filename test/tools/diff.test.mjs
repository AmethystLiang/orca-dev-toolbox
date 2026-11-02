import assert from 'node:assert/strict'
import { test } from 'node:test'

import { diffLines, summarize, unifiedDiff } from '../../src/tools/diff.js'
import { words } from '../../src/tools/text.js'

test('line diff finds the shortest edit and writes a unified patch', () => {
  const before = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n'
  const after = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nNINE!\nten\neleven\n'
  const lines = diffLines(before, after)
  assert.deepEqual(summarize(lines), { added: 2, removed: 1 })
  assert.equal(unifiedDiff(lines), [
    '--- a', '+++ b', '@@ -6,5 +6,6 @@', ' six', ' seven', ' eight', '-nine', '+NINE!', ' ten', '+eleven', ''
  ].join('\n'))
  const words = diffLines('const answer = 41;', 'const answer = 42;')
  assert.deepEqual(words[1].parts, [{ text: 'const answer = ', changed: false }, { text: '42', changed: true }, { text: ';', changed: false }])
  assert.deepEqual(summarize(diffLines('a  b\n', 'a b\n', { ignoreWhitespace: true })), { added: 0, removed: 0 })
  assert.equal(unifiedDiff(diffLines('same', 'same')), '')
  // Every line of both sides appears once, in order.
  const big = diffLines('a\nb\nc\nd\ne\nf', 'x\nb\ny\nd\nz')
  assert.deepEqual(big.filter((l) => l.type !== 'insert').map((l) => l.text), ['a', 'b', 'c', 'd', 'e', 'f'])
  assert.deepEqual(big.filter((l) => l.type !== 'delete').map((l) => l.text), ['x', 'b', 'y', 'd', 'z'])
})
