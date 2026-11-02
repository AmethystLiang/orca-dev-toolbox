import assert from 'node:assert/strict'
import { test } from 'node:test'

import { describeCron, nextRuns } from '../../src/tools/cron.js'

test('cron descriptions and next runs', () => {
  assert.equal(describeCron('0 9 * * 1-5'), 'At 09:00, on Monday through Friday')
  assert.equal(describeCron('*/15 * * * *'), 'Every 15 minutes')
  assert.equal(describeCron('@hourly'), 'Every hour, on the hour')
  assert.equal(describeCron('30 8,12,18 * * *'), 'At 08:30, 12:30 and 18:30')
  assert.equal(describeCron('0 0 1 JAN,JUL *'), 'At 00:00, on day 1 of the month, in January and July')
  assert.equal(describeCron('0 12 * * SUN'), 'At 12:00, on Sunday')
  assert.equal(describeCron('0 12 * * 7'), 'At 12:00, on Sunday')
  assert.throws(() => describeCron('* * * *'), /five fields/)
  assert.throws(() => describeCron('61 * * * *'), /minute must be 0–59/)
  assert.throws(() => describeCron('0 0 * * * *'), /Six fields/)

  const from = new Date(2026, 9, 31, 16, 7) // Saturday 31 October 2026, local time
  const weekday = nextRuns('0 9 * * 1-5', from, 3).map((d) => [d.getDate(), d.getHours(), d.getMinutes()])
  assert.deepEqual(weekday, [[2, 9, 0], [3, 9, 0], [4, 9, 0]])
  const quarter = nextRuns('*/15 * * * *', from, 2).map((d) => d.getMinutes())
  assert.deepEqual(quarter, [15, 30])
  // Both day fields restricted: either matches (the 1st, or any Friday).
  const either = nextRuns('0 0 1 * 5', from, 3).map((d) => [d.getMonth(), d.getDate()])
  assert.deepEqual(either, [[10, 1], [10, 6], [10, 13]])
  const leap = nextRuns('0 0 29 2 *', from, 1)[0]
  assert.equal(leap.getFullYear(), 2028)
})
