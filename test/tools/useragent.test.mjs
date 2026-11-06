import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseUserAgent } from '../../src/tools/useragent.js'

const brief = (ua) => {
  const r = parseUserAgent(ua)
  return [r.kind, (r.browser ?? r.bot ?? r.client)?.name, (r.browser ?? r.bot ?? r.client)?.version, r.os?.name, r.os?.version, r.device?.type, r.engine?.name]
}

test('desktop browsers', () => {
  assert.deepEqual(brief('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'),
    ['browser', 'Chrome', '130.0.0.0', 'Windows', '10 or 11', 'Desktop', 'Blink'])
  assert.deepEqual(brief('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'),
    ['browser', 'Microsoft Edge', '130.0.0.0', 'Windows', '10 or 11', 'Desktop', 'Blink'])
  assert.deepEqual(brief('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0'),
    ['browser', 'Firefox', '132.0', 'macOS', '10.15', 'Desktop', 'Gecko'])
  assert.deepEqual(brief('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'),
    ['browser', 'Safari', '18.1', 'macOS', '10.15.7', 'Desktop', 'WebKit'])
  assert.deepEqual(brief('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/131.0.218 Chrome/125.0.6422.218 Safari/537.36'),
    ['browser', 'Cốc Cốc', '131.0.218', 'Windows', '10 or 11', 'Desktop', 'Blink'])
  assert.deepEqual(brief('Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko'),
    ['browser', 'Internet Explorer', '11.0', 'Windows', '7', 'Desktop', 'Trident'])
  const r = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Orca/1.4.251 Chrome/138.0.7204.100 Electron/37.2.0 Safari/537.36')
  assert.equal(r.browser.name, 'Electron')
  assert.ok(r.notes.some((note) => /frozen/.test(note)))
})

test('mobile browsers and in-app browsers', () => {
  assert.deepEqual(brief('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1'),
    ['browser', 'Chrome', '130.0.6723.90', 'iOS', '18.1', 'Mobile', 'WebKit'])
  assert.deepEqual(brief('Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.6261.105 Mobile Safari/537.36'),
    ['browser', 'Samsung Internet', '26.0', 'Android', '14', 'Mobile', 'Blink'])
  const samsung = parseUserAgent('Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.6261.105 Mobile Safari/537.36')
  assert.deepEqual([samsung.device.vendor, samsung.device.model], ['Samsung', 'SM-S928B'])
  const reduced = parseUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36')
  assert.equal(reduced.device.model, '')
  assert.ok(reduced.notes.some((note) => /Reduced Android/.test(note)))
  assert.equal(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/495 ZaloTheme/light ZaloLanguage/vi').browser.name, 'Zalo in-app')
  assert.equal(parseUserAgent('Mozilla/5.0 (Linux; Android 13; CPH2581 Build/TP1A.220905.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 Zalo android/12100734 ZaloTheme/dark ZaloLanguage/vi').os.name, 'Android')
  assert.equal(parseUserAgent('Mozilla/5.0 (Linux; Android 13; CPH2581 Build/TP1A.220905.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 Zalo android/12100734 ZaloTheme/dark ZaloLanguage/vi').device.vendor, 'OPPO')
  assert.equal(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/485.0.0.36.107]').browser.name, 'Facebook in-app')
  assert.deepEqual(brief('Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'),
    ['browser', 'Safari', '17.2', 'iPadOS', '17.2', 'Tablet', 'WebKit'])
})

test('bots and HTTP clients', () => {
  assert.deepEqual(brief('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)').slice(0, 3), ['bot', 'Googlebot', '2.1'])
  assert.deepEqual(brief('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)').slice(0, 3), ['bot', 'ClaudeBot', '1.0'])
  assert.deepEqual(brief('curl/8.7.1').slice(0, 3), ['client', 'curl', '8.7.1'])
  assert.deepEqual(brief('User-Agent: python-requests/2.32.3').slice(0, 3), ['client', 'Python requests', '2.32.3'])
  assert.deepEqual(brief('PostmanRuntime/7.42.0').slice(0, 3), ['client', 'Postman', '7.42.0'])
  assert.throws(() => parseUserAgent('  '))
})
