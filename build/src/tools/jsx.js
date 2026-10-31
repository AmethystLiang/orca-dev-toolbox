// HTML and SVG markup as JSX for React: attribute names, inline styles, void tags, comments and
// braces, with the markup's own layout kept.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

const RENAMED = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', cellpadding: 'cellPadding', cellspacing: 'cellSpacing',
  contenteditable: 'contentEditable', crossorigin: 'crossOrigin', autocomplete: 'autoComplete', autofocus: 'autoFocus',
  autoplay: 'autoPlay', enctype: 'encType', srcset: 'srcSet', srcdoc: 'srcDoc', usemap: 'useMap', frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen', novalidate: 'noValidate', accesskey: 'accessKey', spellcheck: 'spellCheck',
  'http-equiv': 'httpEquiv', 'accept-charset': 'acceptCharset', datetime: 'dateTime', playsinline: 'playsInline',
  inputmode: 'inputMode', formaction: 'formAction', formmethod: 'formMethod', formnovalidate: 'formNoValidate',
  hreflang: 'hrefLang', referrerpolicy: 'referrerPolicy', marginwidth: 'marginWidth', marginheight: 'marginHeight',
  enterkeyhint: 'enterKeyHint', fetchpriority: 'fetchPriority', charset: 'charSet', 'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace', 'xml:lang': 'xmlLang', 'xmlns:xlink': 'xmlnsXlink', viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio', gradientunits: 'gradientUnits', gradienttransform: 'gradientTransform',
  patternunits: 'patternUnits', clippathunits: 'clipPathUnits', markerwidth: 'markerWidth', markerheight: 'markerHeight',
  refx: 'refX', refy: 'refY', stddeviation: 'stdDeviation', textlength: 'textLength', lengthadjust: 'lengthAdjust'
}

// Event names whose second word needs a capital: onmouseover → onMouseOver.
const EVENT_WORDS = ['down', 'up', 'over', 'out', 'enter', 'leave', 'move', 'press', 'start', 'end', 'menu', 'click', 'change', 'select', 'load', 'error', 'play', 'through', 'update', 'drop', 'drag', 'cancel', 'iteration', 'resize']

function eventName(name) {
  let rest = name.slice(2)
  let out = rest[0].toUpperCase()
  rest = rest.slice(1)
  while (rest) {
    const word = EVENT_WORDS.find((w) => rest.startsWith(w) && rest.length >= w.length)
    if (word && out.length > 1) {
      out += word[0].toUpperCase() + word.slice(1)
      rest = rest.slice(word.length)
    } else {
      out += rest[0]
      rest = rest.slice(1)
    }
  }
  return `on${out}`
}

const camel = (name) => name.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase())

function attributeName(raw, tag) {
  const name = raw.toLowerCase()
  if (name.startsWith('data-') || name.startsWith('aria-')) return name
  if (name in RENAMED) return RENAMED[name]
  if (name === 'ondblclick') return 'onDoubleClick'
  if (/^on[a-z]+$/.test(name)) return eventName(name)
  if ((tag === 'input' || tag === 'textarea' || tag === 'select') && name === 'value') return 'defaultValue'
  if (tag === 'input' && name === 'checked') return 'defaultChecked'
  if (name.includes('-') || name.includes(':')) return camel(name)
  return raw.includes('-') ? camel(raw) : raw
}

const UNITLESS = new Set(['zIndex', 'opacity', 'flex', 'flexGrow', 'flexShrink', 'order', 'fontWeight', 'lineHeight', 'zoom', 'gridRow', 'gridColumn', 'tabSize', 'orphans', 'widows'])

/** -webkit-transition → WebkitTransition, -ms-flex → msFlex, font-size → fontSize */
function styleKey(property) {
  let name = property.toLowerCase()
  let capital = false
  if (name.startsWith('-ms-')) name = name.slice(1)
  else if (name.startsWith('-')) {
    name = name.slice(1)
    capital = true
  }
  const key = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  return capital ? key[0].toUpperCase() + key.slice(1) : key
}

/** "color: red; font-size: 12px" → {{ color: 'red', fontSize: '12px' }} */
export function styleObject(css) {
  const entries = []
  for (const declaration of css.split(/;(?![^(]*\))/)) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const property = declaration.slice(0, colon).trim()
    const value = declaration.slice(colon + 1).trim()
    if (!property || !value) continue
    const key = property.startsWith('--') ? `'${property}'` : styleKey(property)
    // Unitless properties take numbers; everything else stays a string, as written.
    const number = /^-?\d+(\.\d+)?$/.test(value) && UNITLESS.has(key) ? value : null
    entries.push(`${key}: ${number ?? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`}`)
  }
  return `{{ ${entries.join(', ')} }}`
}

const TOKEN = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[A-Za-z][\w:.-]*(?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>|[^<]+|</gi
const ATTRIBUTE = /([^\s"'>\/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g

function convertTag(raw) {
  const closing = raw.startsWith('</')
  const name = /^<\/?([A-Za-z][\w:.-]*)/.exec(raw)[1]
  if (closing) return { text: `</${name}>`, name, closing: true }
  const tag = name.toLowerCase()
  const body = raw.slice(name.length + 1).replace(/\/?>$/, '')
  const attributes = []
  for (const [, rawName, rawValue] of body.matchAll(ATTRIBUTE)) {
    const jsxName = attributeName(rawName, tag)
    if (rawValue === undefined) {
      attributes.push(jsxName)
      continue
    }
    const value = rawValue.replace(/^["']|["']$/g, '')
    if (jsxName === 'style') attributes.push(`style=${styleObject(value)}`)
    else if (/^on[A-Z]/.test(jsxName)) attributes.push(`${jsxName}={() => { ${value.trim().replace(/;$/, '')} }}`)
    else attributes.push(`${jsxName}=${value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`}`)
  }
  const selfClosing = raw.endsWith('/>') || VOID.has(tag)
  const attrs = attributes.length ? ` ${attributes.join(' ')}` : ''
  return { text: `<${name}${attrs}${selfClosing ? ' />' : '>'}`, name, selfClosing }
}

/** Converts markup to JSX. Several top-level elements are wrapped in a fragment. */
export function htmlToJsx(html, { component = null } = {}) {
  let out = ''
  let depth = 0
  let roots = 0
  for (const [raw] of html.trim().matchAll(TOKEN)) {
    if (raw === '<') {
      out += "{'<'}"
      continue
    }
    if (/^<!DOCTYPE/i.test(raw)) continue
    if (raw.startsWith('<!--')) {
      out += `{/* ${raw.slice(4, -3).trim().replace(/\*\//g, '* /')} */}`
      continue
    }
    const raw_ = /^<(script|style)\b/i.exec(raw)
    if (raw_) {
      const open = /^<[^>]*>/.exec(raw)[0]
      const close = /<\/[^>]*>$/.exec(raw)[0]
      const inner = raw.slice(open.length, raw.length - close.length)
      if (depth === 0) roots++
      out += `${convertTag(open).text}{\`${inner.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`}${convertTag(close).text}`
      continue
    }
    if (raw.startsWith('<')) {
      const tag = convertTag(raw)
      if (tag.closing) depth--
      else {
        if (depth === 0) roots++
        if (!tag.selfClosing) depth++
      }
      out += tag.text
      continue
    }
    // Text: braces would start expressions in JSX.
    if (depth === 0 && raw.trim()) roots++
    out += raw.replace(/[{}]/g, (c) => `{'${c}'}`)
  }
  let jsx = out.trim()
  if (roots > 1) jsx = `<>\n${indent(jsx, '  ')}\n</>`
  if (!component) return jsx
  return `export default function ${component}() {\n  return (\n${indent(jsx, '    ')}\n  )\n}`
}

function indent(text, pad) {
  return text.split('\n').map((line) => (line ? pad + line : line)).join('\n')
}
