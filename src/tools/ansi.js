// Terminal output to plain text: colour and cursor escape codes out, progress-bar redraws
// (carriage returns) and backspaces applied the way the terminal showed them.

const ESC = '\u001b'
// CSI (colours, cursor moves, erase), OSC (titles, hyperlinks) and the short two-byte escapes.
const CSI = /\u001b\[[0-?]*[ -/]*[@-~]|\u009b[0-?]*[ -/]*[@-~]/g
const OSC = /\u001b\][\s\S]*?(\u0007|\u001b\\|\u009c)/g
const OTHER = /\u001b[PX^_][\s\S]*?\u001b\\|\u001b[@-Z\\-_]|\u001b[()#][0-9A-Za-z]/g
// Escapes copied as text out of logs and source code: \x1b[31m, \033[0m, \u001b[1m, \e[0m, ^[[0m.
const WRITTEN = /\\(x1b|x1B|033|u001b|u001B|e)\[|\^\[\[/g

/** Whether text holds escape codes, real or written out. */
export function hasAnsi(text) {
  return text.includes(ESC) || text.includes('\u009b') || /\\(x1b|x1B|033|u001b|u001B|e)\[[0-9;]*m|\^\[\[[0-9;]*m/.test(text)
}

// A line as the terminal last drew it: each \r returns to the start of the line and the text
// after it overwrites what was there; \b steps back one character.
function redraw(line) {
  const cells = []
  let column = 0
  for (const char of line) {
    if (char === '\r') column = 0
    else if (char === '\b') column = Math.max(0, column - 1)
    else {
      cells[column] = char
      column++
    }
  }
  return cells.join('')
}

/**
 * Plain text from terminal output. Options: `redraw` applies \r and \b, `trim` drops trailing
 * spaces, `squeeze` folds runs of blank lines into one.
 */
export function stripAnsi(text, { redraw: applyRedraw = true, trim = true, squeeze = false } = {}) {
  let removed = 0
  const count = () => {
    removed++
    return ''
  }
  // OSC 8 hyperlinks keep their visible text: only the escapes around it go.
  const value = String(text).replace(WRITTEN, `${ESC}[`).replace(OSC, count).replace(CSI, count).replace(OTHER, count)
  // Windows line endings are not redraws.
  let redrawn = 0
  let lines = value.replace(/\r\n/g, '\n').split('\n').map((line) => {
    if (!applyRedraw || !/[\r\b]/.test(line)) return line
    redrawn++
    return redraw(line)
  })
  if (trim) lines = lines.map((line) => line.replace(/[ \t]+$/, ''))
  if (squeeze) lines = lines.filter((line, i) => line.trim() || (i > 0 && lines[i - 1].trim()))
  return { text: lines.join('\n'), removed, redrawn }
}
