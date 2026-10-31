// Images as data URIs, and data URIs back to their type and size.

/** "data:image/png;base64,iVBOR…" → { mime, base64, bytes } or null when it is not a data URI. */
export function parseDataUri(text) {
  const match = /^data:([\w.+-]+\/[\w.+-]+)?((?:;[\w-]+=[^;,]*)*)(;base64)?,([\s\S]*)$/i.exec(text.trim())
  if (!match) return null
  const mime = match[1] ?? 'text/plain'
  const isBase64 = Boolean(match[3])
  const payload = match[4]
  const bytes = isBase64 ? Math.floor((payload.replace(/[\s=]/g, '').length * 3) / 4) : decodeURIComponent(payload).length
  return { mime, isBase64, payload, bytes }
}

/** Snippets for using a data URI in CSS, HTML and Markdown. */
export function snippets(dataUri, { name = 'image', width, height } = {}) {
  const size = width && height ? ` width="${width}" height="${height}"` : ''
  return [
    ['Data URI', dataUri],
    ['CSS', `background-image: url("${dataUri}");`],
    ['HTML', `<img src="${dataUri}" alt="${name}"${size} />`],
    ['Markdown', `![${name}](${dataUri})`],
    ['Base64 only', dataUri.slice(dataUri.indexOf(',') + 1)]
  ]
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 ** 2).toFixed(2)} MB`
}

/** Base64 is 4 characters for every 3 bytes. */
export const base64Overhead = (bytes) => Math.ceil(bytes / 3) * 4
