import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseDataUri, snippets } from '../../src/tools/image.js'

test('data URIs', () => {
  assert.deepEqual(parseDataUri('data:image/png;base64,iVBORw0KGgo='), { mime: 'image/png', isBase64: true, payload: 'iVBORw0KGgo=', bytes: 8 })
  assert.equal(parseDataUri('data:image/svg+xml;charset=utf-8,%3Csvg%3E').mime, 'image/svg+xml')
  assert.equal(parseDataUri('hello'), null)
  assert.equal(snippets('data:image/png;base64,AAAA', { name: 'logo', width: 16, height: 16 })[2][1], '<img src="data:image/png;base64,AAAA" alt="logo" width="16" height="16" />')
})
