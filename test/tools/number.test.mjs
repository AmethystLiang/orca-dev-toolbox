import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bitLength, codePointChar, formatInteger, group, parseInteger, twosComplement } from '../../src/tools/number.js'

test('integers convert between bases of any size', () => {
  assert.deepEqual(parseInteger('0xff'), { value: 255n, radix: 16 })
  assert.deepEqual(parseInteger('ff'), { value: 255n, radix: 16 })
  assert.deepEqual(parseInteger('0b1010_1010'), { value: 170n, radix: 2 })
  assert.deepEqual(parseInteger('1,000,000'), { value: 1000000n, radix: 10 })
  assert.deepEqual(parseInteger('-0o17'), { value: -15n, radix: 8 })
  assert.deepEqual(parseInteger('777', 8), { value: 511n, radix: 8 })
  assert.equal(parseInteger('18446744073709551615').value.toString(16), 'ffffffffffffffff')
  assert.throws(() => parseInteger('102', 2), /binary/)
  assert.equal(formatInteger(-255n, 16), '-0xff')
  assert.equal(group('11110000', 4), '1111 0000')
  assert.equal(group('1000000', 3, ','), '1,000,000')
  assert.equal(bitLength(255n), 8)
  assert.deepEqual(twosComplement(-1n), { width: 8, label: 'Unsigned 8-bit', value: 255n })
  assert.deepEqual(twosComplement(0xffffffffn), { width: 32, label: 'Signed 32-bit', value: -1n })
  assert.equal(twosComplement(100n), null)
  assert.equal(codePointChar(0x1f600n), '😀')
  assert.equal(codePointChar(10n), null)
})
