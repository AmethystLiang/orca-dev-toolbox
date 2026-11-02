// Unix permission modes: octal (755, 4755) and symbolic (rwxr-xr-x, -rwsr-xr-x).

export const CLASSES = ['Owner', 'Group', 'Others']
export const PERMS = ['Read', 'Write', 'Execute']
export const SPECIAL = [
  ['setuid', 0o4000, 'Runs as the file’s owner'],
  ['setgid', 0o2000, 'Runs as the file’s group; new files in a directory inherit it'],
  ['sticky', 0o1000, 'In a directory, only owners may delete their files']
]

const SYMBOLIC = /^[-dlbcpsD]?([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])$/

/** The mode as a number up to 0o7777, or null for empty text. */
export function parseMode(input) {
  const text = input.trim().replace(/^chmod\s+/, '')
  if (!text) return null
  if (/^0?[0-7]{3,4}$/.test(text)) return parseInt(text, 8) & 0o7777
  const match = SYMBOLIC.exec(text)
  if (!match) throw new Error('Not a mode. Try 755, 0644, 4755 or rwxr-xr-x.')
  let mode = 0
  const triads = match.slice(1)
  triads.forEach((triad, index) => {
    const shift = (2 - index) * 3
    if (triad[0] === 'r') mode |= 4 << shift
    if (triad[1] === 'w') mode |= 2 << shift
    const x = triad[2]
    if ('xst'.includes(x)) mode |= 1 << shift
    if (x === 's' || x === 'S') mode |= index === 0 ? 0o4000 : 0o2000
    if (x === 't' || x === 'T') mode |= 0o1000
  })
  return mode
}

export function toOctal(mode) {
  return (mode > 0o777 ? mode.toString(8).padStart(4, '0') : mode.toString(8).padStart(3, '0'))
}

export function toSymbolic(mode) {
  return [0, 1, 2].map((index) => {
    const shift = (2 - index) * 3
    const bits = (mode >> shift) & 7
    const execute = bits & 1
    let x = execute ? 'x' : '-'
    const special = [0o4000, 0o2000, 0o1000][index]
    if (mode & special) x = index === 2 ? (execute ? 't' : 'T') : execute ? 's' : 'S'
    return (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + x
  }).join('')
}

export function has(mode, classIndex, permIndex) {
  return Boolean(mode & (1 << ((2 - classIndex) * 3 + (2 - permIndex))))
}

export function toggle(mode, classIndex, permIndex, on) {
  const bit = 1 << ((2 - classIndex) * 3 + (2 - permIndex))
  return on ? mode | bit : mode & ~bit
}

/** "Owner can read and write; group and others can read." */
export function describeMode(mode) {
  const phrases = CLASSES.map((name, index) => {
    const can = PERMS.filter((_, perm) => has(mode, index, perm)).map((perm) => perm.toLowerCase())
    return [name.toLowerCase(), can.length ? `can ${list(can)}` : 'have no access']
  })
  // Merge classes that read the same: "group and others can read".
  const merged = []
  for (const [who, what] of phrases) {
    const last = merged[merged.length - 1]
    if (last && last.what === what) last.who.push(who)
    else merged.push({ who: [who], what })
  }
  const sentence = merged
    .map(({ who, what }) => `${list(who)} ${who.length === 1 && who[0] === 'owner' ? what.replace('have no', 'has no') : what}`)
    .join('; ')
  return sentence[0].toUpperCase() + sentence.slice(1) + '.'
}

function list(words) {
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}
