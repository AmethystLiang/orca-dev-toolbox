import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convertCase, countText, processLines, words } from '../../src/tools/text.js'

test('identifier cases, line tools and counts', () => {
  assert.deepEqual(words('parseHTTPResponse_v2'), ['parse', 'HTTP', 'Response', 'v2'])
  assert.deepEqual(words('Xin chào thế giới'), ['Xin', 'chào', 'thế', 'giới'])
  assert.equal(convertCase('user id\nHTTPServer', 'camelCase'), 'userId\nhttpServer')
  assert.equal(convertCase('user-profile_page', 'PascalCase'), 'UserProfilePage')
  assert.equal(convertCase('userProfile', 'CONSTANT_CASE'), 'USER_PROFILE')
  assert.equal(convertCase('User Profile', 'kebab-case'), 'user-profile')
  assert.equal(convertCase('hello_world', 'Sentence case'), 'Hello world')
  const lines = processLines(' b\nfile10\n\nfile9\nB\nb ', { trim: true, dropEmpty: true, unique: true, ignoreCase: true, sort: 'asc' })
  assert.equal(lines.text, 'b\nfile9\nfile10')
  assert.deepEqual([lines.before, lines.after, lines.duplicates], [6, 3, 2])
  assert.equal(processLines('a\nb\nc', { sort: 'reverse' }).text, 'c\nb\na')
  assert.equal(processLines('a\nb\nc', { sort: 'shuffle', random: () => 0 }).text, 'b\nc\na')
  assert.equal(processLines('').after, 0)
  const counts = countText('Hi 👋🏽 there.\n\nNew para é')
  assert.equal(counts.characters, 23)
  assert.equal(counts.words, 5)
  assert.equal(counts.lines, 3)
  assert.equal(counts.paragraphs, 2)
  assert.equal(counts.bytes, 31)
  assert.equal(counts.codePoints, 24)
})
