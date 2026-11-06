import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatAmount, parseAmount, toEnglish, toVietnamese } from '../../src/tools/numwords.js'

test('parses Vietnamese and English number formats and shorthands', () => {
  assert.deepEqual(parseAmount('1.250.000'), { negative: false, int: '1250000', frac: '' })
  assert.deepEqual(parseAmount('1,234,567.89'), { negative: false, int: '1234567', frac: '89' })
  assert.deepEqual(parseAmount('1.234.567,89'), { negative: false, int: '1234567', frac: '89' })
  assert.deepEqual(parseAmount('150.000 đ'), { negative: false, int: '150000', frac: '' })
  assert.deepEqual(parseAmount('2,5'), { negative: false, int: '2', frac: '5' })
  assert.deepEqual(parseAmount('150k'), { negative: false, int: '150000', frac: '' })
  assert.deepEqual(parseAmount('1,5 tỷ'), { negative: false, int: '1500000000', frac: '' })
  assert.deepEqual(parseAmount('2.5m'), { negative: false, int: '2500000', frac: '' })
  assert.deepEqual(parseAmount('-0'), { negative: false, int: '0', frac: '' })
  assert.throws(() => parseAmount('12a'))
  assert.throws(() => parseAmount('1.23.456'))
})

test('reads Vietnamese numbers with the usual spoken forms', () => {
  const cases = {
    0: 'Không',
    5: 'Năm',
    10: 'Mười',
    15: 'Mười lăm',
    21: 'Hai mươi mốt',
    24: 'Hai mươi tư',
    25: 'Hai mươi lăm',
    105: 'Một trăm lẻ năm',
    110: 'Một trăm mười',
    1001: 'Một nghìn không trăm lẻ một',
    1250000: 'Một triệu hai trăm năm mươi nghìn',
    1000005: 'Một triệu không trăm lẻ năm',
    2000000000: 'Hai tỷ',
    1000000000000: 'Một nghìn tỷ',
    1000000000000000: 'Một triệu tỷ',
    5000001000000: 'Năm nghìn tỷ không trăm lẻ một triệu'
  }
  for (const [n, words] of Object.entries(cases)) assert.equal(toVietnamese(n), words, n)
  assert.equal(toVietnamese('1.000.000.000.000.000.000'), 'Một tỷ tỷ')
  assert.equal(toVietnamese('105', { linh: true }), 'Một trăm linh năm')
  assert.equal(toVietnamese('150.000', { currency: true }), 'Một trăm năm mươi nghìn đồng')
  assert.equal(toVietnamese('3,14'), 'Ba phẩy mười bốn')
  assert.equal(toVietnamese('0,05'), 'Không phẩy không năm')
  assert.equal(toVietnamese('-7'), 'Âm bảy')
})

test('reads English numbers', () => {
  assert.equal(toEnglish('0'), 'Zero')
  assert.equal(toEnglish('42'), 'Forty-two')
  assert.equal(toEnglish('1250000'), 'One million two hundred fifty thousand')
  assert.equal(toEnglish('1001'), 'One thousand one')
  assert.equal(toEnglish('3.14'), 'Three point one four')
  assert.equal(toEnglish('150k', { currency: true }), 'One hundred fifty thousand dong')
  assert.equal(toEnglish('-12'), 'Minus twelve')
})

test('groups digits both ways', () => {
  assert.deepEqual(formatAmount('1234567.5'), { vi: '1.234.567,5', en: '1,234,567.5' })
})
