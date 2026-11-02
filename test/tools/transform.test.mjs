import assert from 'node:assert/strict'
import { test } from 'node:test'

import { removeAccents, slugify, transform } from '../../src/tools/transform.js'

test('text transforms: accents, slugs, lists, SQL IN, Markdown tables', () => {
  assert.equal(removeAccents('Tiếng Việt: Đường phố, café, naïve'), 'Tieng Viet: Duong pho, cafe, naive')
  assert.equal(slugify('  Hướng dẫn: Cài đặt Orca (2026)! '), 'huong-dan-cai-dat-orca-2026')
  assert.equal(transform('a\n b \n\nc', 'sqlIn'), "('a', 'b', 'c')")
  assert.equal(transform("O'Brien\nAnn", 'sqlIn'), "('O''Brien', 'Ann')")
  assert.equal(transform('1\n2\n3', 'sqlIn'), '(1, 2, 3)')
  assert.equal(transform('1\n2', 'jsonArray'), '[1,2]')
  assert.equal(transform('x\ny', 'jsonArray'), '["x","y"]')
  assert.equal(transform('["a", 2]', 'fromJson'), 'a\n2')
  assert.equal(transform('a, b;c', 'fromList'), 'a\nb\nc')
  assert.equal(transform('a\nb', 'toList', { separator: ' | ' }), 'a | b')
  assert.equal(transform('a\nb', 'wrap', { prefix: '"', suffix: '",' }), '"a",\n"b",')
  assert.equal(transform('“Hi” it’s…', 'straight'), '"Hi" it\'s...')
  assert.equal(transform('name\tage\nAda\t36', 'table'), '| name | age |\n| ---- | --- |\n| Ada  | 36  |')
  assert.equal(transform('ab👋🏽', 'reverse'), '👋🏽ba')
})
