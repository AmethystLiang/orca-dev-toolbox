import assert from 'node:assert/strict'
import { test } from 'node:test'

import { jsonToTypes } from '../../src/tools/types.js'

test('JSON to types: optional, nullable, nested and named', () => {
  const sample = '{"id":1,"user_name":"ann","items":[{"sku":"a","qty":1},{"sku":"b","qty":2.5,"note":"x"}],"parent":null,"meta":{"tags":["t"]}}'
  assert.equal(jsonToTypes(sample, 'typescript'), [
    'export interface Root {', '  id: number', '  user_name: string', '  items: Item[]', '  parent: null', '  meta: Meta', '}', '',
    'export interface Item {', '  sku: string', '  qty: number', '  note?: string', '}', '',
    'export interface Meta {', '  tags: string[]', '}'
  ].join('\n'))
  const go = jsonToTypes(sample, 'go')
  assert.match(go, /ID +int64 +`json:"id"`/)
  assert.match(go, /Qty +float64/)
  assert.match(go, /Note +\*string +`json:"note,omitempty"`/)
  assert.match(jsonToTypes(sample, 'rust'), /#\[serde\(default, skip_serializing_if = "Option::is_none"\)\]\n    pub note: Option<String>,/)
  assert.match(jsonToTypes(sample, 'python'), /note: str \| None = None/)
  assert.equal(jsonToTypes('[{"a":1},{"a":null}]'), 'export type Root = RootItem[]\n\nexport interface RootItem {\n  a: number | null\n}')
  assert.throws(() => jsonToTypes('{'), /Not valid JSON/)
})
