import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatIPv6, parseIPv6, subnet } from '../../src/tools/cidr.js'

test('subnets for IPv4 and IPv6', () => {
  const v4 = subnet('192.168.1.130/26')
  assert.deepEqual([v4.network, v4.netmask, v4.first, v4.last, v4.broadcast, v4.hosts, v4.kind], ['192.168.1.128/26', '255.255.255.192', '192.168.1.129', '192.168.1.190', '192.168.1.191', 62n, 'Private (RFC 1918)'])
  assert.equal(subnet('10.1.2.3 255.255.0.0').network, '10.1.0.0/16')
  assert.equal(subnet('8.8.8.8').kind, 'Public')
  assert.equal(subnet('10.0.0.0/31').hosts, 2n)
  assert.equal(subnet('10.0.0.0/8').contains('10.200.0.1'), true)
  assert.equal(subnet('10.0.0.0/8').contains('11.0.0.1'), false)
  const v6 = subnet('2001:DB8:0:0:1::1/64')
  assert.deepEqual([v6.network, v6.first, v6.last, v6.kind], ['2001:db8::/64', '2001:db8::', '2001:db8::ffff:ffff:ffff:ffff', 'Documentation'])
  assert.equal(formatIPv6(parseIPv6('::ffff:192.0.2.1')), '::ffff:c000:201')
  assert.equal(formatIPv6(parseIPv6('2001:db8:0:1:0:0:0:1')), '2001:db8:0:1::1')
  assert.throws(() => subnet('300.1.1.1/8'), /Not an IP/)
  assert.throws(() => subnet('10.0.0.0 255.0.255.0'), /contiguous/)
  assert.throws(() => subnet('10.0.0.0/33'), /0 to 32/)
})
