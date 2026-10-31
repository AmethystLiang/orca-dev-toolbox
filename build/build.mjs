// Builds ../panel/index.html: one self-contained file, because the panel frame's CSP allows only
// inline scripts and styles, with no network, workers or eval.
// Usage: npm ci --ignore-scripts && node build.mjs
import { build, transform } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const HERE = import.meta.dirname
const OUT = path.resolve(HERE, '..', 'panel', 'index.html')

const result = await build({
  entryPoints: [path.join(HERE, 'src', 'panel.js')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
  absWorkingDir: HERE
})
const css = (await transform(readFileSync(path.join(HERE, 'src', 'panel.css'), 'utf8'), { loader: 'css', minify: true })).code.trim()
const js = result.outputFiles[0].text.replace(/<(!--|script)/gi, '\\x3C$1').trim()
new vm.Script(js)
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('the bundle contains a closing script or style tag')
if (/\beval\(|new Function\(/.test(js)) throw new Error('the bundle contains eval or new Function; the frame CSP refuses both')

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<!-- Bundles js-yaml and qrcode-generator (MIT); see THIRD-PARTY-NOTICES.md -->
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
