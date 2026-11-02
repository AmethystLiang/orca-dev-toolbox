import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatSql, minifySql } from '../../src/tools/sql.js'

test('SQL formats clauses, conditions and subqueries', () => {
  assert.equal(formatSql("select a, b from t where x = 1 and y in (select id from u where z) order by a desc"), [
    'SELECT', '  a,', '  b', 'FROM t', 'WHERE x = 1', '  AND y IN (', '    SELECT id', '    FROM u', '    WHERE z', '  )', 'ORDER BY a DESC', ''
  ].join('\n'))
  assert.equal(formatSql("SELECT count(*) FROM t LEFT JOIN u ON u.id = t.uid AND u.ok WHERE d BETWEEN 1 AND 2"), [
    'SELECT count(*)', 'FROM t', 'LEFT JOIN u', '  ON u.id = t.uid', '  AND u.ok', 'WHERE d BETWEEN 1 AND 2', ''
  ].join('\n'))
  assert.equal(formatSql("insert into t (a) values ('it''s -- not a comment')", { uppercase: false }), "insert into t (a)\nvalues ('it''s -- not a comment')\n")
  assert.equal(formatSql('select t.order, x::text from "Order" t'), 'SELECT\n  t.order,\n  x::text\nFROM "Order" t\n')
  assert.equal(minifySql('select a ,\n b -- c\n from t'), 'select a, b from t')
})
