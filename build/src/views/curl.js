import { convertCurl, CURL_TARGETS } from '../tools/curl.js'
import { errorText, field, h, hint, output, segmented, set, textarea } from '../ui.js'

export default {
  id: 'curl',
  title: 'cURL to Code',
  group: 'Convert',
  icon: 'terminal',
  color: '#64748b',
  description: 'Turn a curl command into fetch, Python requests or HTTPie',
  keywords: ['curl', 'fetch', 'http', 'request', 'python', 'requests', 'httpie', 'api', 'convert', 'javascript'],
  create() {
    const source = textarea({ rows: 6, placeholder: "curl -X POST https://api.example.com/items \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\": \"pen\"}'" })
    const result = h('div', { class: 'result' })
    const out = output('Code')
    const target = segmented(CURL_TARGETS.map(([id, label]) => [id, label.replace('JavaScript ', '').replace('Python requests', 'Python')]), 'fetch', () => update(), 'Language')
    function update() {
      if (!source.value.trim()) return set(result, hint('Copy as cURL from the browser’s Network panel and paste it here. Quotes, line continuations and -H, -d, --json, -u, -F are understood.'))
      try {
        const { code, request } = convertCurl(source.value, target.get())
        out.set(code)
        set(result, out.node, request.ignored.length ? hint(`Not converted: ${request.ignored.join(', ')}.`) : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    source.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, target.node, field('curl command', source), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
