import { analyseVnId } from '../tools/vnid.js'
import { errorText, field, h, hint, input, rows, set } from '../ui.js'

const TITLES = { cccd: 'Citizen ID (CCCD)', 'mst-personal': 'Personal tax code', mst: 'Tax code (MST)', phone: 'Phone number', cmnd: 'Old ID card (CMND)' }
const verdict = (ok) => (ok ? { text: 'valid', kind: 'ok' } : { text: 'invalid', kind: 'bad' })

function details(r) {
  switch (r.kind) {
    case 'cccd':
      return rows([['Born in', r.province, verdict(r.valid)], ['Sex', r.sex], ['Birth year', String(r.year)], ['Serial', r.serial]])
    case 'mst':
      return rows([['Tax code', r.formatted, verdict(r.valid)], r.branch ? ['Branch', r.branch] : null, ['Check digit', r.expected === null ? 'none possible' : String(r.expected)]].filter(Boolean))
    case 'phone':
      return rows([['Type', r.type, verdict(r.valid)], r.carrier ? ['Network', r.carrier] : null, ['National', r.display], ['International', r.international]].filter(Boolean))
    case 'mst-personal':
      return hint('Since 1 July 2025 the citizen ID number is also the person’s tax code.')
    case 'cmnd':
      return hint('A 9-digit number is an old ID card (CMND). It carries no birth data and has been replaced by the 12-digit CCCD.')
  }
}

export default {
  id: 'vnid',
  title: 'Vietnam IDs',
  group: 'Inspect',
  icon: 'idcard',
  color: '#b91c1c',
  description: 'Check a citizen ID (CCCD), tax code (MST) or phone number',
  keywords: ['cccd', 'cmnd', 'căn cước', 'citizen id', 'mst', 'mã số thuế', 'tax code', 'phone', 'số điện thoại', 'sđt', 'viettel', 'vinaphone', 'mobifone', 'vietnam', 'validate'],
  create() {
    const value = input({ placeholder: '079303001234 · 0100109106 · 0987 654 321', class: 'mono', inputmode: 'numeric', 'aria-label': 'Number' })
    const result = h('div', { class: 'result' })
    function update() {
      if (!value.value.trim()) return set(result, hint('Everything is checked here; nothing is looked up. A valid check digit means the number is well formed, not that it was issued.'))
      try {
        const all = analyseVnId(value.value)
        // A phone number is also ten digits like a tax code: show only the readings that hold.
        const found = all.some((r) => r.valid) ? all.filter((r) => r.valid) : all
        set(result,
          found.map((r) => h('div', { class: 'stack' },
            h('p', { class: 'subhead' }, TITLES[r.kind]),
            details(r),
            r.problems.map((problem) => errorText(problem)))),
          found.some((r) => r.kind === 'phone' && r.valid && r.carrier) ? hint('Numbers can switch networks and keep their prefix, so the network is the original one.') : null)
      } catch (error) {
        set(result, errorText(error.message))
      }
    }
    value.addEventListener('input', update)
    update()
    return {
      node: h('div', {}, field('Number', value), result),
      focus: value,
      fill(text) {
        value.value = text
        update()
      }
    }
  }
}
