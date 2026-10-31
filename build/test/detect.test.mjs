import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detect } from '../src/detect.js'

const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

test('recognises each kind of pasted value', () => {
  const cases = [
    [JWT, 'jwt'],
    [`Bearer ${JWT}`, 'jwt'],
    ['  1730000000  ', 'time'],
    ['1730000000123', 'time'],
    ['2026-10-31T09:00:00Z', 'time'],
    ['2026-10-31', 'time'],
    ['{"a": [1, 2]}', 'json'],
    ['[1,2,3]', 'json'],
    ['https://example.com/a?b=1', 'url'],
    ['hello%20world%26more', 'url'],
    ['*/5 * * * *', 'cron'],
    ['0 9 * * MON-FRI', 'cron'],
    ['@daily', 'cron'],
    ['SGVsbG8sIHdvcmxkIQ==', 'base64'],
    ['WGluIGNow6BvIPCfkYs', 'base64'],
    ['018f3c1e-7b2a-7c00-8a00-123456789abc', 'ids']
  ]
  for (const [value, tool] of cases) assert.equal(detect(value), tool, value)
})

test('leaves ordinary words and broken values to the search', () => {
  for (const value of ['', '   ', 'json', 'password', 'base64 encode', '{not json', 'hash', '12345', 'eyJhbGciOi']) {
    assert.equal(detect(value), null, value)
  }
})
