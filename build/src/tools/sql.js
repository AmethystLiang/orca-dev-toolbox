// A SQL formatter for reading queries from logs and ORMs: one clause per line, select lists and
// AND/OR conditions broken out, subqueries indented. Strings, quoted names and comments are kept
// exactly; it does not need to understand every dialect, only to tokenise it.

const TOKEN = /\s+|--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'?|"(?:[^"]|"")*"?|`[^`]*`?|\[[^\]]*\]|\$\$[\s\S]*?\$\$|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[\p{L}_@$#][\p{L}\p{N}_$#]*|::|<=|>=|<>|!=|\|\||->>|->|[(),;.*=<>+\-/%~!^&|?:]|./gu

const KEYWORDS = new Set(`select distinct from where and or not in is null like ilike between exists case when then else end as on
join inner left right full outer cross natural lateral using group by order having limit offset fetch first next rows only
union all intersect except insert into values update set delete returning with recursive asc desc nulls last create table
view index unique primary key foreign references default check constraint alter add drop column rename to if replace
truncate cascade restrict true false interval cast over partition window range unbounded preceding following current row
any some begin commit rollback transaction grant revoke on conflict do nothing merge matched temporary temp materialized
explain analyze`.split(/\s+/))

// Clauses that start a new line, longest first so "LEFT OUTER JOIN" wins over "LEFT JOIN".
const CLAUSES = [
  'left outer join', 'right outer join', 'full outer join', 'insert into', 'delete from', 'select distinct', 'group by',
  'order by', 'partition by', 'union all', 'inner join', 'left join', 'right join', 'full join', 'cross join',
  'natural join', 'on conflict', 'create table', 'create view', 'alter table', 'select', 'from', 'where', 'having', 'limit',
  'offset', 'union', 'intersect', 'except', 'values', 'update', 'set', 'returning', 'with', 'join', 'window'
].map((phrase) => phrase.split(' '))

const LIST_CLAUSES = new Set(['SELECT', 'SELECT DISTINCT', 'SET', 'RETURNING'])
const CONDITION_CLAUSES = new Set(['WHERE', 'HAVING', 'ON', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'NATURAL JOIN'])

/** Whether the list starting at `start` has a comma before its clause ends. */
function listHasComma(tokens, start) {
  let depth = 0
  for (let i = start; i < tokens.length; i++) {
    const text = tokens[i].text.toLowerCase()
    if (text === '(') depth++
    else if (text === ')') {
      if (--depth < 0) return false
    } else if (depth === 0) {
      if (text === ',') return true
      if (text === ';' || (tokens[i].word && CLAUSES.some((words) => words[0] === text && words.every((w, k) => tokens[i + k]?.text.toLowerCase() === w)))) return false
    }
  }
  return false
}

function tokenize(sql) {
  const out = []
  for (const [text] of sql.matchAll(TOKEN)) {
    if (/^\s+$/.test(text)) continue
    const comment = /^(--|#|\/\*)/.test(text) && !/^#\w/.test(text)
    out.push({ text, word: /^[\p{L}_]/u.test(text), comment })
  }
  return out
}

/** Formats `sql`; `uppercase` writes keywords in capitals, `indent` is the indent string. */
export function formatSql(sql, { uppercase = true, indent = '  ' } = {}) {
  const tokens = tokenize(sql)
  let out = ''
  let base = 0
  let clause = null
  // One entry per open parenthesis: a subquery remembers the clause and indent to return to.
  const stack = []
  const plainDepth = () => {
    let n = 0
    for (let i = stack.length - 1; i >= 0 && stack[i].kind === 'plain'; i--) n++
    return n
  }
  const lineLevel = () => {
    const line = out.slice(out.lastIndexOf('\n') + 1)
    return Math.floor(line.match(/^ */)[0].length / Math.max(1, indent.length))
  }
  const keyword = (text) => (uppercase ? text.toUpperCase() : text.toLowerCase())
  const newline = (level) => {
    out = out.replace(/[ \t]+$/, '')
    if (out) out += '\n' + indent.repeat(level)
  }
  let glue = false // the previous token was "." or "::", which bind to what follows
  const write = (text, { space = true } = {}) => {
    const noSpace = !out || /[\s(]$/.test(out) || !space || glue
    out += (noSpace ? '' : ' ') + text
    glue = false
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const lower = token.text.toLowerCase()
    if (token.comment) {
      write(token.text)
      if (!token.text.startsWith('/*')) newline(base + (clause ? 1 : 0))
      continue
    }
    if (token.word && plainDepth() === 0) {
      const phrase = CLAUSES.find((words) => words.every((w, k) => tokens[i + k]?.text.toLowerCase() === w))
      if (phrase) {
        const name = phrase.join(' ').toUpperCase()
        // "SET" inside "ON CONFLICT ... DO UPDATE SET" and the like still starts a line, which reads well.
        newline(base)
        write(keyword(phrase.join(' ')))
        i += phrase.length - 1
        clause = name
        // A list of one stays on the clause's line: SELECT id, SET a = 1.
        if (LIST_CLAUSES.has(name) && listHasComma(tokens, i + 1)) newline(base + 1)
        continue
      }
    }
    if (token.word && (lower === 'and' || lower === 'or') && plainDepth() === 0 && CONDITION_CLAUSES.has(clause)) {
      // BETWEEN x AND y keeps its AND inline.
      const between = tokens.slice(Math.max(0, i - 4), i).some((t) => t.text.toLowerCase() === 'between')
      if (!between) {
        newline(base + 1)
        write(keyword(token.text))
        continue
      }
    }
    if (token.word && lower === 'on' && clause?.endsWith('JOIN') && plainDepth() === 0) {
      newline(base + 1)
      write(keyword(token.text))
      clause = 'ON'
      continue
    }
    if (token.text === '(') {
      const next = tokens[i + 1]?.text.toLowerCase()
      const sub = next === 'select' || next === 'with'
      const level = lineLevel()
      stack.push({ kind: sub ? 'sub' : 'plain', level, base, clause })
      const previous = tokens[i - 1]
      // No space between a function name and its parenthesis: COUNT(*), coalesce(a, b); but
      // INSERT INTO t (a, b) keeps its space.
      const call = previous && previous.word && !KEYWORDS.has(previous.text.toLowerCase()) && clause !== 'INSERT INTO'
      write('(', { space: !call })
      if (sub) base = level + 1
      continue
    }
    if (token.text === ')') {
      const open = stack.pop()
      if (open?.kind === 'sub') {
        newline(open.level)
        base = open.base
        clause = open.clause
      }
      write(')', { space: false })
      continue
    }
    if (token.text === ',') {
      write(',', { space: false })
      if (plainDepth() === 0 && LIST_CLAUSES.has(clause)) newline(base + 1)
      continue
    }
    if (token.text === ';') {
      write(';', { space: false })
      out += '\n'
      base = 0
      clause = null
      stack.length = 0
      continue
    }
    if (token.text === '.' || token.text === '::') {
      write(token.text, { space: false })
      glue = true
      continue
    }
    // A keyword after "." is a name: t.order, t.user.
    const name = tokens[i - 1]?.text === '.'
    write(token.word && KEYWORDS.has(lower) && !name ? keyword(token.text) : token.text)
  }
  return out.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

export function minifySql(sql) {
  const tokens = tokenize(sql).filter((t) => !t.comment)
  let out = ''
  for (const token of tokens) {
    const glue = !out || /[(.]$/.test(out) || /^[),.;]$/.test(token.text) || out.endsWith('::') || token.text === '::'
    out += (glue ? '' : ' ') + token.text
  }
  return out
}
