import { base64Overhead, formatBytes, parseDataUri, snippets } from '../tools/image.js'
import { copyButton, errorText, h, hint, set, textarea } from '../ui.js'

const MAX_BYTES = 10 * 1024 * 1024
const PREVIEW_CHARS = 160

function snippetRows(dataUri, details) {
  return h('div', { class: 'rows' }, snippets(dataUri, details).map(([label, value]) =>
    h('div', { class: 'row' },
      h('span', { class: 'row-label' }, label),
      h('span', { class: 'row-value clip' }, value.length > PREVIEW_CHARS ? `${value.slice(0, PREVIEW_CHARS)}…` : value),
      copyButton(() => value, `Copy ${label}`))))
}

export default {
  id: 'image',
  title: 'Image to Base64',
  group: 'Encode',
  icon: 'image',
  color: '#ec4899',
  description: 'Drop, pick or paste an image to get a data URI, CSS or <img>',
  keywords: ['image', 'base64', 'data uri', 'data url', 'png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'icon', 'inline', 'favicon', 'css'],
  create() {
    const picker = h('input', { type: 'file', accept: 'image/*', class: 'file', 'aria-label': 'Choose an image' })
    const zone = h('label', { class: 'dropzone', tabindex: '0' },
      picker,
      h('strong', {}, 'Drop an image here'),
      h('span', {}, 'or click to choose one, or paste with ⌘V'))
    const back = textarea({ rows: 3, placeholder: 'Or paste a data URI (data:image/png;base64,…) to preview it' })
    const result = h('div', { class: 'result' })

    function show(dataUri, { name, size, type }) {
      const image = h('img', { class: 'preview', alt: name })
      image.addEventListener('load', () => {
        const details = { name: name.replace(/\.[^.]+$/, ''), width: image.naturalWidth, height: image.naturalHeight }
        set(result,
          h('div', { class: 'preview-frame' }, image),
          hint(`${name} · ${type} · ${image.naturalWidth}×${image.naturalHeight} · ${formatBytes(size)} → ${formatBytes(base64Overhead(size))} as Base64`),
          snippetRows(dataUri, details),
          size > 20 * 1024 ? hint('Inline images over about 20 KB usually load better as files: Base64 adds a third, and the image cannot be cached on its own.') : null)
      })
      image.addEventListener('error', () => set(result, errorText('This does not decode as an image.')))
      image.src = dataUri
      set(result, image)
    }

    function readFile(file) {
      if (!file) return
      if (!file.type.startsWith('image/')) return set(result, errorText(`${file.name} is not an image.`))
      if (file.size > MAX_BYTES) return set(result, errorText(`${file.name} is ${formatBytes(file.size)}; the limit here is 10 MB.`))
      const reader = new FileReader()
      reader.onload = () => show(reader.result, { name: file.name, size: file.size, type: file.type })
      reader.onerror = () => set(result, errorText('The file could not be read.'))
      reader.readAsDataURL(file)
    }

    picker.addEventListener('change', () => readFile(picker.files?.[0]))
    zone.addEventListener('dragover', (event) => {
      event.preventDefault()
      zone.classList.add('over')
    })
    zone.addEventListener('dragleave', () => zone.classList.remove('over'))
    zone.addEventListener('drop', (event) => {
      event.preventDefault()
      zone.classList.remove('over')
      readFile(event.dataTransfer?.files?.[0])
    })
    const node = h('div', {}, zone, back, result)
    node.addEventListener('paste', (event) => {
      const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) {
        event.preventDefault()
        readFile(file)
      }
    })
    back.addEventListener('input', () => {
      const parsed = parseDataUri(back.value)
      if (!back.value.trim()) return set(result)
      if (!parsed) return set(result, errorText('Not a data URI: it starts with data:image/…;base64,'))
      show(back.value.trim(), { name: 'image', size: parsed.bytes, type: parsed.mime })
    })
    set(result, hint('Everything stays on this device: the image is read in the panel, never uploaded.'))
    return {
      node,
      focus: zone,
      fill(value) {
        back.value = value
        back.dispatchEvent(new Event('input'))
      }
    }
  }
}
