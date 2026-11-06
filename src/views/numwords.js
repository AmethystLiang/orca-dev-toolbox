import { formatAmount, parseAmount, toEnglish, toVietnamese } from '../tools/numwords.js'
import { checkbox, errorText, field, h, hint, input, rows, set } from '../ui.js'

export default {
  id: 'numwords',
  title: 'Number to Words',
  group: 'Text',
  icon: 'spell',
  color: '#0d9488',
  description: 'Amounts in Vietnamese and English words, for invoices and contracts',
  keywords: ['number', 'words', 'spell', 'amount', 'money', 'invoice', 'cheque', 'đọc số', 'số thành chữ', 'bằng chữ', 'tiền', 'vnd', 'đồng', 'hóa đơn'],
  create() {
    const amount = input({ placeholder: '1.250.000 · 2,5 · 150k · 1,5 tỷ', class: 'mono', inputmode: 'decimal', 'aria-label': 'Number' })
    const result = h('div', { class: 'result' })
    const money = checkbox('Amount in đồng', () => update(), true)
    const linh = checkbox('“linh” instead of “lẻ”', () => update())
    function update() {
      if (!amount.value.trim()) return set(result, hint('Separators work either way: 1.250.000 and 1,250,000 are the same; 150k, 2tr and 1,5 tỷ are understood.'))
      try {
        const grouped = formatAmount(amount.value)
        set(result, rows([
          ['Tiếng Việt', toVietnamese(amount.value, { currency: money.get(), linh: linh.get() })],
          ['English', toEnglish(amount.value, { currency: money.get() })],
          ['Số', grouped.vi],
          ['Number', grouped.en]
        ]), money.get() && parseAmount(amount.value).frac ? hint('Đồng has no decimals: the fraction is left out of the words.') : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    amount.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Number', amount), h('div', { class: 'bar' }, money.node, linh.node), result),
      focus: amount,
      fill(value) {
        amount.value = value
        update()
      }
    }
  }
}
