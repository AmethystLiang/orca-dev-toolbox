import assert from 'node:assert/strict'
import { test } from 'node:test'

import { csvToJson, jsonToCsv, parseCsv } from '../../src/tools/csv.js'

test('CSV ↔ JSON follows RFC 4180', () => {
  assert.deepEqual(parseCsv('a,"b ""q""",c\n"multi\nline",2,'), [['a', 'b "q"', 'c'], ['multi\nline', '2', '']])
  assert.deepEqual(csvToJson('name\tage\nAnn\t30\nBob\t').value, [{ name: 'Ann', age: 30 }, { name: 'Bob', age: null }])
  assert.equal(csvToJson('a;b\n1;2').delimiter, ';')
  assert.deepEqual(csvToJson('id,zip\n1,007', { types: true }).value, [{ id: 1, zip: '007' }])
  assert.equal(jsonToCsv('[{"a":1,"b":"x,y"},{"a":2,"c":"say \\"hi\\""}]'), 'a,b,c\n1,"x,y",\n2,,"say ""hi"""')
  assert.throws(() => parseCsv('"open'), /never closed/)
})
