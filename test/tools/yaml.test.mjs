import assert from 'node:assert/strict'
import { test } from 'node:test'

import { jsonToYaml, parseYaml, yamlToJson } from '../../src/tools/yaml.js'

test('YAML ↔ JSON', () => {
  assert.equal(yamlToJson('name: app\nports:\n  - 80\n  - 443\nenv: {DEBUG: true}\n'), '{\n  "name": "app",\n  "ports": [\n    80,\n    443\n  ],\n  "env": {\n    "DEBUG": true\n  }\n}')
  assert.deepEqual(parseYaml('a: 1\n---\nb: 2\n'), { value: [{ a: 1 }, { b: 2 }], documents: 2 })
  assert.equal(jsonToYaml('{"a":[1,{"b":"x"}],"c":null}'), 'a:\n  - 1\n  - b: x\nc: null\n')
  assert.throws(() => yamlToJson('a: [1,\nb'), /line 2/)
  assert.throws(() => jsonToYaml('{bad'), /Not valid JSON/)
})
