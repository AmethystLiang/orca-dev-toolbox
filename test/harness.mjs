// A stand-in for Orca's panel host: the same CSP, design tokens and html class in a sandboxed
// srcdoc frame (see buildPluginPanelShellHtml in Orca's plugin-panel-shell.ts). Headless Chromium.
import { chromium } from 'playwright-core'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PANEL_HTML = readFileSync(path.resolve(import.meta.dirname, '..', 'panel', 'index.html'), 'utf8')

const CSP =
  "default-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; " +
  "style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"

const TOKENS = {
  light: {
    background: '#fff', foreground: '#0a0a0a', muted: '#f5f5f5', 'muted-foreground': '#737373', accent: '#f5f5f5',
    border: '#e5e5e5', input: '#e5e5e5', ring: '#a1a1a1', primary: '#171717', 'primary-foreground': '#fafafa',
    destructive: '#dc2626', radius: '0.5rem'
  },
  dark: {
    background: '#0a0a0a', foreground: '#fafafa', muted: '#262626', 'muted-foreground': '#a1a1a1', accent: '#262626',
    border: 'rgb(255 255 255 / 0.1)', input: 'rgb(255 255 255 / 0.15)', ring: '#737373', primary: '#e5e5e5',
    'primary-foreground': '#171717', destructive: '#f87171', radius: '0.5rem'
  }
}

// Orca's frame shell defines orca.storage; this one keeps values in `storage`, an object the
// test owns, so a second openPanel with the same object sees what the first saved.
function storageShim(storage) {
  return `<script>(function () {
    var data = ${JSON.stringify(storage).replace(/</g, '\\u003c')}
    window.orca = { storage: {
      get: function (key) { return Promise.resolve(Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null) },
      set: function (key, value) { data[key] = value; console.log('orca.storage.set ' + JSON.stringify([key, value])); return Promise.resolve() }
    } }
  })()</script>\n`
}

function frameDocument(theme, storage) {
  const tokens = Object.entries(TOKENS[theme]).map(([name, value]) => `--orca-${name}:${value};`).join('')
  return (
    `<!doctype html>\n<html class="${theme}">\n<head>\n<meta charset="utf-8">\n` +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n` +
    `<style id="orca-design-tokens">:root{${tokens}}</style>\n` +
    `<script>document.addEventListener('securitypolicyviolation', function (e) {
      console.error('CSP violation: ' + e.violatedDirective + ' ' + e.blockedURI) })</script>\n` +
    (storage ? storageShim(storage) : '') + `</head>\n${PANEL_HTML}`
  )
}

const HOST_PAGE = `<!doctype html><html><head><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%;display:block}</style></head>
<body><iframe id="panel" sandbox="allow-scripts"></iframe></body></html>`

// Prefers the headless shell this playwright-core expects, then any other cached headless shell.
export async function launch() {
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
    const shells = existsSync(cache) ? readdirSync(cache).filter((name) => name.startsWith('chromium_headless_shell-')).sort().reverse() : []
    for (const shell of shells) {
      const dir = path.join(cache, shell)
      for (const platform of readdirSync(dir)) {
        const executablePath = path.join(dir, platform, 'chrome-headless-shell')
        if (existsSync(executablePath)) return chromium.launch({ headless: true, executablePath })
      }
    }
    throw error
  }
}

/** A panel `width` px wide, as in Orca's right sidebar; `storage` stands in for orca.storage. */
export async function openPanel(browser, { theme = 'light', width = 360, height = 760, storage } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    const saved = message.text().match(/^orca\.storage\.set (.*)$/s)
    if (saved && storage) {
      const [key, value] = JSON.parse(saved[1])
      storage[key] = value
    }
  })
  await page.setContent(HOST_PAGE)
  await page.evaluate((srcdoc) => (document.getElementById('panel').srcdoc = srcdoc), frameDocument(theme, storage))
  let frame
  await page.waitForFunction(() => document.getElementById('panel').contentDocument === null)
  for (let i = 0; i < 50 && !frame; i++) {
    frame = page.frames().find((candidate) => candidate !== page.mainFrame())
    if (!frame) await page.waitForTimeout(20)
  }
  await frame.waitForSelector('#search', { state: 'attached' })
  return { page, frame, errors }
}

/** Fires a paste of `text` into the focused element, as Cmd+V would. */
export async function paste(frame, selector, text) {
  await frame.locator(selector).focus()
  await frame.evaluate(([target, value]) => {
    const data = new DataTransfer()
    data.setData('text/plain', value)
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
    const node = document.querySelector(target)
    if (node.dispatchEvent(event)) node.value = value
  }, [selector, text])
}
