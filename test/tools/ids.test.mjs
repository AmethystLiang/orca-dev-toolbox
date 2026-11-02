import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hex } from '../../src/tools/hash.js'
import { generatePassword, randomString, strength, ulid, ulidTime, uuidv4, uuidv7, uuidv7Time } from '../../src/tools/ids.js'

test('UUIDs and random strings', () => {
  assert.match(uuidv4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  const time = Date.UTC(2026, 9, 31, 9, 15)
  const v7 = uuidv7(time)
  assert.match(v7, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(uuidv7Time(v7).getTime(), time)
  assert.ok(uuidv7(time) < uuidv7(time + 1))
  assert.equal(uuidv7Time(uuidv4()), null)
  assert.match(randomString(32, 'hex'), /^[0-9a-f]{32}$/)
  assert.equal(randomString(50).length, 50)
})

test('ULID encodes and reads its timestamp', () => {
  assert.equal(ulid(1469918176385, new Uint8Array(10)), '01ARYZ6S410000000000000000')
  assert.equal(ulidTime('01ARYZ6S41TSV4RRFFQ69G5FAV').getTime(), 1469918176385)
})

test('passwords include every chosen set', () => {
  for (let i = 0; i < 50; i++) {
    const { password } = generatePassword({ length: 8, avoidAmbiguous: true })
    assert.equal(password.length, 8)
    assert.match(password, /[a-z]/)
    assert.match(password, /[A-Z]/)
    assert.match(password, /\d/)
    assert.match(password, /[^A-Za-z0-9]/)
    assert.doesNotMatch(password, /[Il1O0o]/)
  }
  assert.match(generatePassword({ length: 12, upper: false, symbols: false }).password, /^[a-z0-9]{12}$/)
  assert.equal(generatePassword({ length: 16, symbols: false }).entropy, 95)
  assert.equal(strength(95).label, 'strong')
})
