// Vietnamese identifiers: citizen ID (CCCD), tax code (MST) and phone numbers, checked offline.

// Province codes of the 12-digit citizen ID (Circular 07/2016/TT-BCA). IDs keep the code of the
// province of birth registration, so they still use the 63 provinces from before the 2025 merger.
export const PROVINCES = {
  '001': 'Hà Nội', '002': 'Hà Giang', '004': 'Cao Bằng', '006': 'Bắc Kạn', '008': 'Tuyên Quang', '010': 'Lào Cai',
  '011': 'Điện Biên', '012': 'Lai Châu', '014': 'Sơn La', '015': 'Yên Bái', '017': 'Hòa Bình', '019': 'Thái Nguyên',
  '020': 'Lạng Sơn', '022': 'Quảng Ninh', '024': 'Bắc Giang', '025': 'Phú Thọ', '026': 'Vĩnh Phúc', '027': 'Bắc Ninh',
  '030': 'Hải Dương', '031': 'Hải Phòng', '033': 'Hưng Yên', '034': 'Thái Bình', '035': 'Hà Nam', '036': 'Nam Định',
  '037': 'Ninh Bình', '038': 'Thanh Hóa', '040': 'Nghệ An', '042': 'Hà Tĩnh', '044': 'Quảng Bình', '045': 'Quảng Trị',
  '046': 'Thừa Thiên Huế', '048': 'Đà Nẵng', '049': 'Quảng Nam', '051': 'Quảng Ngãi', '052': 'Bình Định', '054': 'Phú Yên',
  '056': 'Khánh Hòa', '058': 'Ninh Thuận', '060': 'Bình Thuận', '062': 'Kon Tum', '064': 'Gia Lai', '066': 'Đắk Lắk',
  '067': 'Đắk Nông', '068': 'Lâm Đồng', '070': 'Bình Phước', '072': 'Tây Ninh', '074': 'Bình Dương', '075': 'Đồng Nai',
  '077': 'Bà Rịa – Vũng Tàu', '079': 'TP. Hồ Chí Minh', '080': 'Long An', '082': 'Tiền Giang', '083': 'Bến Tre',
  '084': 'Trà Vinh', '086': 'Vĩnh Long', '087': 'Đồng Tháp', '089': 'An Giang', '091': 'Kiên Giang', '092': 'Cần Thơ',
  '093': 'Hậu Giang', '094': 'Sóc Trăng', '095': 'Bạc Liêu', '096': 'Cà Mau'
}

// Mobile prefixes as first assigned; numbers can move between networks and keep their prefix.
export const CARRIERS = {
  Viettel: ['032', '033', '034', '035', '036', '037', '038', '039', '086', '096', '097', '098'],
  VinaPhone: ['081', '082', '083', '084', '085', '088', '091', '094'],
  MobiFone: ['070', '076', '077', '078', '079', '089', '090', '093'],
  Vietnamobile: ['052', '056', '058', '092'],
  Gmobile: ['059', '099'],
  'iTel': ['087'],
  'Reddi': ['055']
}
const CARRIER_OF = Object.fromEntries(Object.entries(CARRIERS).flatMap(([name, prefixes]) => prefixes.map((p) => [p, name])))

const MST_WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3]

/** The check digit a 10-digit tax code must end with, or null when the first nine allow none. */
export function mstCheckDigit(nine) {
  const sum = [...nine].reduce((total, d, i) => total + Number(d) * MST_WEIGHTS[i], 0)
  const check = 10 - (sum % 11)
  return check === 10 ? null : check
}

/** 12-digit citizen ID: birth province, sex, century and birth year. */
export function parseCccd(digits, now = new Date()) {
  const province = PROVINCES[digits.slice(0, 3)]
  const code = Number(digits[3])
  const year = 1900 + Math.floor(code / 2) * 100 + Number(digits.slice(4, 6))
  const problems = []
  if (!province) problems.push(`${digits.slice(0, 3)} is not a province code.`)
  if (year > now.getFullYear()) problems.push(`Birth year ${year} is in the future.`)
  return {
    valid: !problems.length,
    province: province ?? 'Unknown',
    sex: code % 2 ? 'Female' : 'Male',
    year,
    serial: digits.slice(6),
    problems
  }
}

/** 10-digit tax code, or 13 digits with a branch (dependent unit) number. */
export function parseMst(text) {
  const digits = text.replace(/[\s.-]/g, '')
  const main = digits.slice(0, 10)
  const expected = mstCheckDigit(main.slice(0, 9))
  const branch = digits.length === 13 ? digits.slice(10) : null
  const problems = []
  if (expected === null) problems.push('No tax code can start with these nine digits (the check digit would be 10).')
  else if (expected !== Number(main[9])) problems.push(`The check digit should be ${expected}, not ${main[9]}.`)
  if (branch === '000') problems.push('Branch numbers run from 001 to 999.')
  return { valid: !problems.length, main, branch, expected, problems, formatted: branch ? `${main}-${branch}` : main }
}

/** Mobile or landline number in national (0…) or international (+84…) form. */
export function parsePhone(text) {
  let digits = text.replace(/[\s().-]/g, '')
  if (/^\+?84/.test(digits)) digits = `0${digits.replace(/^\+?84/, '')}`
  const problems = []
  let type = 'Mobile'
  let carrier = CARRIER_OF[digits.slice(0, 3)]
  if (/^02\d{9}$/.test(digits)) {
    type = 'Landline'
    carrier = null
  } else if (!/^0\d{9}$/.test(digits)) problems.push('Mobile numbers have 10 digits (0 and nine more); landlines have 11 and start with 02.')
  else if (!carrier) problems.push(`${digits.slice(0, 3)} is not a mobile prefix in use.`)
  return {
    valid: !problems.length,
    type,
    carrier: carrier ?? '',
    national: digits,
    international: `+84${digits.slice(1)}`,
    display: type === 'Landline' ? `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}` : `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`,
    problems
  }
}

/**
 * Everything a pasted value could be: a 10-digit number starting 0 can be both a phone number and
 * a tax code, so every reading that fits is returned, valid ones first.
 */
export function analyseVnId(text) {
  const raw = String(text).trim()
  if (!raw) return []
  const digits = raw.replace(/[\s().-]/g, '').replace(/^\+/, '')
  if (!/^\d+$/.test(digits)) throw new Error('Paste a citizen ID, tax code or phone number (digits only).')
  const results = []
  if (/^\+?84/.test(raw.replace(/\s/g, '')) && digits.length === 11) results.push({ kind: 'phone', ...parsePhone(raw) })
  else {
    if (digits.length === 12) results.push({ kind: 'cccd', ...parseCccd(digits) })
    if (digits.length === 12) results.push({ kind: 'mst-personal', valid: true, problems: [] })
    if (digits.length === 10 || digits.length === 13) results.push({ kind: 'mst', ...parseMst(digits) })
    if (/^0/.test(digits) && (digits.length === 10 || digits.length === 11)) results.push({ kind: 'phone', ...parsePhone(digits) })
    if (digits.length === 9) results.push({ kind: 'cmnd', valid: true, problems: [] })
  }
  if (!results.length) throw new Error('A citizen ID has 12 digits, a tax code 10 or 13, a phone number 10 (or +84 and 9).')
  return results.sort((a, b) => Number(b.valid) - Number(a.valid))
}
