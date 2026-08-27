<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="finance-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">财务管理</span>
        <h2 id="finance-title" class="xy-page-title">线下收款与日常对账</h2>
        <p class="xy-page-description">在独立财务入口核对每一笔付款、关闭未到账申请，并完成已实际退回的线下退款。所有关键操作都需要再次核对支付单、业务单和会员手机。</p>
      </div>
      <div class="xy-page-actions">
        <el-button v-hasPermi="['xy:finance:view']" type="primary" @click="handleExport">导出 Excel</el-button>
        <el-button :loading="loading || offlineLoading" @click="loadAll">刷新财务数据</el-button>
      </div>
    </section>

    <section class="xy-stat-grid finance-stats" aria-label="财务统计">
      <article class="xy-stat"><span class="xy-stat-label">流水笔数</span><strong class="xy-stat-value">{{ rows.length }}</strong><span class="xy-stat-note">当前全部支付记录</span></article>
      <article class="xy-stat"><span class="xy-stat-label">已确认金额</span><strong class="xy-stat-value">¥{{ confirmedAmount }}</strong><span class="xy-stat-note">成功或已支付流水</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待确认收款</span><strong class="xy-stat-value">{{ offlinePendingCount }}</strong><span class="xy-stat-note">到账后才能确认生效</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待完成退款</span><strong class="xy-stat-value">{{ offlineRefundingCount }}</strong><span class="xy-stat-note">实际退款后登记完成</span></article>
    </section>

    <section class="xy-section">
      <div class="xy-section-head offline-head">
        <div>
          <h3>线下款项处理</h3>
          <p>财务角色无需商城权限即可在此完成收款、关单和线下退款登记。</p>
        </div>
        <el-select v-model="offlineStatus" aria-label="线下款项状态" @change="loadOfflinePayments">
          <el-option v-for="item in offlineStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="xy-inline-note finance-note">确认收款前请先在银行、POS 或现金记录中核实到账；完成退款前请先确认资金已实际退回顾客。</div>
      <div class="xy-table-wrap">
        <el-table :data="offlinePayments" v-loading="offlineLoading" :empty-text="offlineEmptyText">
          <el-table-column prop="paymentNo" label="支付单号" min-width="205"><template #default="s"><span class="xy-code">{{ s.row.paymentNo }}</span></template></el-table-column>
          <el-table-column label="业务单" min-width="185"><template #default="s"><div class="business-cell"><strong>{{ businessLabel(s.row.businessType) }}</strong><span class="xy-code">{{ s.row.businessOrderNo || '—' }}</span></div></template></el-table-column>
          <el-table-column label="会员" min-width="145"><template #default="s"><div class="business-cell"><span>{{ s.row.nickname || '微信用户' }}</span><span class="xy-date">{{ s.row.mobile || '未留手机号' }}</span></div></template></el-table-column>
          <el-table-column label="金额" width="120" align="right"><template #default="s"><strong class="xy-money">¥{{ formatMoney(s.row.amount) }}</strong></template></el-table-column>
          <el-table-column label="状态" width="126"><template #default="s"><span class="xy-status" :class="offlineStatusClass(s.row.status)">{{ offlineStatusLabel(s.row.status) }}</span></template></el-table-column>
          <el-table-column label="创建/截止时间" min-width="190"><template #default="s"><div class="business-cell"><span class="xy-date">{{ s.row.createTime || '—' }}</span><span v-if="s.row.status === 'PENDING'" class="deadline" :class="{ 'deadline--expired': isExpired(s.row) }">{{ isExpired(s.row) ? '已超过确认时限' : `截止 ${s.row.expireTime || '—'}` }}</span></div></template></el-table-column>
          <el-table-column label="操作" width="190" fixed="right"><template #default="s">
            <template v-if="s.row.status === 'PENDING'">
              <el-button v-hasPermi="['xy:finance:collect']" type="primary" link :loading="confirmingNo === s.row.paymentNo" @click="confirmOffline(s.row)">确认已收款</el-button>
              <el-button v-hasPermi="['xy:finance:collect']" type="danger" link :loading="closingNo === s.row.paymentNo" @click="closeOffline(s.row)">关闭申请</el-button>
            </template>
            <el-button v-else-if="s.row.status === 'REFUNDING' && s.row.afterSaleNo" v-hasPermi="['xy:finance:collect']" type="primary" link :loading="refundingNo === s.row.paymentNo" @click="completeOfflineRefund(s.row)">登记已退款</el-button>
            <span v-else-if="s.row.status === 'REFUNDING'" class="no-action">售后单关联中</span>
            <span v-else-if="s.row.restockRequired && !s.row.restocked" class="restock-note">待运营确认退货入库</span>
            <span v-else class="no-action">—</span>
          </template></el-table-column>
        </el-table>
      </div>
    </section>

    <section class="xy-section">
      <div class="xy-section-head">
        <div><h3>支付流水</h3><p>成功收款、退款中及已退款记录统一展示，便于逐笔对账。</p></div>
      </div>
      <div class="xy-table-wrap">
        <el-table :data="rows" v-loading="loading" empty-text="暂无支付流水">
          <el-table-column prop="paymentNo" label="支付单号" min-width="205"><template #default="s"><span class="xy-code">{{ s.row.paymentNo }}</span></template></el-table-column>
          <el-table-column label="业务" min-width="112"><template #default="s">{{ businessLabel(s.row.businessType) }}</template></el-table-column>
          <el-table-column label="金额" width="116" align="right"><template #default="s"><span class="xy-money">¥{{ formatMoney(s.row.amount) }}</span></template></el-table-column>
          <el-table-column label="渠道" width="112"><template #default="s"><span class="xy-status" :class="channelClass(s.row.channel)">{{ channelLabel(s.row.channel) }}</span></template></el-table-column>
          <el-table-column label="状态" width="126"><template #default="s"><span class="xy-status" :class="statusClass(s.row.status)">{{ statusLabel(s.row.status) }}</span></template></el-table-column>
          <el-table-column prop="nickname" label="会员" min-width="145"><template #default="s"><div class="business-cell"><span>{{ s.row.nickname || '微信用户' }}</span><span class="xy-date">{{ s.row.mobile || '未留手机号' }}</span></div></template></el-table-column>
          <el-table-column prop="paidTime" label="确认时间" min-width="175"><template #default="s"><span class="xy-date">{{ s.row.paidTime || '—' }}</span></template></el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { closeXyOfflinePayment, completeXyOfflineRefund, confirmXyOfflinePayment, getXyFinance, getXyOfflinePayments } from '@/api/xy'
import { paymentConfirmMessage } from './payment-confirm'

const rows = ref([])
const { proxy } = getCurrentInstance()
const offlinePayments = ref([])
const loading = ref(false)
const offlineLoading = ref(false)
const confirmingNo = ref('')
const closingNo = ref('')
const refundingNo = ref('')
const offlineStatus = ref('PENDING')
const offlinePendingCount = ref(0)
const offlineRefundingCount = ref(0)
const paidStatuses = ['PAID', 'SUCCESS', 'COMPLETED']
const offlineStatusOptions = [
  { label: '待确认收款', value: 'PENDING' },
  { label: '待完成退款', value: 'REFUNDING' },
  { label: '已确认收款', value: 'SUCCESS' },
  { label: '已关闭申请', value: 'CLOSED' },
  { label: '已完成退款', value: 'REFUNDED' },
  { label: '全部线下流水', value: 'ALL' }
]

const confirmedAmount = computed(() => rows.value.filter(item => paidStatuses.includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const formatMoney = value => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const businessLabel = value => ({ MEMBERSHIP: '会员开通', MEMBER: '会员开通', ORDER: '商城订单', MALL_ORDER: '商城订单' }[value] || value || '其他业务')
const channelLabel = value => ({ OFFLINE: '线下收款', WECHAT: '微信支付', WX: '微信支付' }[value] || value || '未标记')
const channelClass = value => value === 'OFFLINE' ? 'xy-status--info' : 'xy-status--muted'
const statusLabel = value => ({ PAID: '已支付', SUCCESS: '已成功', COMPLETED: '已完成', PENDING: '待收款', CLOSED: '已关闭', REFUNDING: '退款处理中', REFUNDED: '已退款' }[value] || value || '未知')
const statusClass = value => paidStatuses.includes(value) ? 'xy-status--success' : ({ PENDING: 'xy-status--warning', REFUNDING: 'xy-status--info', CLOSED: 'xy-status--muted', REFUNDED: 'xy-status--muted' }[value] || 'xy-status--muted')
const offlineStatusLabel = value => ({ PENDING: '待确认收款', SUCCESS: '已确认收款', CLOSED: '已关闭', REFUNDING: '待完成退款', REFUNDED: '已退款' }[value] || value || '未知')
const offlineStatusClass = value => ({ PENDING: 'xy-status--warning', SUCCESS: 'xy-status--success', CLOSED: 'xy-status--muted', REFUNDING: 'xy-status--info', REFUNDED: 'xy-status--muted' }[value] || 'xy-status--muted')
const offlineEmptyText = computed(() => ({ PENDING: '当前没有待确认的线下收款', REFUNDING: '当前没有待完成的线下退款', SUCCESS: '暂无已确认的线下流水', CLOSED: '暂无已关闭的线下申请', REFUNDED: '暂无已完成的线下退款', ALL: '暂无线下流水' }[offlineStatus.value] || '暂无线下流水'))
const isExpired = row => row.expireTime && new Date(String(row.expireTime).replace(' ', 'T')).getTime() <= Date.now()

async function load() {
  loading.value = true
  try { rows.value = await getXyFinance() } finally { loading.value = false }
}

async function loadOfflinePayments() {
  offlineLoading.value = true
  try {
    const selectedRows = await getXyOfflinePayments(offlineStatus.value)
    offlinePayments.value = selectedRows
    const [pendingRows, refundingRows] = await Promise.all([
      offlineStatus.value === 'PENDING' ? selectedRows : getXyOfflinePayments('PENDING'),
      offlineStatus.value === 'REFUNDING' ? selectedRows : getXyOfflinePayments('REFUNDING')
    ])
    offlinePendingCount.value = pendingRows.length
    offlineRefundingCount.value = refundingRows.length
  } finally { offlineLoading.value = false }
}

async function loadAll() { await Promise.all([load(), loadOfflinePayments()]) }

function handleExport() {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
  proxy.download('xy/finance/export', {}, `财务对账_${stamp}.xlsx`)
}

async function confirmOffline(row) {
  try {
    await ElMessageBox.confirm(paymentConfirmMessage(row, `请确认已实际收到 ¥${formatMoney(row.amount)}。`, '确认后，相关会员权益或商城订单会立即生效。'), '确认线下收款', { type: 'warning', confirmButtonText: '确认已到账', cancelButtonText: '返回核对' })
  } catch { return }
  confirmingNo.value = row.paymentNo
  try { await confirmXyOfflinePayment(row.paymentNo); ElMessage.success('线下收款已确认'); await loadAll() } finally { confirmingNo.value = '' }
}

async function closeOffline(row) {
  try {
    await ElMessageBox.confirm(paymentConfirmMessage(row, '请确认该笔申请未实际到账。', '关闭后，商城订单将取消并回补库存；会员开卡申请将失效。'), '关闭线下收款申请', { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '返回核对' })
  } catch { return }
  closingNo.value = row.paymentNo
  try { await closeXyOfflinePayment(row.paymentNo); ElMessage.success('线下收款申请已关闭'); await loadAll() } finally { closingNo.value = '' }
}

async function completeOfflineRefund(row) {
  const stockTail = ['SHIPPED', 'COMPLETED'].includes(row.originalOrderStatus)
    ? '该订单已发货或完成，本次登记不会自动回补库存；收到退货后请通知商城运营确认入库。'
    : '该操作只登记已经完成的线下退款，提交后不可撤销。'
  try {
    await ElMessageBox.confirm(paymentConfirmMessage(row, `请确认已向顾客实际退回 ¥${formatMoney(row.amount)}。`, stockTail), '登记完成线下退款', { type: 'warning', confirmButtonText: '已退款，完成售后', cancelButtonText: '返回核对' })
  } catch { return }
  refundingNo.value = row.paymentNo
  try { await completeXyOfflineRefund(row.afterSaleNo); ElMessage.success('线下退款已登记完成'); await loadAll() } finally { refundingNo.value = '' }
}

onMounted(loadAll)
</script>

<style scoped>
.finance-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.offline-head { align-items: flex-end; }
.offline-head .el-select { width: 168px; flex-shrink: 0; }
.finance-note { margin: 18px 24px; }
.business-cell { display: flex; flex-direction: column; gap: 4px; }
.business-cell strong { color: var(--xy-ink); font-size: 13px; }
.business-cell > span:last-child { color: var(--xy-muted); font-size: 11px; }
.deadline { color: var(--xy-muted); font-size: 11px; }
.deadline--expired { color: #ad3f3f; font-weight: 650; }
.no-action { color: var(--xy-muted); font-size: 12px; }
.restock-note { color: #936008; font-size: 11px; font-weight: 650; line-height: 1.4; }
@media (max-width: 1100px) { .finance-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) {
  .finance-stats { grid-template-columns: 1fr; }
  .offline-head { align-items: flex-start; flex-direction: column; }
  .offline-head .el-select { width: 100%; }
  .finance-note { margin: 14px 16px; }
}
</style>
