import assert from 'node:assert/strict'
import { test } from 'node:test'

import { clean, inspect } from '../../src/tools/chars.js'
import { utf8 } from '../../src/tools/codec.js'

test('character inspector flags hidden, look-alike and decomposed characters', () => {
  const report = inspect('pаypal​.com')
  assert.equal(report.hidden, 1)
  assert.equal(report.lookalikes, 1)
  assert.equal(report.chars[1].code, 'U+0430')
  assert.equal(report.chars[6].name, 'ZERO WIDTH SPACE')
  assert.equal(inspect('Việt'.normalize('NFD')).normalization, 'NFD')
  assert.equal(inspect('Việt').normalization, 'NFC')
  assert.equal(inspect('abc').normalization, 'plain')
  assert.equal(clean('﻿a​b c 👨‍👩‍👧'), 'ab c 👨‍👩‍👧')
  assert.equal(inspect('é').chars[0].utf8, 'C3 A9')
})
