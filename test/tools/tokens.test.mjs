import assert from 'node:assert/strict'
import { test } from 'node:test'

import { countTokens, tokenCost, tokenRange } from '../../src/tools/tokens.js'

test('token estimates follow how tokenizers split text', () => {
  // cl100k and o200k both give 10 for this sentence.
  assert.equal(countTokens('The quick brown fox jumps over the lazy dog.').tokens, 10)
  assert.equal(countTokens('internationalization').tokens, 3)
  assert.equal(countTokens('你好世界').tokens, 4)
  // Accented words cost more than the same letters without marks, in either normal form.
  const vi = countTokens('Xin chào các bạn').tokens
  assert.ok(vi > countTokens('Xin chao cac ban').tokens)
  assert.equal(countTokens('Xin chào các bạn').tokens, vi)
  assert.deepEqual(countTokens(''), { tokens: 0, characters: 0, bytes: 0, words: 0, lines: 0 })
  assert.deepEqual([countTokens('a\nb').lines, countTokens('👋🏽').characters], [2, 2])
})

test('token range and cost', () => {
  assert.deepEqual(tokenRange(1000), { low: 850, high: 1150 })
  assert.equal(tokenCost(2_000_000, '3'), 6)
  assert.equal(tokenCost(1_000_000, '0,5'), 0.5)
  assert.equal(tokenCost(10, 'abc'), null)
})
