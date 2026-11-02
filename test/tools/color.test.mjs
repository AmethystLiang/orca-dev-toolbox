import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BLACK, contrast, contrastLevel, parseColor, toHex, toHsl, toOklch, toRgb, WHITE } from '../../src/tools/color.js'
import { hex } from '../../src/tools/hash.js'

test('colours convert between hex, rgb, hsl and oklch', () => {
  const blue = parseColor('#3b82f6')
  assert.equal(toRgb(blue), 'rgb(59, 130, 246)')
  assert.equal(toHsl(blue), 'hsl(217, 91%, 60%)')
  assert.equal(toOklch(blue), 'oklch(62.3% 0.188 259.8)')
  assert.equal(toHex(parseColor('rgb(59 130 246)')), '#3b82f6')
  assert.equal(toHex(parseColor('rgba(59, 130, 246, 0.5)')), '#3b82f680')
  assert.equal(toHex(parseColor('hsl(217deg 91% 60%)')), '#3c83f6')
  assert.equal(toHex(parseColor('oklch(62.3% 0.188 259.8)')), '#3b82f6')
  assert.equal(toHex(parseColor('#fff')), '#ffffff')
  assert.equal(toHex(parseColor('f00a')), '#ff0000aa')
  assert.equal(parseColor('oklch(70% 0.4 150)').outOfGamut, true)
  assert.equal(toOklch(parseColor('#808080')), 'oklch(59.987% 0 0)'.replace('59.987', '60'))
  assert.equal(Math.round(contrast(WHITE, BLACK)), 21)
  assert.equal(contrastLevel(contrast(parseColor('#767676'), WHITE)), 'AA')
  assert.throws(() => parseColor('blue-ish'), /Not a colour/)
  assert.equal(parseColor('  '), null)
})
