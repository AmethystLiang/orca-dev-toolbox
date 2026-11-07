// Builds panel/index.html as one self-contained file: the panel frame's CSP allows only inline
// scripts and styles, with no network, workers or eval.
import { build, transform } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'panel', 'index.html')

const result = await build({
  entryPoints: [path.join(ROOT, 'src', 'panel.js')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  minify: true,
  legalComments: 'none',
  alias: { crypto: './src/shims/no-node-crypto.js' },
  logLevel: 'warning',
  absWorkingDir: ROOT
})
const css = (await transform(readFileSync(path.join(ROOT, 'src', 'panel.css'), 'utf8'), { loader: 'css', minify: true })).code.trim()
const js = result.outputFiles[0].text.replace(/<(!--|script)/gi, '\\x3C$1').trim()
new vm.Script(js)
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('the bundle contains a closing script or style tag')
if (/\beval\(|new Function\(/.test(js)) throw new Error('the bundle contains eval or new Function; the frame CSP refuses both')

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<!-- Bundles js-yaml, qrcode-generator (MIT), bcryptjs and smol-toml (BSD-3-Clause); see THIRD-PARTY-NOTICES.md -->
<title>Dev Toolbox</title>
<style>${css}</style>
</head>
<body>
<div class="app" id="app"></div>
<script>${js}</script>
</body>
</html>
`
mkdirSync(path.dirname(OUT), { recursive: true })
writeFileSync(OUT, html)
console.log(`panel/index.html: ${Buffer.byteLength(html)} bytes`)
