import { countTokens, tokenCost, tokenRange, WINDOWS } from '../tools/tokens.js'
import { field, h, hint, input, rows, set, textarea } from '../ui.js'

const format = (n) => n.toLocaleString('en-US')

export default {
  id: 'tokens',
  title: 'Token Counter',
  group: 'Text',
  icon: 'coins',
  color: '#d97706',
  description: 'How many LLM tokens a prompt or file costs, and how much context it fills',
  keywords: ['token', 'tokens', 'llm', 'gpt', 'claude', 'openai', 'anthropic', 'prompt', 'context', 'window', 'cost', 'price', 'ai', 'agent', 'tiktoken'],
  create() {
    const source = textarea({ rows: 8, placeholder: 'Paste a prompt, a file or a diff' })
    const price = input({ placeholder: '3', class: 'mono', inputmode: 'decimal', 'aria-label': 'Dollars per million input tokens' })
    const result = h('div', { class: 'result' })
    function meter(label, size, tokens) {
      const share = tokens / size
      const tone = share > 1 ? 'over' : share > 0.8 ? 'near' : ''
      return h('div', { class: `meter ${tone}` },
        h('span', { class: 'meter-label' }, label),
        h('span', { class: 'meter-track' }, h('span', { class: 'meter-fill', style: `width:${Math.min(100, share * 100).toFixed(1)}%` })),
        h('span', { class: 'meter-value' }, share > 1 ? `${share.toFixed(1)}×` : `${(share * 100).toFixed(share < 0.01 ? 2 : 1)}%`))
    }
    function update() {
      if (!source.value) return set(result, hint('An estimate within about 15%: each model has its own tokenizer. English runs about four characters a token; Vietnamese, other accented text and Chinese cost more per character.'))
      const c = countTokens(source.value)
      const { low, high } = tokenRange(c.tokens)
      const cost = price.value.trim() ? tokenCost(c.tokens, price.value) : null
      set(result,
        rows([
          ['Tokens', `≈ ${format(c.tokens)}`, { text: `${format(low)}–${format(high)}` }],
          ['Characters', format(c.characters)],
          ['Words', format(c.words)],
          ['Lines', format(c.lines)],
          ['Bytes', format(c.bytes)],
          cost !== null ? ['Input cost', `$${cost < 0.01 ? cost.toFixed(5) : cost.toFixed(4)}`] : null
        ].filter(Boolean)),
        h('div', { class: 'meters', role: 'group', 'aria-label': 'Context window use' }, WINDOWS.map(([label, size]) => meter(label, size, c.tokens))),
        hint('Share of a 32K, 128K, 200K and 1M token context window. Leave room for the answer too.'))
    }
    source.addEventListener('input', update)
    price.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Text', source), field('Price per million input tokens ($, optional)', price), result),
      focus: source,
      fill(value) {
        source.value = value
        update()
      }
    }
  }
}
