import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { TOOLS } from '../src/registry.js'
import { launch, openPanel, paste } from './harness.mjs'

const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

let browser
before(async () => (browser = await launch()))
after(async () => browser?.close())

test('lists every tool by group in both themes without CSP violations', async () => {
  for (const theme of ['light', 'dark']) {
    const { page, frame, errors } = await openPanel(browser, { theme })
    const names = await frame.locator('.tool-item .tool-name').allTextContents()
    assert.deepEqual(names.sort(), TOOLS.map((tool) => tool.title).sort())
    assert.deepEqual(await frame.locator('.group h2').allTextContents(), ['Inspect', 'Encode', 'Convert', 'Generate', 'Text'])
    assert.equal(await frame.evaluate(() => document.activeElement.id), 'search')
    // Every tool shows its own icon tile.
    assert.equal(await frame.locator('.tool-item .tile svg').count(), TOOLS.length)
    // No horizontal scroll at sidebar width.
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    assert.deepEqual(errors, [])
    await page.close()
  }
})

test('pasting a JWT opens the decoder with its claims', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await paste(frame, '#search', JWT)
  await frame.waitForSelector('[data-view="jwt"]:not([hidden])')
  assert.equal(await frame.locator('.title').textContent(), 'JWT Decoder')
  const view = frame.locator('[data-view="jwt"]')
  assert.match(await view.locator('.out').nth(1).textContent(), /"name": "John Doe"/)
  assert.match(await view.locator('.rows').textContent(), /Expires.*expired/s)
  // Esc returns to the list with an empty search.
  await frame.locator('[data-view="jwt"] textarea').first().press('Escape')
  assert.equal(await frame.locator('.home').isVisible(), true)
  assert.equal(await frame.locator('#search').inputValue(), '')
  assert.deepEqual(await frame.locator('.group').first().locator('h2').textContent(), 'Recent')
  assert.deepEqual(errors, [])
  await page.close()
})

test('typing searches tools by keyword and Enter opens the first match', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await frame.locator('#search').fill('sha256')
  assert.deepEqual(await frame.locator('.tool-item .tool-name').allTextContents(), ['Hash & HMAC'])
  await frame.locator('#search').press('Enter')
  const view = frame.locator('[data-view="hash"]')
  // Enter opens the tool without typing a line break into it.
  assert.equal(await view.locator('textarea').inputValue(), '')
  await view.locator('textarea').fill('abc')
  assert.match(await view.locator('.rows').textContent(), /ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/)
  await view.locator('input[type="text"]').fill('key')
  assert.match(await view.locator('.rows').textContent(), /HMAC-SHA-256/)
  await frame.locator('.back').click()
  await frame.locator('#search').fill('nothing like this')
  assert.match(await frame.locator('.empty').textContent(), /No tool matches/)
  assert.deepEqual(errors, [])
  await page.close()
})

test('typed values offer the matching tool', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await frame.locator('#search').fill('*/15 * * * *')
  assert.match(await frame.locator('.suggest').textContent(), /Open in Cron/)
  await frame.locator('#search').press('Enter')
  const view = frame.locator('[data-view="cron"]')
  assert.equal(await view.locator('.sentence').textContent(), 'Every 15 minutes')
  assert.equal(await view.locator('.row').count(), 5)
  assert.deepEqual(errors, [])
  await page.close()
})

test('every tool opens and produces output without errors', async () => {
  const { page, frame, errors } = await openPanel(browser)
  const inputs = {
    time: ['input', '1730000000', /2024-10-27T03:33:20\.000Z/],
    base64: ['textarea', 'SGVsbG8sIHdvcmxkIQ==', /Hello, world!/],
    url: ['textarea', 'https://example.com/a?x=1&y=two', /two/],
    json: ['textarea', '{"b":1,"a":2}', /"b": 1/],
    regex: ['textarea', 'ann@a.com bob@b.com', null],
    escape: ['textarea', '<b>&</b>', /&lt;b&gt;&amp;&lt;\/b&gt;/],
    color: ['input', 'hsl(217 91% 60%)', /#3c83f6/],
    number: ['input', '0xff', /0b11111111/],
    chmod: ['input', 'rw-r--r--', /chmod 644 file/],
    case: ['textarea', 'userProfileId', /user_profile_id/],
    lines: ['textarea', 'b\na\nb', /b\na3 lines → 2/],
    stats: ['textarea', 'Hello world', /Words\s*2/],
    diff: ['textarea', 'one\ntwo', null],
    yaml: ['textarea', 'a: 1\nb: [x]', /"b": \[\n\s+"x"/],
    csv: ['textarea', 'n,v\nx,1', /"v": 1/],
    types: ['textarea', '{"id": 1, "tags": ["a"]}', /tags: string\[\]/],
    curl: ['textarea', "curl https://x.dev -H 'A: b'", /fetch\("https:\/\/x\.dev"/],
    cidr: ['input', '10.0.0.0/30', /10\.0\.0\.2/],
    http: ['input', '429', /Too Many Requests/],
    qr: ['textarea', 'https://onorca.dev', /modules/]
  }
  for (const tool of TOOLS) {
    await frame.locator('#search').fill(tool.title)
    await frame.locator(`.tool-item[data-tool="${tool.id}"]`).click()
    const view = frame.locator(`[data-view="${tool.id}"]`)
    await view.waitFor()
    const input = inputs[tool.id]
    if (input) {
      if (tool.id === 'regex') await view.locator('input').first().fill('(\\w+)@')
      if (tool.id === 'base64') await view.getByRole('button', { name: 'Decode' }).click()
      await view.locator(input[0]).first().fill(input[1])
      if (input[2]) assert.match(await view.textContent(), input[2], tool.id)
    }
    if (tool.id === 'regex') assert.match(await view.locator('.subhead').textContent(), /^2 matches/)
    if (tool.id === 'ids') assert.equal((await view.locator('.ids').textContent()).split('\n').length, 5)
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, tool.id)
    await frame.locator('.back').click()
  }
  assert.deepEqual(errors, [])
  await page.close()
})

test('new tools: diff marks changed words, chmod grid stays in sync, colours paste', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await frame.locator('#search').fill('diff')
  await frame.locator('#search').press('Enter')
  const diff = frame.locator('[data-view="diff"]')
  await diff.locator('textarea').nth(0).fill('const answer = 41;\nkeep')
  await diff.locator('textarea').nth(1).fill('const answer = 42;\nkeep\nadded')
  assert.equal(await diff.locator('.block-head').textContent(), '+2 −1Copy')
  assert.equal(await diff.locator('ins').first().textContent(), '42')
  assert.equal(await diff.locator('del').first().textContent(), '41')
  await frame.locator('.back').click()

  await frame.locator('#search').fill('chmod')
  await frame.locator('#search').press('Enter')
  const chmod = frame.locator('[data-view="chmod"]')
  await chmod.getByLabel('Others execute').uncheck()
  assert.equal(await chmod.locator('input.mono').inputValue(), '754')
  assert.match(await chmod.locator('.rows').textContent(), /rwxr-xr--/)
  await frame.locator('.back').click()

  await paste(frame, '#search', '#ff000080')
  const color = frame.locator('[data-view="color"]')
  await color.waitFor()
  assert.match(await color.locator('.rows').first().textContent(), /rgba\(255, 0, 0, 0\.502\)/)
  assert.equal(await frame.locator('.tool-header .tile svg').count(), 1)
  assert.deepEqual(errors, [])
  await page.close()
})

test('JWT verifies and signs; QR renders an image', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await paste(frame, '#search', JWT)
  const jwt = frame.locator('[data-view="jwt"]')
  await jwt.waitFor()
  await jwt.locator('input').first().fill('your-256-bit-secret')
  assert.match(await jwt.locator('.rows').nth(1).textContent(), /invalid/)
  await jwt.getByRole('button', { name: 'Sign', exact: true }).click()
  await jwt.locator('input').nth(1).fill('s3cret')
  assert.match(await jwt.locator('.out').last().textContent(), /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJ/)
  await frame.locator('.back').click()
  await frame.locator('#search').fill('qr')
  await frame.locator('#search').press('Enter')
  const qr = frame.locator('[data-view="qr"]')
  await qr.locator('textarea').fill('Xin chào 👋')
  assert.equal(await qr.locator('img.qr').evaluate((img) => img.complete && img.naturalWidth > 0), true)
  assert.deepEqual(errors, [])
  await page.close()
})

test('copy buttons copy, or fall back without throwing', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await paste(frame, '#search', '{"a":1}')
  const copy = frame.locator('[data-view="json"] .block .copy')
  await copy.click()
  await frame.waitForFunction(() => /Copied|Select/.test(document.querySelector('[data-view="json"] .block .copy').textContent))
  assert.deepEqual(errors, [])
  await page.close()
})
