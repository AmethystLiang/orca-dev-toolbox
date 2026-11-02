// YAML ↔ JSON with js-yaml (MIT), bundled.
import { dump, load, loadAll } from 'js-yaml'

/** YAML text (one or more documents) as a value; several documents become an array. */
export function parseYaml(text) {
  try {
    const docs = loadAll(text).filter((doc) => doc !== undefined)
    return docs.length > 1 ? { value: docs, documents: docs.length } : { value: docs[0] ?? null, documents: docs.length }
  } catch (error) {
    const mark = error.mark
    const where = mark ? ` (line ${mark.line + 1}, column ${mark.column + 1})` : ''
    throw new Error(`Not valid YAML${where}: ${error.reason ?? error.message.split('\n')[0]}`)
  }
}

export function yamlToJson(text, indent = 2) {
  return JSON.stringify(parseYaml(text).value, null, indent)
}

export function jsonToYaml(text, { indent = 2, sortKeys = false } = {}) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`Not valid JSON: ${error.message}`)
  }
  return dump(value, { indent, sortKeys, lineWidth: -1, noRefs: true })
}

export { load as loadYaml }
