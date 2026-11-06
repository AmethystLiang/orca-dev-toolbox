// Numbers read out in Vietnamese and English words, as on invoices, cheques and contracts.
// Works on decimal strings with BigInt, so amounts of any size stay exact.

const VI_DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const EN_SCALES = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion',
  'septillion', 'octillion', 'nonillion', 'decillion']
const SUFFIXES = { k: 3, nghìn: 3, ngàn: 3, m: 6, tr: 6, triệu: 6, b: 9, bn: 9, tỷ: 9, tỉ: 9 }

/**
 * Reads "1.234.567", "1,234,567.89", "150k", "1,5 tỷ" or "-2.5m" into { negative, int, frac }
 * digit strings. A single separator followed by exactly three digits is a thousands separator,
 * as Vietnamese amounts are written ("150.000").
 */
export function parseAmount(text) {
  let s = String(text).trim().toLowerCase().replace(/[\s_']/g, '').replace(/(đồng|đ|₫|vnd|dong|usd|\$)$/u, '')
  let negative = false
  if (/^[-−]/.test(s)) {
    negative = true
    s = s.slice(1)
  }
  let shift = 0
  const suffix = s.match(/(k|nghìn|ngàn|m|tr|triệu|bn|b|tỷ|tỉ)$/u)
  if (suffix) {
    shift = SUFFIXES[suffix[1]]
    s = s.slice(0, -suffix[1].length)
  }
  if (!/^\d[\d.,]*$/.test(s) || /[.,]$/.test(s)) throw new Error('Type a number, such as 1250000, 1.250.000, 2,5 or 150k.')
  let int = s
  let frac = ''
  const dots = (s.match(/\./g) ?? []).length
  const commas = (s.match(/,/g) ?? []).length
  if (dots && commas) {
    const decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    const at = s.lastIndexOf(decimal)
    int = s.slice(0, at).replaceAll(decimal === '.' ? ',' : '.', '')
    frac = s.slice(at + 1)
    if (/[.,]/.test(frac) || int.includes(decimal)) throw new Error('The separators do not make a number.')
  } else if (dots + commas === 1) {
    const at = s.search(/[.,]/)
    const after = s.slice(at + 1)
    if (after.length === 3 && !shift) int = s.slice(0, at) + after
    else [int, frac] = [s.slice(0, at), after]
  } else if (dots + commas > 1) {
    const groups = s.split(/[.,]/)
    if (groups.slice(1).some((group) => group.length !== 3)) throw new Error('Thousands separators must split the number into groups of three.')
    int = groups.join('')
  }
  if (shift) {
    const padded = frac.padEnd(shift, '0')
    int += padded.slice(0, shift)
    frac = padded.slice(shift)
  }
  int = int.replace(/^0+(?=\d)/, '')
  frac = frac.replace(/0+$/, '')
  return { negative: negative && /[1-9]/.test(int + frac), int, frac }
}

/** Groups of three digits from the most significant, as numbers. */
function groupsOf(int) {
  const padded = int.padStart(Math.ceil(int.length / 3) * 3, '0')
  return padded.match(/\d{3}/g).map(Number)
}

function viTriple(n, full, linh) {
  const h = Math.floor(n / 100)
  const t = Math.floor(n / 10) % 10
  const u = n % 10
  const words = []
  if (full || h) words.push(VI_DIGITS[h], 'trăm')
  if (t === 0) {
    if (u && (full || h)) words.push(linh ? 'linh' : 'lẻ')
    if (u) words.push(VI_DIGITS[u])
  } else if (t === 1) {
    words.push('mười')
    if (u === 5) words.push('lăm')
    else if (u) words.push(VI_DIGITS[u])
  } else {
    words.push(VI_DIGITS[t], 'mươi')
    if (u === 1) words.push('mốt')
    else if (u === 4) words.push('tư')
    else if (u === 5) words.push('lăm')
    else if (u) words.push(VI_DIGITS[u])
  }
  return words
}

// Vietnamese reads blocks of nine digits, each closed by one more "tỷ": 1 500 000 000 000 is
// "một nghìn năm trăm tỷ", 10^18 is "một tỷ tỷ".
function viInteger(int, linh) {
  if (!/[1-9]/.test(int)) return ['không']
  const width = Math.ceil(int.length / 9) * 9
  const blocks = int.padStart(width, '0').match(/\d{9}/g)
  const words = []
  let started = false
  blocks.forEach((block, b) => {
    if (!/[1-9]/.test(block)) return
    groupsOf(block).forEach((n, i) => {
      if (!n) return
      words.push(...viTriple(n, started, linh), ...[['triệu', 'nghìn', ''][i]].filter(Boolean))
      started = true
    })
    words.push(...Array(blocks.length - 1 - b).fill('tỷ'))
  })
  return words
}

function enTriple(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  const words = []
  if (h) words.push(EN_ONES[h], 'hundred')
  if (rest >= 20) words.push(EN_TENS[Math.floor(rest / 10)] + (rest % 10 ? `-${EN_ONES[rest % 10]}` : ''))
  else if (rest) words.push(EN_ONES[rest])
  return words
}

function enInteger(int) {
  if (!/[1-9]/.test(int)) return ['zero']
  const groups = groupsOf(int)
  if (groups.length > EN_SCALES.length) throw new Error(`English names stop at ${EN_SCALES.at(-1)}; this number is too long.`)
  const words = []
  groups.forEach((n, i) => {
    if (n) words.push(...enTriple(n), EN_SCALES[groups.length - 1 - i])
  })
  return words.filter(Boolean)
}

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * The number in Vietnamese words. Decimals are read as a number after "phẩy" ("ba phẩy mười
 * bốn"), keeping leading zeros. `currency` appends "đồng" and drops decimals.
 */
export function toVietnamese(text, { currency = false, linh = false } = {}) {
  const { negative, int, frac } = parseAmount(text)
  if (int.length > 36) throw new Error('That number is too long to read out.')
  const words = [...(negative ? ['âm'] : []), ...viInteger(int, linh)]
  if (frac && !currency) {
    const zeros = frac.match(/^0*/)[0].length
    words.push('phẩy', ...Array(zeros).fill('không'), ...(zeros < frac.length ? viInteger(frac.slice(zeros), linh) : []))
  }
  if (currency) words.push('đồng')
  return capitalise(words.join(' '))
}

/** The number in English words (US style, no "and"); decimals read digit by digit. */
export function toEnglish(text, { currency = false } = {}) {
  const { negative, int, frac } = parseAmount(text)
  const words = [...(negative ? ['minus'] : []), ...enInteger(int)]
  if (frac && !currency) words.push('point', ...[...frac].map((d) => EN_ONES[d]))
  if (currency) words.push('dong')
  return capitalise(words.join(' '))
}

/** "1.250.000" style grouping of the parsed number, Vietnamese and English. */
export function formatAmount(text) {
  const { negative, int, frac } = parseAmount(text)
  const grouped = (sep) => int.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
  const sign = negative ? '-' : ''
  return { vi: sign + grouped('.') + (frac ? `,${frac}` : ''), en: sign + grouped(',') + (frac ? `.${frac}` : '') }
}
