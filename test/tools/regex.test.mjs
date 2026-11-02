import assert from 'node:assert/strict'
import { test } from 'node:test'

import { replaceRegex, runRegex } from '../../src/tools/regex.js'

test('regex matches, groups and replacement', () => {
  const { matches } = runRegex('(?<user>\\w+)@(\\w+)\\.com', 'g', 'ann@a.com, bob@b.com')
  assert.deepEqual(matches.map((m) => [m.index, m.text, m.named.user]), [[0, 'ann@a.com', 'ann'], [11, 'bob@b.com', 'bob']])
  assert.equal(runRegex('a', '', 'aaa').matches.length, 1)
  assert.equal(runRegex('', 'g', 'abc').matches.length, 4)
  assert.equal(runRegex('a', 'g', 'a'.repeat(600)).truncated, true)
  assert.throws(() => runRegex('(', 'g', 'x'), SyntaxError)
  assert.equal(replaceRegex('(\\w+)@', 'g', 'ann@a bob@b', '<$1>@'), '<ann>@a <bob>@b')
})
