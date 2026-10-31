// IPv4 and IPv6 subnets from CIDR notation, or an address with a netmask.

export function parseIPv4(text) {
  const parts = text.split('.')
  if (parts.length !== 4 || !parts.every((p) => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255)) return null
  return parts.reduce((n, p) => n * 256n + BigInt(p), 0n)
}

export function formatIPv4(n) {
  return [24n, 16n, 8n, 0n].map((shift) => (n >> shift) & 255n).join('.')
}

export function parseIPv6(input) {
  let text = input.toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '')
  // An embedded IPv4 tail: ::ffff:192.0.2.1
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text)
  if (v4) {
    const n = parseIPv4(v4[1])
    if (n === null) return null
    text = text.slice(0, -v4[1].length) + `${((n >> 16n) & 0xffffn).toString(16)}:${(n & 0xffffn).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null
  return groups.reduce((n, g) => (n << 16n) | BigInt(parseInt(g, 16)), 0n)
}

/** RFC 5952: lowercase, leading zeros dropped, the longest run of zero groups as ::. */
export function formatIPv6(n) {
  const groups = Array.from({ length: 8 }, (_, i) => Number((n >> BigInt((7 - i) * 16)) & 0xffffn))
  let bestStart = -1
  let bestLength = 1
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++
      continue
    }
    let j = i
    while (j < 8 && groups[j] === 0) j++
    if (j - i > bestLength) [bestStart, bestLength] = [i, j - i]
    i = j
  }
  const hex = groups.map((g) => g.toString(16))
  if (bestStart === -1) return hex.join(':')
  return `${hex.slice(0, bestStart).join(':')}::${hex.slice(bestStart + bestLength).join(':')}`
}

function maskToPrefix(mask, bits) {
  const binary = mask.toString(2).padStart(bits, '0')
  if (!/^1*0*$/.test(binary)) return null
  return binary.indexOf('0') === -1 ? bits : binary.indexOf('0')
}

const V4_RANGES = [
  [0x0a000000n, 8, 'Private (RFC 1918)'], [0xac100000n, 12, 'Private (RFC 1918)'], [0xc0a80000n, 16, 'Private (RFC 1918)'],
  [0x7f000000n, 8, 'Loopback'], [0xa9fe0000n, 16, 'Link-local'], [0x64400000n, 10, 'Carrier-grade NAT'],
  [0xe0000000n, 4, 'Multicast'], [0x00000000n, 8, '“This network”'], [0xc0000200n, 24, 'Documentation (TEST-NET-1)'],
  [0xc6336400n, 24, 'Documentation (TEST-NET-2)'], [0xcb007100n, 24, 'Documentation (TEST-NET-3)'], [0xf0000000n, 4, 'Reserved']
]
const V6_RANGES = [
  ['::1', 128, 'Loopback'], ['fe80::', 10, 'Link-local'], ['fc00::', 7, 'Unique local (private)'],
  ['ff00::', 8, 'Multicast'], ['2001:db8::', 32, 'Documentation'], ['::ffff:0:0', 96, 'IPv4-mapped'], ['2000::', 3, 'Global unicast']
]

function kind(address, version) {
  const bits = version === 4 ? 32 : 128
  const ranges = version === 4 ? V4_RANGES : V6_RANGES.map(([a, p, l]) => [parseIPv6(a), p, l])
  for (const [base, prefix, label] of ranges) {
    const shift = BigInt(bits - prefix)
    if (address >> shift === base >> shift) return label
  }
  return version === 4 ? 'Public' : 'Other'
}

/**
 * Reads "10.0.0.0/8", "192.168.1.10 255.255.255.0", "2001:db8::/48" or a bare address, and
 * returns the subnet: network, broadcast or last address, usable host range, sizes and kind.
 */
export function subnet(input) {
  const text = input.trim()
  if (!text) return null
  const [addressText, suffix] = text.split(/\s*\/\s*|\s+/)
  const v4 = parseIPv4(addressText)
  const version = v4 !== null ? 4 : 6
  const address = v4 ?? parseIPv6(addressText)
  if (address === null || address === undefined) throw new Error('Not an IP address. Try 192.168.1.0/24, 10.0.0.5 255.0.0.0 or 2001:db8::/32.')
  const bits = version === 4 ? 32 : 128
  let prefix = bits
  if (suffix !== undefined && suffix !== '') {
    if (/^\d+$/.test(suffix)) prefix = Number(suffix)
    else {
      const mask = version === 4 ? parseIPv4(suffix) : null
      prefix = mask === null ? null : maskToPrefix(mask, 32)
      if (prefix === null) throw new Error('The netmask must be contiguous ones then zeros, such as 255.255.255.0.')
    }
    if (prefix > bits) throw new Error(`The prefix length is 0 to ${bits} for IPv${version}.`)
  }
  const all = (1n << BigInt(bits)) - 1n
  const hostBits = BigInt(bits - prefix)
  const mask = (all << hostBits) & all
  const network = address & mask
  const last = network | (~mask & all)
  const size = 1n << hostBits
  const format = version === 4 ? formatIPv4 : formatIPv6
  // IPv4 networks lose the network and broadcast addresses, except /31 point-to-point and /32.
  const hostRange = version === 4 && prefix < 31 ? [network + 1n, last - 1n] : [network, last]
  return {
    version,
    prefix,
    address: format(address),
    network: `${format(network)}/${prefix}`,
    netmask: version === 4 ? formatIPv4(mask) : null,
    wildcard: version === 4 ? formatIPv4(~mask & all) : null,
    first: format(hostRange[0]),
    last: format(hostRange[1]),
    broadcast: version === 4 && prefix < 31 ? formatIPv4(last) : null,
    size,
    hosts: hostRange[1] - hostRange[0] + 1n,
    kind: kind(address, version),
    binary: version === 4 ? address.toString(2).padStart(32, '0').match(/.{8}/g).join('.') : null,
    contains(other) {
      const n = version === 4 ? parseIPv4(other.trim()) : parseIPv6(other.trim())
      return n === null || n === undefined ? null : (n & mask) === network
    }
  }
}
