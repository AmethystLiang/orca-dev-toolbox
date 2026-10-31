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

import { BLACK, contrast, contrastLevel, parseColor, toHex, toHsl, toOklch, toRgb, WHITE } from '../src/tools/color.js'
import { bitLength, codePointChar, formatInteger, group, parseInteger, twosComplement } from '../src/tools/number.js'
import { describeMode, parseMode, toOctal, toSymbolic } from '../src/tools/chmod.js'
import { escapeHtml, escapeJsonString, escapeUnicode, unescapeHtml, unescapeJsonString, unescapeUnicode } from '../src/tools/escape.js'
import { convertCase, countText, processLines, words } from '../src/tools/text.js'
import { diffLines, summarize, unifiedDiff } from '../src/tools/diff.js'

test('colours convert between hex, rgb, hsl and oklch', () => {
  const blue = parseColor('#3b82f6')
  assert.equal(toRgb(blue), 'rgb(59, 130, 246)')
  assert.equal(toHsl(blue), 'hsl(217, 91%, 60%)')
  assert.equal(toOklch(blue), 'oklch(62.3% 0.188 259.8)')
  assert.equal(toHex(parseColor('rgb(59 130 246)')), '#3b82f6')
  assert.equal(toHex(parseColor('rgba(59, 130, 246, 0.5)')), '#3b82f680')
  assert.equal(toHex(parseColor('hsl(217deg 91% 60%)')), '#3c83f6')
  assert.equal(toHex(parseColor('oklch(62.3% 0.188 259.8)')), '#3b82f6')
  assert.equal(toHex(parseColor('#fff')), '#ffffff')
  assert.equal(toHex(parseColor('f00a')), '#ff0000aa')
  assert.equal(parseColor('oklch(70% 0.4 150)').outOfGamut, true)
  assert.equal(toOklch(parseColor('#808080')), 'oklch(59.987% 0 0)'.replace('59.987', '60'))
  assert.equal(Math.round(contrast(WHITE, BLACK)), 21)
  assert.equal(contrastLevel(contrast(parseColor('#767676'), WHITE)), 'AA')
  assert.throws(() => parseColor('blue-ish'), /Not a colour/)
  assert.equal(parseColor('  '), null)
})

test('integers convert between bases of any size', () => {
  assert.deepEqual(parseInteger('0xff'), { value: 255n, radix: 16 })
  assert.deepEqual(parseInteger('ff'), { value: 255n, radix: 16 })
  assert.deepEqual(parseInteger('0b1010_1010'), { value: 170n, radix: 2 })
  assert.deepEqual(parseInteger('1,000,000'), { value: 1000000n, radix: 10 })
  assert.deepEqual(parseInteger('-0o17'), { value: -15n, radix: 8 })
  assert.deepEqual(parseInteger('777', 8), { value: 511n, radix: 8 })
  assert.equal(parseInteger('18446744073709551615').value.toString(16), 'ffffffffffffffff')
  assert.throws(() => parseInteger('102', 2), /binary/)
  assert.equal(formatInteger(-255n, 16), '-0xff')
  assert.equal(group('11110000', 4), '1111 0000')
  assert.equal(group('1000000', 3, ','), '1,000,000')
  assert.equal(bitLength(255n), 8)
  assert.deepEqual(twosComplement(-1n), { width: 8, label: 'Unsigned 8-bit', value: 255n })
  assert.deepEqual(twosComplement(0xffffffffn), { width: 32, label: 'Signed 32-bit', value: -1n })
  assert.equal(twosComplement(100n), null)
  assert.equal(codePointChar(0x1f600n), '😀')
  assert.equal(codePointChar(10n), null)
})

test('chmod modes read both ways', () => {
  assert.equal(parseMode('755'), 0o755)
  assert.equal(parseMode('chmod 0644'), 0o644)
  assert.equal(parseMode('rwxr-xr-x'), 0o755)
  assert.equal(parseMode('-rwsr-xr-x'), 0o4755)
  assert.equal(parseMode('drwxrwxrwt'), 0o1777)
  assert.equal(toSymbolic(0o4755), 'rwsr-xr-x')
  assert.equal(toSymbolic(0o1666), 'rw-rw-rwT')
  assert.equal(toOctal(0o644), '644')
  assert.equal(toOctal(0o2755), '2755')
  assert.equal(describeMode(0o644), 'Owner can read and write; group and others can read.')
  assert.equal(describeMode(0o700), 'Owner can read, write and execute; group and others have no access.')
  assert.throws(() => parseMode('999'), /Not a mode/)
})

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

test('identifier cases, line tools and counts', () => {
  assert.deepEqual(words('parseHTTPResponse_v2'), ['parse', 'HTTP', 'Response', 'v2'])
  assert.deepEqual(words('Xin chào thế giới'), ['Xin', 'chào', 'thế', 'giới'])
  assert.equal(convertCase('user id\nHTTPServer', 'camelCase'), 'userId\nhttpServer')
  assert.equal(convertCase('user-profile_page', 'PascalCase'), 'UserProfilePage')
  assert.equal(convertCase('userProfile', 'CONSTANT_CASE'), 'USER_PROFILE')
  assert.equal(convertCase('User Profile', 'kebab-case'), 'user-profile')
  assert.equal(convertCase('hello_world', 'Sentence case'), 'Hello world')
  const lines = processLines(' b\nfile10\n\nfile9\nB\nb ', { trim: true, dropEmpty: true, unique: true, ignoreCase: true, sort: 'asc' })
  assert.equal(lines.text, 'b\nfile9\nfile10')
  assert.deepEqual([lines.before, lines.after, lines.duplicates], [6, 3, 2])
  assert.equal(processLines('a\nb\nc', { sort: 'reverse' }).text, 'c\nb\na')
  assert.equal(processLines('a\nb\nc', { sort: 'shuffle', random: () => 0 }).text, 'b\nc\na')
  assert.equal(processLines('').after, 0)
  const counts = countText('Hi 👋🏽 there.\n\nNew para é')
  assert.equal(counts.characters, 23)
  assert.equal(counts.words, 5)
  assert.equal(counts.lines, 3)
  assert.equal(counts.paragraphs, 2)
  assert.equal(counts.bytes, 31)
  assert.equal(counts.codePoints, 24)
})

test('line diff finds the shortest edit and writes a unified patch', () => {
  const before = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n'
  const after = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nNINE!\nten\neleven\n'
  const lines = diffLines(before, after)
  assert.deepEqual(summarize(lines), { added: 2, removed: 1 })
  assert.equal(unifiedDiff(lines), [
    '--- a', '+++ b', '@@ -6,5 +6,6 @@', ' six', ' seven', ' eight', '-nine', '+NINE!', ' ten', '+eleven', ''
  ].join('\n'))
  const words = diffLines('const answer = 41;', 'const answer = 42;')
  assert.deepEqual(words[1].parts, [{ text: 'const answer = ', changed: false }, { text: '42', changed: true }, { text: ';', changed: false }])
  assert.deepEqual(summarize(diffLines('a  b\n', 'a b\n', { ignoreWhitespace: true })), { added: 0, removed: 0 })
  assert.equal(unifiedDiff(diffLines('same', 'same')), '')
  // Every line of both sides appears once, in order.
  const big = diffLines('a\nb\nc\nd\ne\nf', 'x\nb\ny\nd\nz')
  assert.deepEqual(big.filter((l) => l.type !== 'insert').map((l) => l.text), ['a', 'b', 'c', 'd', 'e', 'f'])
  assert.deepEqual(big.filter((l) => l.type !== 'delete').map((l) => l.text), ['x', 'b', 'y', 'd', 'z'])
})

import { sha384 } from '../src/tools/hash.js'
import { signJwt, verifyJwt } from '../src/tools/jwt.js'
import { ulid, ulidTime } from '../src/tools/ids.js'
import { zoneString } from '../src/tools/time.js'
import { jsonToYaml, parseYaml, yamlToJson } from '../src/tools/yaml.js'
import { jsonToTypes } from '../src/tools/types.js'
import { csvToJson, jsonToCsv, parseCsv } from '../src/tools/csv.js'
import { formatIPv6, parseIPv6, subnet } from '../src/tools/cidr.js'
import { convertCurl, parseCurl, shellWords } from '../src/tools/curl.js'
import { searchStatus } from '../src/tools/http.js'

test('SHA-384, JWT signing and verification, ULID, time zones', () => {
  assert.equal(hex(sha384(utf8('abc'))), 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7')
  assert.equal(hex(hmac('SHA-384', new Uint8Array(20).fill(0x0b), utf8('Hi There'))), 'afd03944d84895626b0825f4ab46907f15f9dadbe4101ec682aa034c7cebc59cfaea9ea9076ede7f4af152e8b2fa9cb6')
  const jwtIo = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  assert.equal(signJwt({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, 'your-256-bit-secret'), jwtIo)
  assert.equal(verifyJwt(jwtIo, 'your-256-bit-secret'), true)
  assert.equal(verifyJwt(`Bearer ${jwtIo}`, 'wrong'), false)
  for (const alg of ['HS384', 'HS512']) assert.equal(verifyJwt(signJwt({ a: 1 }, 's', alg), 's'), true)
  assert.equal(ulid(1469918176385, new Uint8Array(10)), '01ARYZ6S410000000000000000')
  assert.equal(ulidTime('01ARYZ6S41TSV4RRFFQ69G5FAV').getTime(), 1469918176385)
  assert.equal(zoneString(new Date('2026-10-31T09:05:09Z'), 'Asia/Kolkata'), '2026-10-31 14:35:09 GMT+05:30')
  assert.equal(zoneString(new Date('2026-10-31T09:05:09Z'), 'UTC'), '2026-10-31 09:05:09 GMT+00:00')
})

test('YAML ↔ JSON', () => {
  assert.equal(yamlToJson('name: app\nports:\n  - 80\n  - 443\nenv: {DEBUG: true}\n'), '{\n  "name": "app",\n  "ports": [\n    80,\n    443\n  ],\n  "env": {\n    "DEBUG": true\n  }\n}')
  assert.deepEqual(parseYaml('a: 1\n---\nb: 2\n'), { value: [{ a: 1 }, { b: 2 }], documents: 2 })
  assert.equal(jsonToYaml('{"a":[1,{"b":"x"}],"c":null}'), 'a:\n  - 1\n  - b: x\nc: null\n')
  assert.throws(() => yamlToJson('a: [1,\nb'), /line 2/)
  assert.throws(() => jsonToYaml('{bad'), /Not valid JSON/)
})

test('JSON to types: optional, nullable, nested and named', () => {
  const sample = '{"id":1,"user_name":"ann","items":[{"sku":"a","qty":1},{"sku":"b","qty":2.5,"note":"x"}],"parent":null,"meta":{"tags":["t"]}}'
  assert.equal(jsonToTypes(sample, 'typescript'), [
    'export interface Root {', '  id: number', '  user_name: string', '  items: Item[]', '  parent: null', '  meta: Meta', '}', '',
    'export interface Item {', '  sku: string', '  qty: number', '  note?: string', '}', '',
    'export interface Meta {', '  tags: string[]', '}'
  ].join('\n'))
  const go = jsonToTypes(sample, 'go')
  assert.match(go, /ID +int64 +`json:"id"`/)
  assert.match(go, /Qty +float64/)
  assert.match(go, /Note +\*string +`json:"note,omitempty"`/)
  assert.match(jsonToTypes(sample, 'rust'), /#\[serde\(default, skip_serializing_if = "Option::is_none"\)\]\n    pub note: Option<String>,/)
  assert.match(jsonToTypes(sample, 'python'), /note: str \| None = None/)
  assert.equal(jsonToTypes('[{"a":1},{"a":null}]'), 'export type Root = RootItem[]\n\nexport interface RootItem {\n  a: number | null\n}')
  assert.throws(() => jsonToTypes('{'), /Not valid JSON/)
})

test('CSV ↔ JSON follows RFC 4180', () => {
  assert.deepEqual(parseCsv('a,"b ""q""",c\n"multi\nline",2,'), [['a', 'b "q"', 'c'], ['multi\nline', '2', '']])
  assert.deepEqual(csvToJson('name\tage\nAnn\t30\nBob\t').value, [{ name: 'Ann', age: 30 }, { name: 'Bob', age: null }])
  assert.equal(csvToJson('a;b\n1;2').delimiter, ';')
  assert.deepEqual(csvToJson('id,zip\n1,007', { types: true }).value, [{ id: 1, zip: '007' }])
  assert.equal(jsonToCsv('[{"a":1,"b":"x,y"},{"a":2,"c":"say \\"hi\\""}]'), 'a,b,c\n1,"x,y",\n2,,"say ""hi"""')
  assert.throws(() => parseCsv('"open'), /never closed/)
})

test('subnets for IPv4 and IPv6', () => {
  const v4 = subnet('192.168.1.130/26')
  assert.deepEqual([v4.network, v4.netmask, v4.first, v4.last, v4.broadcast, v4.hosts, v4.kind], ['192.168.1.128/26', '255.255.255.192', '192.168.1.129', '192.168.1.190', '192.168.1.191', 62n, 'Private (RFC 1918)'])
  assert.equal(subnet('10.1.2.3 255.255.0.0').network, '10.1.0.0/16')
  assert.equal(subnet('8.8.8.8').kind, 'Public')
  assert.equal(subnet('10.0.0.0/31').hosts, 2n)
  assert.equal(subnet('10.0.0.0/8').contains('10.200.0.1'), true)
  assert.equal(subnet('10.0.0.0/8').contains('11.0.0.1'), false)
  const v6 = subnet('2001:DB8:0:0:1::1/64')
  assert.deepEqual([v6.network, v6.first, v6.last, v6.kind], ['2001:db8::/64', '2001:db8::', '2001:db8::ffff:ffff:ffff:ffff', 'Documentation'])
  assert.equal(formatIPv6(parseIPv6('::ffff:192.0.2.1')), '::ffff:c000:201')
  assert.equal(formatIPv6(parseIPv6('2001:db8:0:1:0:0:0:1')), '2001:db8:0:1::1')
  assert.throws(() => subnet('300.1.1.1/8'), /Not an IP/)
  assert.throws(() => subnet('10.0.0.0 255.0.255.0'), /contiguous/)
  assert.throws(() => subnet('10.0.0.0/33'), /0 to 32/)
})

test('curl commands convert to fetch, requests and HTTPie', () => {
  assert.deepEqual(shellWords(`curl 'a b' "c\\"d" e\\ f $'g\\nh' \\\n -X`), ['curl', 'a b', 'c"d', 'e f', 'g\nh', '-X'])
  const request = parseCurl(`curl https://api.x.dev/items -H 'Accept: application/json' --json '{"n":1}' -u ann:pw -sSL`)
  assert.equal(request.method, 'POST')
  assert.equal(request.followRedirects, true)
  assert.deepEqual(request.headers.map(([n]) => n), ['Accept', 'Content-Type', 'Authorization'])
  assert.equal(request.headers[2][1], 'Basic YW5uOnB3')
  const fetchCode = convertCurl(`curl -X PUT https://x.dev/a -H "Content-Type: application/json" -d '{"ok":true}'`, 'fetch').code
  assert.match(fetchCode, /method: "PUT"/)
  assert.match(fetchCode, /body: JSON\.stringify\(\{\n {4}"ok": true\n {2}\}\)/)
  assert.match(convertCurl(`curl https://x.dev -d 'a=1'`, 'python').code, /requests\.post\('https:\/\/x\.dev', headers=headers, data=data\)/)
  assert.equal(convertCurl(`curl -G https://x.dev/s -d q=1`, 'httpie').code, "http GET 'https://x.dev/s?q=1'")
  assert.equal(convertCurl(`curl -k -X DELETE https://x.dev/a/1`, 'httpie').code, 'http --verify=no DELETE https://x.dev/a/1')
  assert.throws(() => parseCurl('wget x'), /starts with curl/)
})

test('HTTP status search', () => {
  assert.deepEqual(searchStatus('404').map(([c]) => c), [404])
  assert.deepEqual(searchStatus('30x').map(([c]) => c), [300, 301, 302, 303, 304, 307, 308])
  assert.ok(searchStatus('rate').some(([c]) => c === 429))
  assert.equal(searchStatus('teapot')[0][0], 418)
})

import { removeAccents, slugify, transform } from '../src/tools/transform.js'
import { clean, inspect } from '../src/tools/chars.js'
import { formatSize, humanDuration, isoDuration, parseDuration, parseSize } from '../src/tools/units.js'
import { formatXml, minifyXml } from '../src/tools/xml.js'
import { formatSql, minifySql } from '../src/tools/sql.js'

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

test('character inspector flags hidden, look-alike and decomposed characters', () => {
  const report = inspect('pаypal​.com')
  assert.equal(report.hidden, 1)
  assert.equal(report.lookalikes, 1)
  assert.equal(report.chars[1].code, 'U+0430')
  assert.equal(report.chars[6].name, 'ZERO WIDTH SPACE')
  assert.equal(inspect('Việt'.normalize('NFD')).normalization, 'NFD')
  assert.equal(inspect('Việt').normalization, 'NFC')
  assert.equal(inspect('abc').normalization, 'plain')
  assert.equal(clean('﻿a​b c 👨‍👩‍👧'), 'ab c 👨‍👩‍👧')
  assert.equal(inspect('é').chars[0].utf8, 'C3 A9')
})

test('sizes and durations', () => {
  assert.equal(parseSize('1.5 GB'), 1.5e9)
  assert.equal(parseSize('512MiB'), 512 * 1024 ** 2)
  assert.equal(parseSize('2g'), 2 * 1024 ** 3)
  assert.equal(formatSize(1536), '1.54 KB')
  assert.equal(formatSize(1536, true), '1.5 KiB')
  assert.throws(() => parseSize('3 parsecs'), /Unknown unit/)
  assert.equal(parseDuration('1h30m'), 5400e3)
  assert.equal(parseDuration('1d 2h 3m 4s'), 93784e3)
  assert.equal(parseDuration('01:30:00'), 5400e3)
  assert.equal(parseDuration('PT1H30M'), 5400e3)
  assert.equal(parseDuration('90', 's'), 90e3)
  assert.equal(parseDuration('2 hours and 15 minutes'), 8100e3)
  assert.equal(humanDuration(93784250), '1d 2h 3m 4s 250ms')
  assert.equal(isoDuration(93784e3), 'P1DT2H3M4S')
  assert.equal(isoDuration(0), 'PT0S')
  assert.throws(() => parseDuration('soon'), /Not a duration/)
})

test('XML formats, minifies and reports where nesting breaks', () => {
  assert.equal(formatXml('<a x="1"><b>hi</b><c/><d></d><!-- n --></a>'), '<a x="1">\n  <b>hi</b>\n  <c/>\n  <d></d>\n  <!-- n -->\n</a>')
  assert.equal(formatXml('<a><b>1</b></a>', { indent: '\t' }), '<a>\n\t<b>1</b>\n</a>')
  assert.equal(minifyXml('<a>\n  <b  x="1"  >hi   there</b>\n  <!-- c -->\n</a>'), '<a><b x="1">hi there</b></a>')
  assert.equal(formatXml('<p a="x > y">t</p>'), '<p a="x > y">t</p>')
  assert.throws(() => formatXml('<a>\n<b></a>'), /Line 2: <\/a> where <\/b> was expected/)
  assert.throws(() => formatXml('<a>'), /never closed/)
})

test('SQL formats clauses, conditions and subqueries', () => {
  assert.equal(formatSql("select a, b from t where x = 1 and y in (select id from u where z) order by a desc"), [
    'SELECT', '  a,', '  b', 'FROM t', 'WHERE x = 1', '  AND y IN (', '    SELECT id', '    FROM u', '    WHERE z', '  )', 'ORDER BY a DESC', ''
  ].join('\n'))
  assert.equal(formatSql("SELECT count(*) FROM t LEFT JOIN u ON u.id = t.uid AND u.ok WHERE d BETWEEN 1 AND 2"), [
    'SELECT count(*)', 'FROM t', 'LEFT JOIN u', '  ON u.id = t.uid', '  AND u.ok', 'WHERE d BETWEEN 1 AND 2', ''
  ].join('\n'))
  assert.equal(formatSql("insert into t (a) values ('it''s -- not a comment')", { uppercase: false }), "insert into t (a)\nvalues ('it''s -- not a comment')\n")
  assert.equal(formatSql('select t.order, x::text from "Order" t'), 'SELECT\n  t.order,\n  x::text\nFROM "Order" t\n')
  assert.equal(minifySql('select a ,\n b -- c\n from t'), 'select a, b from t')
})
