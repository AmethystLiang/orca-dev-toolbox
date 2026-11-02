import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseTime, timeRows, zoneString } from '../../src/tools/time.js'

test('timestamps: units from length, dates, and the rows shown', () => {
  assert.deepEqual(parseTime('1730000000').unit, 'seconds')
  assert.equal(parseTime('1730000000').date.toISOString(), '2024-10-27T03:33:20.000Z')
  assert.equal(parseTime('1730000000123').unit, 'milliseconds')
  assert.equal(parseTime('1730000000123456').unit, 'microseconds')
  assert.equal(parseTime('2026-10-31T09:00:00Z').date.getTime(), Date.UTC(2026, 9, 31, 9))
  assert.equal(parseTime('   '), null)
  assert.throws(() => parseTime('yesterday-ish'), /Not a timestamp/)
  const rows = Object.fromEntries(timeRows(new Date(Date.UTC(2026, 9, 31, 9)), Date.UTC(2026, 9, 31, 10)))
  assert.equal(rows['Unix seconds'], String(Date.UTC(2026, 9, 31, 9) / 1000))
  assert.equal(rows.Relative, '1 hour ago')
})

test('times in other zones', () => {
  assert.equal(zoneString(new Date('2026-10-31T09:05:09Z'), 'Asia/Kolkata'), '2026-10-31 14:35:09 GMT+05:30')
  assert.equal(zoneString(new Date('2026-10-31T09:05:09Z'), 'UTC'), '2026-10-31 09:05:09 GMT+00:00')
})
