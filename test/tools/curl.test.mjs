import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convertCurl, parseCurl, shellWords } from '../../src/tools/curl.js'

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
