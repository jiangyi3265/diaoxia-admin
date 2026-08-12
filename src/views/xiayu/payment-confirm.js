import { h } from 'vue'

const display = value => value == null || value === '' ? '—' : String(value)

export function paymentConfirmMessage(row, lead, tail = '') {
  const businessOrderNo = row.businessOrderNo || row.orderNo
  return h('div', { class: 'xy-payment-confirm' }, [
    h('p', { class: 'xy-payment-confirm__lead' }, lead),
    h('dl', { class: 'xy-payment-confirm__identity' }, [
      h('dt', '支付单号'), h('dd', { class: 'xy-payment-confirm__code' }, display(row.paymentNo)),
      h('dt', '业务单号'), h('dd', { class: 'xy-payment-confirm__code' }, display(businessOrderNo)),
      h('dt', '会员手机'), h('dd', display(row.mobile || '未留手机号'))
    ]),
    tail ? h('p', { class: 'xy-payment-confirm__tail' }, tail) : null
  ])
}
