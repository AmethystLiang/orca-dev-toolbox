import assert from 'node:assert/strict'
import { test } from 'node:test'

import { lengthRows, parseLength, pxToRemInCss, toPx } from '../../src/tools/cssunits.js'

test('CSS lengths and px → rem', () => {
  assert.deepEqual(parseLength('1.5rem'), { value: 1.5, unit: 'rem' })
  assert.equal(toPx(parseLength('1.5rem')), 24)
  assert.equal(toPx(parseLength('12pt')), 16)
  assert.equal(toPx(parseLength('50vw'), { width: 1200 }), 600)
  assert.deepEqual(lengthRows(24).find(([k]) => k === 'Tailwind'), ['Tailwind', '6 (p-6, gap-6…)'])
  assert.equal(lengthRows(24, { root: 10 }).find(([k]) => k === 'rem')[1], '2.4rem')
  assert.deepEqual(pxToRemInCss('a{margin:-8px 0px;border:1px solid;padding:12px}'), { css: 'a{margin:-0.5rem 0px;border:1px solid;padding:0.75rem}', count: 2 })
  assert.throws(() => parseLength('wide'), /Not a CSS length/)
})
