import assert from 'node:assert/strict'
import { test } from 'node:test'

import { analyseVnId, mstCheckDigit, parseCccd, parseMst, parsePhone, PROVINCES } from '../../src/tools/vnid.js'

test('citizen ID fields', () => {
  assert.equal(Object.keys(PROVINCES).length, 63)
  const id = parseCccd('079303001234', new Date('2026-01-01'))
  assert.deepEqual([id.valid, id.province, id.sex, id.year], [true, 'TP. Hồ Chí Minh', 'Female', 2003])
  assert.deepEqual([parseCccd('001095000001').sex, parseCccd('001095000001').year], ['Male', 1995])
  assert.equal(parseCccd('003095000001').valid, false)
  assert.equal(parseCccd('001299000001', new Date('2026-01-01')).valid, false)
})

test('tax code check digit', () => {
  // Viettel Group's published tax code.
  assert.equal(mstCheckDigit('010010910'), 6)
  assert.equal(parseMst('0100109106').valid, true)
  assert.equal(parseMst('0100109107').valid, false)
  assert.match(parseMst('0100109107').problems[0], /should be 6/)
  assert.deepEqual([parseMst('0100109106-001').valid, parseMst('0100109106-001').formatted], [true, '0100109106-001'])
  assert.equal(parseMst('0100109106000').valid, false)
})

test('phone numbers', () => {
  assert.deepEqual([parsePhone('0987 654 321').carrier, parsePhone('0987654321').international], ['Viettel', '+84987654321'])
  assert.deepEqual([parsePhone('+84 91 234 5678').valid, parsePhone('+84 91 234 5678').carrier, parsePhone('+84 91 234 5678').national], [true, 'VinaPhone', '0912345678'])
  assert.equal(parsePhone('0701234567').carrier, 'MobiFone')
  assert.equal(parsePhone('02838123456').type, 'Landline')
  assert.equal(parsePhone('0101234567').valid, false)
  assert.equal(parsePhone('098765432').valid, false)
})

test('every reading of a pasted value, valid first', () => {
  assert.deepEqual(analyseVnId('079203001234').map((r) => r.kind), ['cccd', 'mst-personal'])
  assert.deepEqual(analyseVnId('0100109106').map((r) => [r.kind, r.valid]), [['mst', true], ['phone', false]])
  assert.deepEqual(analyseVnId('0987654321').map((r) => [r.kind, r.valid]), [['phone', true], ['mst', false]])
  assert.deepEqual(analyseVnId('+84987654321').map((r) => r.kind), ['phone'])
  assert.throws(() => analyseVnId('12ab'))
  assert.throws(() => analyseVnId('12345'))
})
