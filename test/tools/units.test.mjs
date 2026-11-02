import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatSize, humanDuration, isoDuration, parseDuration, parseSize } from '../../src/tools/units.js'

test('sizes and durations', () => {
  assert.equal(parseSize('1.5 GB'), 1.5e9)
  assert.equal(parseSize('512MiB'), 512 * 1024 ** 2)
  assert.equal(parseSize('2g'), 2 * 1024 ** 3)
  assert.equal(formatSize(1536), '1.54 KB')
  assert.equal(formatSize(1536, true), '1.5 KiB')
  assert.throws(() => parseSize('3 parsecs'), /Unknown unit/)
  assert.equal(parseDuration('1h30m'), 5400e3)
  assert.equal(parseDuration('1d 2h 3m 4s'), 93784e3)
  assert.equal(parseDuration('01:30:00'), 5400e3)
  assert.equal(parseDuration('PT1H30M'), 5400e3)
  assert.equal(parseDuration('90', 's'), 90e3)
  assert.equal(parseDuration('2 hours and 15 minutes'), 8100e3)
  assert.equal(humanDuration(93784250), '1d 2h 3m 4s 250ms')
  assert.equal(isoDuration(93784e3), 'P1DT2H3M4S')
  assert.equal(isoDuration(0), 'PT0S')
  assert.throws(() => parseDuration('soon'), /Not a duration/)
})
