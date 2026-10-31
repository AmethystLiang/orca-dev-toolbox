import assert from 'node:assert/strict'
import { test } from 'node:test'
import { base64Decode, base64Encode, parseUrl, urlDecode, urlEncode, utf8 } from '../src/tools/codec.js'
import { describeCron, nextRuns } from '../src/tools/cron.js'
import { hex, hmac, md5, sha1, sha256, sha512 } from '../src/tools/hash.js'
import { randomString, uuidv4, uuidv7, uuidv7Time } from '../src/tools/ids.js'
import { describeJson, formatJson } from '../src/tools/json.js'
import { decodeJwt } from '../src/tools/jwt.js'
import { replaceRegex, runRegex } from '../src/tools/regex.js'
import { parseTime, timeRows } from '../src/tools/time.js'

test('hashes match the standard test vectors', () => {
  const abc = utf8('abc')
  assert.equal(hex(md5(abc)), '900150983cd24fb0d6963f7d28e17f72')
  assert.equal(hex(sha1(abc)), 'a9993e364706816aba3e25717850c26c9cd0d89d')
  assert.equal(hex(sha256(abc)), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(
    hex(sha512(abc)),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
  )
  assert.equal(hex(md5(utf8(''))), 'd41d8cd98f00b204e9800998ecf8427e')
  assert.equal(hex(sha256(utf8(''))), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  // Two blocks, and multi-byte UTF-8.
  const long = utf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')
  assert.equal(hex(sha256(long)), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1')
  assert.equal(hex(sha1(long)), '84983e441c3bd26ebaae4aa1f95129e5e54670f1')
})

test('HMAC matches RFC 4231 and RFC 2202', () => {
  const key = new Uint8Array(20).fill(0x0b)
  assert.equal(hex(hmac('SHA-256', key, utf8('Hi There'))), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7')
  assert.equal(hex(hmac('SHA-1', key, utf8('Hi There'))), 'b617318655057264e28bc0b6fb378c8ef146be00')
  assert.equal(hex(hmac('MD5', new Uint8Array(16).fill(0x0b), utf8('Hi There'))), '9294727a3638bb1c13f48ef8158bfc9d')
  assert.equal(
    hex(hmac('SHA-512', key, utf8('Hi There'))),
    '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'
  )
  // A key longer than the block is hashed first.
  const longKey = new Uint8Array(131).fill(0xaa)
  assert.equal(
    hex(hmac('SHA-256', longKey, utf8('Test Using Larger Than Block-Size Key - Hash Key First'))),
    '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54'
  )
})

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

test('JWT decoding reads claims and expiry without a key', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  const decoded = decodeJwt(`Bearer ${token}`, Date.UTC(2026, 0, 1))
  assert.deepEqual(decoded.header, { alg: 'HS256', typ: 'JWT' })
  assert.equal(decoded.payload.name, 'John Doe')
  assert.deepEqual(decoded.times.map((t) => [t.claim, t.status]), [['exp', 'expired'], ['iat', null]])
  assert.equal(decoded.times[0].date.toISOString(), '2018-01-18T02:30:22.000Z')
  assert.throws(() => decodeJwt('abc'), /three parts/)
  assert.throws(() => decodeJwt('a.b.c.d.e'), /encrypted/)
  assert.throws(() => decodeJwt('e30.bm90IGpzb24.x'), /payload is not JSON/)
})

test('timestamps: units from length, dates, and the rows shown', () => {
  assert.deepEqual(parseTime('1730000000').unit, 'seconds')
  assert.equal(parseTime('1730000000').date.toISOString(), '2024-10-27T03:33:20.000Z')
  assert.equal(parseTime('1730000000123').unit, 'milliseconds')
  assert.equal(parseTime('1730000000123456').unit, 'microseconds')
  assert.equal(parseTime('2026-10-31T09:00:00Z').date.getTime(), Date.UTC(2026, 9, 31, 9))
  assert.equal(parseTime('   '), null)
  assert.throws(() => parseTime('yesterday-ish'), /Not a timestamp/)
  const rows = Object.fromEntries(timeRows(new Date(Date.UTC(2026, 9, 31, 9)), Date.UTC(2026, 9, 31, 10)))
  assert.equal(rows['Unix seconds'], String(Date.UTC(2026, 9, 31, 9) / 1000))
  assert.equal(rows.Relative, '1 hour ago')
})

test('UUIDs and random strings', () => {
  assert.match(uuidv4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  const time = Date.UTC(2026, 9, 31, 9, 15)
  const v7 = uuidv7(time)
  assert.match(v7, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(uuidv7Time(v7).getTime(), time)
  assert.ok(uuidv7(time) < uuidv7(time + 1))
  assert.equal(uuidv7Time(uuidv4()), null)
  assert.match(randomString(32, 'hex'), /^[0-9a-f]{32}$/)
  assert.equal(randomString(50).length, 50)
})

test('JSON formatting, sorting and error positions', () => {
  assert.equal(formatJson('{"b":1,"a":[1,2]}', { indent: 0, sort: true }), '{"a":[1,2],"b":1}')
  assert.equal(formatJson('{"a":1}'), '{\n  "a": 1\n}')
  assert.throws(() => formatJson('{\n  "a": 1,\n}'), /^Error: Line 3, column 1/)
  assert.equal(describeJson('[1,2,3]'), 'Array of 3 items')
  assert.equal(describeJson('{"a":1}'), 'Object with 1 key')
})

test('regex matches, groups and replacement', () => {
  const { matches } = runRegex('(?<user>\\w+)@(\\w+)\\.com', 'g', 'ann@a.com, bob@b.com')
  assert.deepEqual(matches.map((m) => [m.index, m.text, m.named.user]), [[0, 'ann@a.com', 'ann'], [11, 'bob@b.com', 'bob']])
  assert.equal(runRegex('a', '', 'aaa').matches.length, 1)
  assert.equal(runRegex('', 'g', 'abc').matches.length, 4)
  assert.equal(runRegex('a', 'g', 'a'.repeat(600)).truncated, true)
  assert.throws(() => runRegex('(', 'g', 'x'), SyntaxError)
  assert.equal(replaceRegex('(\\w+)@', 'g', 'ann@a bob@b', '<$1>@'), '<ann>@a <bob>@b')
})

test('cron descriptions and next runs', () => {
  assert.equal(describeCron('0 9 * * 1-5'), 'At 09:00, on Monday through Friday')
  assert.equal(describeCron('*/15 * * * *'), 'Every 15 minutes')
  assert.equal(describeCron('@hourly'), 'Every hour, on the hour')
  assert.equal(describeCron('30 8,12,18 * * *'), 'At 08:30, 12:30 and 18:30')
  assert.equal(describeCron('0 0 1 JAN,JUL *'), 'At 00:00, on day 1 of the month, in January and July')
  assert.equal(describeCron('0 12 * * SUN'), 'At 12:00, on Sunday')
  assert.equal(describeCron('0 12 * * 7'), 'At 12:00, on Sunday')
  assert.throws(() => describeCron('* * * *'), /five fields/)
  assert.throws(() => describeCron('61 * * * *'), /minute must be 0–59/)
  assert.throws(() => describeCron('0 0 * * * *'), /Six fields/)

  const from = new Date(2026, 9, 31, 16, 7) // Saturday 31 October 2026, local time
  const weekday = nextRuns('0 9 * * 1-5', from, 3).map((d) => [d.getDate(), d.getHours(), d.getMinutes()])
  assert.deepEqual(weekday, [[2, 9, 0], [3, 9, 0], [4, 9, 0]])
  const quarter = nextRuns('*/15 * * * *', from, 2).map((d) => d.getMinutes())
  assert.deepEqual(quarter, [15, 30])
  // Both day fields restricted: either matches (the 1st, or any Friday).
  const either = nextRuns('0 0 1 * 5', from, 3).map((d) => [d.getMonth(), d.getDate()])
  assert.deepEqual(either, [[10, 1], [10, 6], [10, 13]])
  const leap = nextRuns('0 0 29 2 *', from, 1)[0]
  assert.equal(leap.getFullYear(), 2028)
})
