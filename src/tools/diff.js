// Line diff with Myers' algorithm, word highlights inside changed lines, and unified patches.

/**
 * The shortest edit script from a to b as [{ type: 'equal'|'delete'|'insert', a, b }] where a and b
 * are indexes into each side. Returns null when more than maxEdits edits are needed.
 */
export function diffSequences(a, b, maxEdits = 3000) {
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) endA--, endB--
  const middle = myers(a.slice(start, endA), b.slice(start, endB), maxEdits)
  if (!middle) return null
  const ops = []
  for (let i = 0; i < start; i++) ops.push({ type: 'equal', a: i, b: i })
  for (const op of middle) ops.push({ type: op.type, a: op.a === null ? null : op.a + start, b: op.b === null ? null : op.b + start })
  for (let i = 0; i < a.length - endA; i++) ops.push({ type: 'equal', a: endA + i, b: endB + i })
  return ops
}

function myers(a, b, maxEdits) {
  const n = a.length
  const m = b.length
  if (n === 0) return b.map((_, j) => ({ type: 'insert', a: null, b: j }))
  if (m === 0) return a.map((_, i) => ({ type: 'delete', a: i, b: null }))
  const max = n + m
  const offset = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace = []
  for (let d = 0; d <= max; d++) {
    if (d > maxEdits) return null
    trace.push(v.slice(offset - d, offset + d + 1))
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) x++, y++
      v[offset + k] = x
      if (x >= n && y >= m) return backtrack(trace, n, m)
    }
  }
  return null
}

function backtrack(trace, n, m) {
  const ops = []
  let x = n
  let y = m
  for (let d = trace.length - 1; d >= 0; d--) {
    const snapshot = trace[d]
    const get = (k) => snapshot[k + d]
    const k = x - y
    const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1
    const prevX = d === 0 ? 0 : get(prevK)
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      x--, y--
      ops.push({ type: 'equal', a: x, b: y })
    }
    if (d > 0) {
      if (x === prevX) ops.push({ type: 'insert', a: null, b: y - 1 })
      else ops.push({ type: 'delete', a: x - 1, b: null })
      x = prevX
      y = prevY
    }
  }
  return ops.reverse()
}

export function splitLines(text) {
  if (text === '') return []
  return text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
}

/**
 * Diffs two texts by line. Each entry is { type, oldLine, newLine, text, parts? }, line numbers
 * from 1; `parts` marks the changed words when a deleted line pairs with an inserted one.
 */
export function diffLines(oldText, newText, { ignoreWhitespace = false, maxEdits = 3000 } = {}) {
  const left = splitLines(oldText)
  const right = splitLines(newText)
  const ids = new Map()
  const key = (line) => {
    const normal = ignoreWhitespace ? line.trim().replace(/\s+/g, ' ') : line
    if (!ids.has(normal)) ids.set(normal, ids.size)
    return ids.get(normal)
  }
  const ops = diffSequences(left.map(key), right.map(key), maxEdits)
  if (!ops) return null
  const lines = ops.map((op) => ({
    type: op.type,
    oldLine: op.a === null ? null : op.a + 1,
    newLine: op.b === null ? null : op.b + 1,
    text: op.type === 'insert' ? right[op.b] : left[op.a]
  }))
  pairWords(lines)
  return lines
}

const tokenize = (line) => line.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) ?? []

// Within a run of deletions followed by insertions, pairs lines in order and marks changed words.
function pairWords(lines) {
  for (let i = 0; i < lines.length; ) {
    if (lines[i].type !== 'delete') {
      i++
      continue
    }
    let j = i
    while (j < lines.length && lines[j].type === 'delete') j++
    let k = j
    while (k < lines.length && lines[k].type === 'insert') k++
    const pairs = Math.min(j - i, k - j)
    for (let p = 0; p < pairs; p++) {
      const removed = lines[i + p]
      const added = lines[j + p]
      if (removed.text.length > 2000 || added.text.length > 2000) continue
      const a = tokenize(removed.text)
      const b = tokenize(added.text)
      const ops = diffSequences(a, b, 200)
      if (!ops) continue
      const unchanged = ops.filter((op) => op.type === 'equal').reduce((sum, op) => sum + a[op.a].length, 0)
      // Lines with little in common read better as whole-line changes.
      if (unchanged < Math.max(removed.text.length, added.text.length) * 0.3) continue
      removed.parts = merge(ops.filter((op) => op.type !== 'insert').map((op) => [a[op.a], op.type === 'delete']))
      added.parts = merge(ops.filter((op) => op.type !== 'delete').map((op) => [b[op.b], op.type === 'insert']))
    }
    i = k > j ? k : j
  }
}

function merge(parts) {
  const out = []
  for (const [text, changed] of parts) {
    const last = out[out.length - 1]
    if (last && last.changed === changed) last.text += text
    else out.push({ text, changed })
  }
  return out
}

export function summarize(lines) {
  return {
    added: lines.filter((line) => line.type === 'insert').length,
    removed: lines.filter((line) => line.type === 'delete').length
  }
}

/** Runs of unchanged lines longer than 2 × context, to fold in the view. */
export function hunks(lines, context = 3) {
  const changed = lines.map((line, index) => (line.type === 'equal' ? -1 : index)).filter((index) => index >= 0)
  if (!changed.length) return []
  const ranges = []
  for (const index of changed) {
    const from = Math.max(0, index - context)
    const to = Math.min(lines.length - 1, index + context)
    const last = ranges[ranges.length - 1]
    if (last && from <= last.to + 1) last.to = Math.max(last.to, to)
    else ranges.push({ from, to })
  }
  return ranges
}

/** A unified diff, as `git diff` and `patch` read it. */
export function unifiedDiff(lines, { oldName = 'a', newName = 'b', context = 3 } = {}) {
  const ranges = hunks(lines, context)
  if (!ranges.length) return ''
  const out = [`--- ${oldName}`, `+++ ${newName}`]
  for (const { from, to } of ranges) {
    const slice = lines.slice(from, to + 1)
    const oldLines = slice.filter((line) => line.type !== 'insert')
    const newLines = slice.filter((line) => line.type !== 'delete')
    const oldStart = oldLines.length ? oldLines[0].oldLine : startBefore(lines, from, 'oldLine')
    const newStart = newLines.length ? newLines[0].newLine : startBefore(lines, from, 'newLine')
    out.push(`@@ -${oldStart},${oldLines.length} +${newStart},${newLines.length} @@`)
    for (const line of slice) out.push({ equal: ' ', delete: '-', insert: '+' }[line.type] + line.text)
  }
  return out.join('\n') + '\n'
}

function startBefore(lines, index, side) {
  for (let i = index - 1; i >= 0; i--) if (lines[i][side] !== null) return lines[i][side]
  return 0
}
