import assert from 'node:assert/strict'
import { test } from 'node:test'

import { base64Decode, base64Encode, parseUrl, urlDecode, urlEncode } from '../../src/tools/codec.js'
import { hex } from '../../src/tools/hash.js'

test('Base64 round-trips UTF-8, reads URL-safe input and shows binary as hex', () => {
  assert.equal(base64Encode('Xin chào 👋'), 'WGluIGNow6BvIPCfkYs=')
  assert.equal(base64Encode('Xin chào 👋', true), 'WGluIGNow6BvIPCfkYs')
  assert.deepEqual(base64Decode('WGluIGNow6BvIPCfkYs'), { text: 'Xin chào 👋', size: 14 })
  assert.deepEqual(base64Decode('/w=='), { hex: 'ff', size: 1 })
  assert.throws(() => base64Decode('not base64!'), /Not Base64/)
})

test('URL encoding and parsing', () => {
  assert.equal(urlEncode('a b&c=d/é'), 'a%20b%26c%3Dd%2F%C3%A9')
  assert.equal(urlDecode('a+b%26c'), 'a b&c')
  assert.throws(() => urlDecode('%zz'), /Not URL-encoded/)
  const parts = parseUrl('https://user@example.com:8080/a%20b?q=hello+world&x=1#top')
  assert.equal(parts.host, 'example.com')
  assert.equal(parts.port, '8080')
  assert.equal(parts.path, '/a b')
  assert.deepEqual(parts.query, [['q', 'hello world'], ['x', '1']])
  assert.equal(parts.fragment, 'top')
  assert.equal(parseUrl('not a url'), null)
})
