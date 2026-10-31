// Every tool the panel offers, in the order the home screen lists them within each group.
// To add a tool: write src/views/<id>.js exporting { id, title, group, icon, color, description,
// keywords, create() } (see views/jwt.js), import it here, and, if pasted values can be recognised, teach
// detect.js its shape.
import base64 from './views/base64.js'
import changeCase from './views/case.js'
import chmod from './views/chmod.js'
import color from './views/color.js'
import cron from './views/cron.js'
import diff from './views/diff.js'
import escape from './views/escape.js'
import hash from './views/hash.js'
import ids from './views/ids.js'
import json from './views/json.js'
import jwt from './views/jwt.js'
import lines from './views/lines.js'
import number from './views/number.js'
import regex from './views/regex.js'
import stats from './views/stats.js'
import time from './views/time.js'
import url from './views/url.js'

export const GROUPS = ['Inspect', 'Encode', 'Convert', 'Generate', 'Text']

export const TOOLS = [
  jwt, time, cron,
  base64, url, escape,
  color, number, chmod,
  ids, hash,
  json, regex, diff, changeCase, lines, stats
]

/** Tools whose title, description or keywords contain every word of the query. */
export function searchTools(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return TOOLS
  return TOOLS.filter((tool) => {
    const haystack = [tool.title, tool.description, tool.id, ...tool.keywords].join(' ').toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}
