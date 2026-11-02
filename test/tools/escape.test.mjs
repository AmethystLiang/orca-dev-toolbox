import assert from 'node:assert/strict'
import { test } from 'node:test'

import { escapeHtml, escapeJsonString, escapeUnicode, unescapeHtml, unescapeJsonString, unescapeUnicode } from '../../src/tools/escape.js'

test('escapes round-trip for HTML, JSON strings and Unicode', () => {
  assert.equal(escapeHtml('<a href="x">Tom & Jerry\'s</a>'), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;')
  assert.equal(unescapeHtml('&lt;b&gt; &amp;amp; &#169; &#x1F600; &hellip; &bogus;'), '<b> &amp; © 😀 … &bogus;')
  assert.equal(escapeJsonString('say "hi"\n\ttab \\'), 'say \\"hi\\"\\n\\ttab \\\\')
  assert.equal(unescapeJsonString('"say \\"hi\\"\\n\\u00e9"'), 'say "hi"\né')
  assert.equal(unescapeJsonString('bare "quotes" ok'), 'bare "quotes" ok')
  assert.throws(() => unescapeJsonString('bad \\q'), /backslash/)
  assert.equal(escapeUnicode('Xin chào 👋'), 'Xin ch\\u00E0o \\uD83D\\uDC4B')
  assert.equal(escapeUnicode('👋', { braces: true }), '\\u{1F44B}')
  assert.equal(unescapeUnicode('Xin ch\\u00e0o \\uD83D\\uDC4B \\u{1F600} \\x41 U+00E9\\n'), 'Xin chào 👋 😀 A é\n')
})
