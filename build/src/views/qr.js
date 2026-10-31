import { qrcode } from 'qrcode-generator'
import { copyButton, field, h, hint, segmented, set, textarea } from '../ui.js'

// UTF-8 bytes, so accents and emoji scan correctly.
qrcode.stringToBytes = (text) => Array.from(new TextEncoder().encode(text))

/** An SVG of `text` as a QR code, dark modules on white, with a 4-module quiet zone. */
export function qrSvg(text, level = 'M') {
  const code = qrcode(0, level)
  code.addData(text, 'Byte')
  code.make()
  const count = code.getModuleCount()
  const size = count + 8
  let path = ''
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) if (code.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`
  }
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`,
    modules: count
  }
}

export default {
  id: 'qr',
  title: 'QR Code',
  group: 'Generate',
  icon: 'qr',
  color: '#a855f7',
  description: 'A QR code for a URL or text, to open on your phone',
  keywords: ['qr', 'qrcode', 'barcode', 'phone', 'mobile', 'scan', 'link', 'wifi', 'svg'],
  create() {
    const source = textarea({ rows: 3, placeholder: 'http://192.168.1.20:5173 or any text' })
    const result = h('div', { class: 'result' })
    let svg = ''
    const level = segmented([['L', 'L 7%'], ['M', 'M 15%'], ['Q', 'Q 25%'], ['H', 'H 30%']], 'M', () => update(), 'Error correction')
    function update() {
      const text = source.value
      if (!text) return set(result, hint('Handy for opening a local dev server on your phone: use your machine’s LAN address, not localhost.'))
      try {
        const qr = qrSvg(text, level.get())
        svg = qr.svg
        const image = h('img', { class: 'qr', alt: `QR code for ${text.slice(0, 80)}`, src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
        set(result,
          h('div', { class: 'qr-frame' }, image),
          h('div', { class: 'bar' }, copyButton(() => svg, 'Copy as SVG', 'Copy SVG')),
          hint(`${qr.modules}×${qr.modules} modules, ${new TextEncoder().encode(text).length} bytes. Higher error correction survives smudges but makes a denser code.`))
      } catch {
        set(result, hint('Too long for a QR code: the limit is about 2,900 bytes at level L.'))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Text or URL', source), h('div', { class: 'inline' }, field('Error correction', level.node)), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
