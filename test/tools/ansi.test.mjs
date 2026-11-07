import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hasAnsi, stripAnsi } from '../../src/tools/ansi.js'

test('colour and cursor codes come out', () => {
  assert.deepEqual(stripAnsi('\x1b[32m✓\x1b[0m passed \x1b[1;31mfail\x1b[22m  \r\nnext'), { text: '✓ passed fail\nnext', removed: 4, redrawn: 0 })
  assert.equal(stripAnsi('\x1b[2K\x1b[1G\x1b[?25lready\x1b[?25h').text, 'ready')
  // OSC 8 hyperlinks keep their text; window titles go.
  assert.equal(stripAnsi('\x1b]8;;https://example.com\x07docs\x1b]8;;\x07 \x1b]0;title\x1b\\x').text, 'docs x')
  // Escapes written out in logs and source.
  assert.equal(stripAnsi('\\x1b[31merror\\033[0m: \\e[1mbad\\u001b[0m ^[[33mwarn^[[0m').text, 'error: bad warn')
})

test('progress-bar redraws keep what the terminal showed last', () => {
  assert.deepEqual(stripAnsi('Downloading 10%\rDownloading 50%\rDownloading 100%\nDone'), { text: 'Downloading 100%\nDone', removed: 0, redrawn: 1 })
  assert.equal(stripAnsi('abc\b\bX').text, 'aXc')
  assert.equal(stripAnsi('long line\rshort').text, 'shortline')
  assert.equal(stripAnsi('a\r\nb', { redraw: false }).text, 'a\nb')
  assert.equal(stripAnsi('a\n\n\n\nb\n', { squeeze: true }).text, 'a\n\nb\n')
  assert.equal(stripAnsi('a  \nb', { trim: false }).text, 'a  \nb')
})

test('recognises terminal output', () => {
  assert.equal(hasAnsi('plain text'), false)
  assert.equal(hasAnsi('\x1b[0m'), true)
  assert.equal(hasAnsi('echo -e "\\033[1;31mred"'), true)
  assert.equal(hasAnsi('a regex like \\e[abc]'), false)
})
