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
    assert.deepEqual(await frame.locator('.group h2').allTextContents(), ['Inspect', 'Encode', 'Generate', 'Text'])
    assert.equal(await frame.evaluate(() => document.activeElement.id), 'search')
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
  await frame.locator('[data-view="jwt"] textarea').press('Escape')
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
    regex: ['textarea', 'ann@a.com bob@b.com', null]
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

test('copy buttons copy, or fall back without throwing', async () => {
  const { page, frame, errors } = await openPanel(browser)
  await paste(frame, '#search', '{"a":1}')
  const copy = frame.locator('[data-view="json"] .block .copy')
  await copy.click()
  await frame.waitForFunction(() => /Copied|Select/.test(document.querySelector('[data-view="json"] .block .copy').textContent))
  assert.deepEqual(errors, [])
  await page.close()
})
