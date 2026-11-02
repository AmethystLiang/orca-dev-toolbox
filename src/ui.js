// Small DOM helpers shared by the tools.

/** h('div', { class: 'x', onclick }, child, 'text', [more]) */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else if (key === 'class') node.className = value
    else if (value === true) node.setAttribute(key, '')
    else node.setAttribute(key, String(value))
  }
  append(node, children)
  return node
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
}

export function set(node, ...children) {
  node.replaceChildren()
  append(node, children)
  return node
}

// Why both: the frame may lack clipboard-write permission, where writeText rejects; a selected
// textarea and execCommand still copy on a click.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = h('textarea', { class: 'offscreen', readonly: true, 'aria-hidden': 'true' })
    area.value = text
    document.body.append(area)
    area.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }
    area.remove()
    return copied
  }
}

/** A Copy button for whatever `get()` returns at click time. */
export function copyButton(get, label = 'Copy', text = 'Copy') {
  const button = h('button', { type: 'button', class: 'copy', title: label, 'aria-label': label }, text)
  button.addEventListener('click', async () => {
    const value = get()
    if (!value) return
    const ok = await copyText(value)
    button.textContent = ok ? 'Copied' : 'Select ⌘C'
    button.classList.toggle('done', ok)
    setTimeout(() => {
      button.textContent = text
      button.classList.remove('done')
    }, 1200)
  })
  return button
}

export function field(label, control, extra = null) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label, extra), control)
}

export function textarea(attrs = {}) {
  return h('textarea', { spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', rows: 4, ...attrs })
}

export function input(attrs = {}) {
  return h('input', { type: 'text', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', ...attrs })
}

/** Segmented buttons; calls onChange(value) and returns { node, get, set }. */
export function segmented(options, initial, onChange, label) {
  let current = initial
  const buttons = options.map(([value, text]) =>
    h('button', { type: 'button', 'data-value': value, 'aria-pressed': String(value === initial), onclick: () => choose(value) }, text)
  )
  function choose(value) {
    current = value
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.value === value))
    onChange(value)
  }
  return { node: h('div', { class: 'segmented', role: 'group', 'aria-label': label }, buttons), get: () => current, set: choose }
}

export function checkbox(label, onChange, checked = false) {
  const box = h('input', { type: 'checkbox', checked, onchange: () => onChange(box.checked) })
  return { node: h('label', { class: 'check' }, box, label), get: () => box.checked }
}

/** An output block: a title, a Copy button and monospace text. */
export function output(title) {
  const body = h('pre', { class: 'out' })
  const node = h('div', { class: 'block' }, h('div', { class: 'block-head' }, h('span', {}, title), copyButton(() => body.textContent)), body)
  return { node, set: (text) => (body.textContent = text), body }
}

/** Rows of label / value, each value copyable. */
export function rows(entries) {
  return h('div', { class: 'rows' }, entries.map(([label, value, note]) =>
    h('div', { class: 'row' },
      h('span', { class: 'row-label' }, label),
      h('span', { class: 'row-value' }, value, note ? h('span', { class: `badge ${note.kind ?? ''}` }, note.text) : null),
      copyButton(() => value, `Copy ${label}`))
  ))
}

export function errorText(message) {
  return h('p', { class: 'error', role: 'alert' }, message)
}

export function hint(...text) {
  return h('p', { class: 'hint' }, ...text)
}
