import { subnet } from '../tools/cidr.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

const format = (n) => (n < 10n ** 15n ? Number(n).toLocaleString('en-US') : `2^${n.toString(2).length - 1}`)

export default {
  id: 'cidr',
  title: 'Subnet / CIDR',
  group: 'Inspect',
  icon: 'network',
  color: '#06b6d4',
  description: 'Network, host range and mask of an IPv4 or IPv6 CIDR block',
  keywords: ['ip', 'ipv4', 'ipv6', 'subnet', 'netmask', 'mask', 'network', 'cidr', 'range', 'vpc'],
  create() {
    const source = input({ placeholder: '10.0.0.0/16, 192.168.1.10 255.255.255.0 or 2001:db8::/48', class: 'mono' })
    const probe = input({ placeholder: 'Is this address inside? e.g. 10.0.42.7', class: 'mono' })
    const result = h('div', { class: 'result' })
    function update() {
      try {
        const net = subnet(source.value)
        if (!net) return set(result, hint('A bare address is read as a single host (/32 or /128).'))
        const inside = probe.value.trim() ? net.contains(probe.value) : undefined
        set(result,
          rows([
            ['Network', net.network, { text: net.kind }],
            net.netmask ? ['Netmask', net.netmask] : null,
            net.wildcard ? ['Wildcard', net.wildcard] : null,
            ['First host', net.first],
            ['Last host', net.last],
            net.broadcast ? ['Broadcast', net.broadcast] : null,
            ['Hosts', format(net.hosts)],
            net.binary ? ['Binary', net.binary] : null
          ].filter(Boolean)),
          inside === undefined ? null
            : inside === null ? errorText(`“${probe.value.trim()}” is not an IPv${net.version} address.`)
              : rows([[probe.value.trim(), inside ? 'inside' : 'outside', inside ? { text: 'in range', kind: 'ok' } : { text: 'not in range', kind: 'bad' }]]),
          net.version === 4 && net.prefix < 31 ? hint('Hosts exclude the network and broadcast addresses.') : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    probe.addEventListener('input', update)
    source.value = '192.168.1.0/24'
    update()
    return {
      node: h('div', {}, field('Address or block', source), field('Check an address', probe), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
