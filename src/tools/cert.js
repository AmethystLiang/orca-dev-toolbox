// X.509 certificates and PKCS#10 requests (CSRs) from PEM: a small DER reader and the fields
// people check: names, SANs, validity, key, usages and fingerprints.
import { base64ToBytes, toHex } from './codec.js'
import { formatIPv6 } from './cidr.js'
import { sha1, sha256 } from './hash.js'

const OIDS = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST', '2.5.4.10': 'O', '2.5.4.11': 'OU',
  '2.5.4.5': 'serialNumber', '2.5.4.9': 'street', '2.5.4.17': 'postalCode', '2.5.4.42': 'GN', '2.5.4.4': 'SN',
  '1.2.840.113549.1.9.1': 'emailAddress', '0.9.2342.19200300.100.1.25': 'DC', '0.9.2342.19200300.100.1.1': 'UID',
  '1.2.840.113549.1.1.1': 'RSA', '1.2.840.10045.2.1': 'EC', '1.3.101.112': 'Ed25519', '1.3.101.113': 'Ed448',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA', '1.2.840.113549.1.1.11': 'SHA-256 with RSA', '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA', '1.2.840.113549.1.1.10': 'RSA-PSS', '1.2.840.113549.1.1.4': 'MD5 with RSA',
  '1.2.840.10045.4.3.2': 'ECDSA with SHA-256', '1.2.840.10045.4.3.3': 'ECDSA with SHA-384', '1.2.840.10045.4.3.4': 'ECDSA with SHA-512',
  '1.2.840.10045.3.1.7': 'P-256', '1.3.132.0.34': 'P-384', '1.3.132.0.35': 'P-521', '1.3.132.0.10': 'secp256k1',
  '1.3.6.1.5.5.7.3.1': 'TLS server', '1.3.6.1.5.5.7.3.2': 'TLS client', '1.3.6.1.5.5.7.3.3': 'Code signing',
  '1.3.6.1.5.5.7.3.4': 'Email', '1.3.6.1.5.5.7.3.8': 'Time stamping', '1.3.6.1.5.5.7.3.9': 'OCSP signing'
}

const EXT = {
  SAN: '2.5.29.17', BASIC: '2.5.29.19', KEY_USAGE: '2.5.29.15', EXT_KEY_USAGE: '2.5.29.37', SKI: '2.5.29.14', AKI: '2.5.29.35'
}
const KEY_USAGES = ['Digital signature', 'Non-repudiation', 'Key encipherment', 'Data encipherment', 'Key agreement', 'Certificate signing', 'CRL signing', 'Encipher only', 'Decipher only']

/** DER elements between start and end: [{ tag, constructed, content, children? }] */
export function readDer(bytes, start = 0, end = bytes.length) {
  const nodes = []
  let i = start
  while (i < end) {
    const tag = bytes[i++]
    if (i >= end) throw new Error('Truncated DER.')
    let length = bytes[i++]
    if (length & 0x80) {
      const count = length & 0x7f
      if (count === 0 || count > 4) throw new Error('Unsupported DER length.')
      length = 0
      for (let k = 0; k < count; k++) length = length * 256 + bytes[i++]
    }
    if (i + length > end) throw new Error('A DER element runs past its parent.')
    const node = { tag, constructed: Boolean(tag & 0x20), content: bytes.subarray(i, i + length) }
    if (node.constructed) node.children = readDer(bytes, i, i + length)
    nodes.push(node)
    i += length
  }
  return nodes
}

function oid(content) {
  const parts = [Math.floor(content[0] / 40), content[0] % 40]
  let value = 0
  for (let i = 1; i < content.length; i++) {
    value = value * 128 + (content[i] & 0x7f)
    if (!(content[i] & 0x80)) {
      parts.push(value)
      value = 0
    }
  }
  if (content[0] >= 80) [parts[0], parts[1]] = [2, content[0] - 80]
  return parts.join('.')
}

const decoder = new TextDecoder()
function text(node) {
  if (node.tag === 0x1e) {
    // BMPString: UTF-16BE
    let out = ''
    for (let i = 0; i + 1 < node.content.length; i += 2) out += String.fromCharCode((node.content[i] << 8) | node.content[i + 1])
    return out
  }
  return decoder.decode(node.content)
}

function time(node) {
  const s = text(node)
  const m = node.tag === 0x17
    ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s)
    : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:\.\d+)?Z$/.exec(s)
  if (!m) return null
  let year = Number(m[1])
  if (node.tag === 0x17) year += year < 50 ? 2000 : 1900
  return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)))
}

/** A Name as [[short name, value]] in order, and as a one-line string. */
function name(node) {
  const parts = []
  for (const set of node.children ?? []) {
    for (const attr of set.children ?? []) {
      const [type, value] = attr.children
      const id = oid(type.content)
      parts.push([OIDS[id] ?? id, text(value)])
    }
  }
  return { parts, text: parts.map(([k, v]) => `${k}=${v}`).join(', '), cn: parts.find(([k]) => k === 'CN')?.[1] ?? null }
}

function integerBits(content) {
  let i = 0
  while (i < content.length - 1 && content[i] === 0) i++
  const first = content[i]
  return (content.length - i - 1) * 8 + (first ? Math.floor(Math.log2(first)) + 1 : 0)
}

function publicKey(spki) {
  const [algorithm, bits] = spki.children
  const algId = oid(algorithm.children[0].content)
  const kind = OIDS[algId] ?? algId
  if (kind === 'RSA') {
    const key = readDer(bits.content.subarray(1))[0]
    return { kind, size: integerBits(key.children[0].content), label: `RSA ${integerBits(key.children[0].content)}-bit` }
  }
  if (kind === 'EC') {
    const curve = algorithm.children[1]?.tag === 0x06 ? OIDS[oid(algorithm.children[1].content)] ?? oid(algorithm.children[1].content) : 'unknown curve'
    return { kind, curve, label: `EC ${curve}` }
  }
  return { kind, label: kind }
}

function ip(bytes) {
  if (bytes.length === 4) return [...bytes].join('.')
  return formatIPv6([...bytes].reduce((n, b) => (n << 8n) | BigInt(b), 0n))
}

function extensions(list) {
  const out = { san: [], ca: null, pathLength: null, keyUsage: [], extKeyUsage: [], other: [] }
  for (const ext of list) {
    const id = oid(ext.children[0].content)
    const value = ext.children[ext.children.length - 1].content
    const inner = readDer(value)[0]
    if (id === EXT.SAN) {
      for (const general of inner.children ?? []) {
        const kind = general.tag & 0x1f
        if (kind === 2) out.san.push(`DNS:${decoder.decode(general.content)}`)
        else if (kind === 7) out.san.push(`IP:${ip(general.content)}`)
        else if (kind === 1) out.san.push(`email:${decoder.decode(general.content)}`)
        else if (kind === 6) out.san.push(`URI:${decoder.decode(general.content)}`)
      }
    } else if (id === EXT.BASIC) {
      out.ca = false
      for (const child of inner.children ?? []) {
        if (child.tag === 0x01) out.ca = child.content[0] !== 0
        if (child.tag === 0x02) out.pathLength = child.content.reduce((n, b) => n * 256 + b, 0)
      }
    } else if (id === EXT.KEY_USAGE) {
      const unused = inner.content[0]
      const bits = inner.content.subarray(1)
      KEY_USAGES.forEach((label, bit) => {
        const byte = bits[bit >> 3]
        if (byte !== undefined && byte & (0x80 >> (bit & 7)) && !(bit >= bits.length * 8 - unused)) out.keyUsage.push(label)
      })
    } else if (id === EXT.EXT_KEY_USAGE) {
      for (const child of inner.children ?? []) out.extKeyUsage.push(OIDS[oid(child.content)] ?? oid(child.content))
    } else out.other.push(id)
  }
  return out
}

const colons = (bytes) => toHex(bytes, ':').toUpperCase()

function certificate(der, now) {
  const [cert] = readDer(der)
  const [tbs, signatureAlgorithm] = cert.children
  let i = 0
  const fields = tbs.children
  let version = 1
  if (fields[0].tag === 0xa0) {
    version = fields[0].children[0].content[0] + 1
    i++
  }
  const serial = fields[i++]
  i++ // signature algorithm inside TBS repeats the outer one
  const issuer = name(fields[i++])
  const validity = fields[i++]
  const subject = name(fields[i++])
  const key = publicKey(fields[i++])
  const extList = fields.slice(i).find((f) => f.tag === 0xa3)?.children[0].children ?? []
  const ext = extensions(extList)
  const notBefore = time(validity.children[0])
  const notAfter = time(validity.children[1])
  const daysLeft = Math.floor((notAfter - now) / 864e5)
  return {
    type: 'certificate',
    version,
    serial: colons(serial.content[0] === 0 && serial.content.length > 1 ? serial.content.subarray(1) : serial.content),
    subject,
    issuer,
    selfSigned: subject.text === issuer.text,
    notBefore,
    notAfter,
    daysLeft,
    status: now < notBefore ? 'not yet valid' : now > notAfter ? 'expired' : daysLeft < 30 ? 'expires soon' : 'valid',
    key,
    signature: OIDS[oid(signatureAlgorithm.children[0].content)] ?? oid(signatureAlgorithm.children[0].content),
    ...ext,
    sha256: colons(sha256(der)),
    sha1: colons(sha1(der))
  }
}

function request(der) {
  const [csr] = readDer(der)
  const [info, signatureAlgorithm] = csr.children
  const subject = name(info.children[1])
  const key = publicKey(info.children[2])
  let ext = extensions([])
  const attributes = info.children.find((child) => child.tag === 0xa0)
  for (const attr of attributes?.children ?? []) {
    if (oid(attr.children[0].content) === '1.2.840.113549.1.9.14') ext = extensions(attr.children[1].children[0].children)
  }
  return { type: 'request', subject, key, signature: OIDS[oid(signatureAlgorithm.children[0].content)] ?? oid(signatureAlgorithm.children[0].content), ...ext }
}

const PEM = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g

/** Every certificate and request in the text, in order. Private keys are refused, not read. */
export function decodePem(input, now = Date.now()) {
  const text = input.trim()
  if (!text) return null
  const blocks = [...text.matchAll(PEM)]
  if (!blocks.length) {
    // Base64 without the BEGIN/END lines, as some consoles show it.
    if (/^MII[A-Za-z0-9+/=\s]+$/.test(text)) {
      try {
        return [certificate(base64ToBytes(text), now)]
      } catch {
        // fall through to the hint below
      }
    }
    throw new Error('Paste a PEM block: -----BEGIN CERTIFICATE----- … -----END CERTIFICATE-----')
  }
  return blocks.map(([, label, body]) => {
    if (/PRIVATE KEY/.test(label)) throw new Error('That is a private key. Keep it out of tools and chats; only certificates and CSRs are read here.')
    let der
    try {
      der = base64ToBytes(body.replace(/^[\w-]+:.*$/gm, ''))
    } catch {
      throw new Error(`The ${label} block is not valid Base64.`)
    }
    try {
      if (label === 'CERTIFICATE' || label === 'TRUSTED CERTIFICATE' || label === 'X509 CERTIFICATE') return certificate(der, now)
      if (/CERTIFICATE REQUEST/.test(label)) return request(der)
    } catch (error) {
      throw new Error(`The ${label} could not be read: ${error.message}`)
    }
    throw new Error(`${label} blocks are not supported; paste a CERTIFICATE or CERTIFICATE REQUEST.`)
  })
}
