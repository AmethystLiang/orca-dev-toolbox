import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatXml, minifyXml } from '../../src/tools/xml.js'

test('XML formats, minifies and reports where nesting breaks', () => {
  assert.equal(formatXml('<a x="1"><b>hi</b><c/><d></d><!-- n --></a>'), '<a x="1">\n  <b>hi</b>\n  <c/>\n  <d></d>\n  <!-- n -->\n</a>')
  assert.equal(formatXml('<a><b>1</b></a>', { indent: '\t' }), '<a>\n\t<b>1</b>\n</a>')
  assert.equal(minifyXml('<a>\n  <b  x="1"  >hi   there</b>\n  <!-- c -->\n</a>'), '<a><b x="1">hi there</b></a>')
  assert.equal(formatXml('<p a="x > y">t</p>'), '<p a="x > y">t</p>')
  assert.throws(() => formatXml('<a>\n<b></a>'), /Line 2: <\/a> where <\/b> was expected/)
  assert.throws(() => formatXml('<a>'), /never closed/)
})
