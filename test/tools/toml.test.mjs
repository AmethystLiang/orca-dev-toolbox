import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convert, guessFormat } from '../../src/tools/toml.js'

const CARGO = `[package]
name = "app"
version = "0.1.0"

[dependencies]
serde = { version = "1", features = ["derive"] }

[[bin]]
name = "cli"
path = "src/main.rs"

[meta]
released = 1979-05-27T07:32:00Z
day = 1979-05-27
`

test('TOML to JSON and YAML, and back', () => {
  const json = JSON.parse(convert(CARGO, 'toml', 'json'))
  assert.deepEqual(json.dependencies.serde, { version: '1', features: ['derive'] })
  assert.deepEqual(json.bin, [{ name: 'cli', path: 'src/main.rs' }])
  assert.deepEqual(json.meta, { released: '1979-05-27T07:32:00.000Z', day: '1979-05-27' })
  assert.match(convert(CARGO, 'toml', 'yaml'), /^package:\n {2}name: app\n {2}version: 0\.1\.0\n/)
  const back = convert(JSON.stringify(json), 'json', 'toml')
  assert.match(back, /^\[package\]\nname = "app"/)
  assert.match(back, /\[\[bin\]\]\nname = "cli"/)
  assert.equal(convert('name: app\nports: [80, 443]', 'yaml', 'toml'), 'name = "app"\nports = [ 80, 443 ]\n')
})

test('what TOML cannot hold, and bad input', () => {
  assert.throws(() => convert('{"a": {"b": null}}', 'json', 'toml'), /TOML has no null: a\.b/)
  assert.throws(() => convert('[1, 2]', 'json', 'toml'), /top level must be an object/)
  assert.throws(() => convert('a = ', 'toml', 'json'), /Not valid TOML \(line 1, column 5\)/)
})

test('recognises the input format', () => {
  assert.equal(guessFormat(CARGO), 'toml')
  assert.equal(guessFormat('a = 1\nb = "x"'), 'toml')
  assert.equal(guessFormat('{"a": 1}'), 'json')
  assert.equal(guessFormat('name: app\nreplicas: 2'), 'yaml')
  assert.equal(guessFormat('url: http://x\nquery: a=b'), 'yaml')
})
