<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="mall-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">商城运营</span>
        <h2 id="mall-title" class="xy-page-title">商品、订单与线下收款</h2>
        <p class="xy-page-description">维护在售商品和会员折扣，处理商城订单与售后。当前未启用微信支付，待支付业务统一在线下收款中确认到账。</p>
      </div>
      <div class="xy-page-actions"><el-button :loading="loading" @click="loadAll">刷新数据</el-button></div>
    </section>

    <section class="xy-stat-grid mall-stats" aria-label="商城统计">
      <article class="xy-stat"><span class="xy-stat-label">在售商品</span><strong class="xy-stat-value">{{ onSaleCount }}</strong><span class="xy-stat-note">当前可购买</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待发货订单</span><strong class="xy-stat-value">{{ paidOrderCount }}</strong><span class="xy-stat-note">已收款待履约</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待确认收款</span><strong class="xy-stat-value">{{ offlinePendingCount }}</strong><span class="xy-stat-note">线下付款待核实</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待处理售后</span><strong class="xy-stat-value">{{ pendingAfterCount }}</strong><span class="xy-stat-note">退款或拒绝</span></article>
    </section>

    <section class="xy-section mall-section">
      <el-tabs v-model="tab" @tab-change="handleTabChange">
        <el-tab-pane label="商品" name="products">
          <div class="xy-toolbar"><el-button v-hasPermi="['xy:product:edit']" type="primary" @click="openCreate">新增商品</el-button><span class="xy-toolbar-spacer"></span><span class="toolbar-note">共 {{ products.length }} 件商品</span></div>
          <div class="xy-table-wrap"><el-table :data="products" v-loading="loading" empty-text="暂无商品，请先新增商品">
            <el-table-column prop="productName" label="商品" min-width="170"><template #default="s"><strong class="product-name">{{ s.row.productName }}</strong></template></el-table-column>
            <el-table-column prop="categoryName" label="分类" width="120"><template #default="s">{{ s.row.categoryName || '未分类' }}</template></el-table-column>
            <el-table-column label="售价" width="108" align="right"><template #default="s"><span class="xy-money">¥{{ formatMoney(s.row.salePrice) }}</span></template></el-table-column>
            <el-table-column label="会员优惠" width="120"><template #default="s"><span class="xy-status" :class="s.row.memberDiscountEnabled ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.memberDiscountEnabled ? '参与' : '不参与' }}</span></template></el-table-column>
            <el-table-column prop="stock" label="库存" width="90" align="right"><template #default="s"><span class="xy-count">{{ s.row.stock }}</span></template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '上架' : '下架' }}</span></template></el-table-column>
            <el-table-column label="操作" width="88" fixed="right"><template #default="s"><el-button v-hasPermi="['xy:product:edit']" link type="primary" @click="openEdit(s.row)">编辑</el-button></template></el-table-column>
          </el-table></div>
        </el-tab-pane>

        <el-tab-pane label="会员优惠" name="discount">
          <div class="discount-layout">
            <div class="discount-copy"><span class="xy-kicker">全局规则</span><h3>商城会员折扣</h3><p>所有勾选“参与会员优惠”的上架商品都会按此折扣结算，订单会保存当时的价格快照。</p><div class="discount-preview"><strong>{{ discountLabel }}</strong><span>当前会员价比例</span></div></div>
            <el-form label-position="top" class="discount-form">
              <el-form-item label="会员折扣率"><el-input-number v-model="discountSettings.discountRate" :min="0.01" :max="1" :step="0.01" :precision="2" /></el-form-item>
              <p class="form-tip">例如 0.95 表示会员享受 95 折，关闭商品优惠后仍按原价出售。</p>
              <el-button v-hasPermi="['xy:product:edit']" type="primary" :loading="saving" @click="saveDiscount">保存会员优惠</el-button>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="订单" name="orders">
          <div class="xy-inline-note tab-note">只有已确认收款的订单才允许发货；待支付订单请先到“线下收款”核对并确认。</div>
          <div class="xy-table-wrap"><el-table :data="orders" v-loading="loading" empty-text="暂无商城订单">
            <el-table-column prop="orderNo" label="订单号" min-width="195"><template #default="s"><span class="xy-code">{{ s.row.orderNo }}</span></template></el-table-column>
            <el-table-column prop="nickname" label="会员" min-width="115"><template #default="s">{{ s.row.nickname || '微信用户' }}</template></el-table-column>
            <el-table-column label="商品金额" width="108" align="right"><template #default="s">¥{{ formatMoney(s.row.totalAmount) }}</template></el-table-column>
            <el-table-column label="会员优惠" width="108" align="right"><template #default="s">-¥{{ formatMoney(s.row.discountAmount) }}</template></el-table-column>
            <el-table-column label="应付金额" width="112" align="right"><template #default="s"><strong class="xy-money">¥{{ formatMoney(s.row.payableAmount) }}</strong></template></el-table-column>
            <el-table-column label="配送" width="95"><template #default="s">{{ deliveryLabel(s.row.deliveryType) }}</template></el-table-column>
            <el-table-column label="状态" width="112"><template #default="s"><span class="xy-status" :class="orderStatusClass(s.row.status)">{{ orderStatusLabel(s.row.status) }}</span></template></el-table-column>
            <el-table-column label="操作" width="90" fixed="right"><template #default="s"><el-button v-if="s.row.status === 'PAID'" v-hasPermi="['xy:product:edit']" type="primary" link @click="ship(s.row)">确认发货</el-button><span v-else class="no-action">—</span></template></el-table-column>
          </el-table></div>
        </el-tab-pane>

        <el-tab-pane v-if="canViewFinance" name="offline">
          <template #label><span>线下收款 <b v-if="offlinePendingCount" class="tab-badge">{{ offlinePendingCount }}</b></span></template>
          <div class="offline-intro"><div><h3>待确认线下收款</h3><p>仅在实际到账、现金收讫或现场刷卡成功后确认。确认后相关会员权益或商城订单会正式生效。</p></div><el-select v-model="offlineStatus" aria-label="线下收款状态" @change="loadOfflinePayments"><el-option label="待确认" value="PENDING" /><el-option label="已确认" value="SUCCESS" /><el-option label="已关闭" value="CLOSED" /></el-select></div>
          <div class="xy-table-wrap"><el-table :data="offlinePayments" v-loading="offlineLoading" :empty-text="offlineEmptyText">
            <el-table-column prop="paymentNo" label="支付单号" min-width="200"><template #default="s"><span class="xy-code">{{ s.row.paymentNo }}</span></template></el-table-column>
            <el-table-column label="业务" min-width="180"><template #default="s"><div class="business-cell"><span>{{ businessLabel(s.row.businessType) }}</span><span class="xy-code">{{ s.row.businessOrderNo || '—' }}</span></div></template></el-table-column>
            <el-table-column prop="nickname" label="会员" min-width="150"><template #default="s"><div class="business-cell"><span>{{ s.row.nickname || '微信用户' }}</span><span>{{ s.row.mobile || '未留手机号' }}</span></div></template></el-table-column>
            <el-table-column label="金额" width="120" align="right"><template #default="s"><strong class="xy-money">¥{{ formatMoney(s.row.amount) }}</strong></template></el-table-column>
            <el-table-column label="状态" width="115"><template #default="s"><span class="xy-status" :class="offlineStatusClass(s.row.status)">{{ offlineStatusLabel(s.row.status) }}</span></template></el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="170"><template #default="s"><span class="xy-date">{{ s.row.createTime || s.row.createdTime || '—' }}</span></template></el-table-column>
            <el-table-column label="操作" width="176" fixed="right"><template #default="s"><template v-if="s.row.status === 'PENDING'"><el-button v-hasPermi="['xy:finance:collect']" type="primary" link :loading="confirmingNo === s.row.paymentNo" @click="confirmOffline(s.row)">确认已收款</el-button><el-button v-hasPermi="['xy:finance:collect']" type="danger" link :loading="closingNo === s.row.paymentNo" @click="closeOffline(s.row)">关闭申请</el-button></template><span v-else class="no-action">—</span></template></el-table-column>
          </el-table></div>
        </el-tab-pane>

        <el-tab-pane label="售后" name="after">
          <div class="xy-table-wrap"><el-table :data="afterSales" v-loading="loading" empty-text="暂无售后申请">
            <el-table-column prop="afterSaleNo" label="售后单" min-width="195"><template #default="s"><span class="xy-code">{{ s.row.afterSaleNo }}</span></template></el-table-column>
            <el-table-column prop="orderNo" label="订单号" min-width="185"><template #default="s"><span class="xy-code">{{ s.row.orderNo }}</span></template></el-table-column>
            <el-table-column prop="nickname" label="会员" min-width="110" /><el-table-column prop="reason" label="申请原因" min-width="150" />
            <el-table-column label="退款金额" width="115" align="right"><template #default="s"><strong class="xy-money">¥{{ formatMoney(s.row.paidAmount) }}</strong></template></el-table-column>
            <el-table-column label="渠道" width="110"><template #default="s"><span class="xy-status" :class="paymentChannel(s.row) === 'OFFLINE' ? 'xy-status--info' : 'xy-status--muted'">{{ paymentChannel(s.row) === 'OFFLINE' ? '线下收款' : '线上支付' }}</span></template></el-table-column>
            <el-table-column label="状态" width="135"><template #default="s"><span class="xy-status" :class="afterStatusClass(s.row.status)">{{ afterStatusLabel(s.row) }}</span></template></el-table-column>
            <el-table-column label="操作" min-width="220" fixed="right"><template #default="s">
              <template v-if="s.row.status === 'PENDING'"><el-button v-hasPermi="['xy:product:edit']" type="success" link @click="approve(s.row)">{{ paymentChannel(s.row) === 'OFFLINE' ? '同意退款' : '发起退款' }}</el-button><el-button v-hasPermi="['xy:product:edit']" type="danger" link @click="reject(s.row)">拒绝</el-button></template>
              <el-button v-else-if="s.row.status === 'REFUNDING' && paymentChannel(s.row) === 'OFFLINE'" v-hasPermi="['xy:finance:collect']" type="primary" link @click="completeOfflineRefund(s.row)">已实际退款，完成售后</el-button>
              <el-button v-else-if="s.row.status === 'REFUND_FAILED' && paymentChannel(s.row) !== 'OFFLINE'" v-hasPermi="['xy:product:edit']" type="success" link @click="approve(s.row)">重试退款</el-button>
              <el-button v-else-if="s.row.restockRequired && !s.row.restocked" v-hasPermi="['xy:product:edit']" type="primary" link @click="restockReturned(s.row)">确认退货入库</el-button>
              <span v-else class="no-action">—</span>
            </template></el-table-column>
          </el-table></div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="visible" :title="form.productId ? '编辑商品' : '新增商品'" width="560px">
      <el-form label-position="top">
        <el-form-item label="商品名称" required><el-input v-model.trim="form.productName" maxlength="80" show-word-limit /></el-form-item>
        <div class="dialog-grid"><el-form-item label="分类"><el-input v-model.trim="form.categoryName" /></el-form-item><el-form-item label="售价" required><el-input-number v-model="form.salePrice" :min="0.01" :precision="2" /></el-form-item></div>
        <div class="dialog-grid"><el-form-item label="库存" required><el-input-number v-model="form.stock" :min="0" /></el-form-item><el-form-item label="上架状态"><el-switch v-model="onSale" active-text="上架" inactive-text="下架" /></el-form-item></div>
        <el-form-item label="会员优惠"><el-switch v-model="form.memberDiscountEnabled" active-text="参与" inactive-text="不参与" /></el-form-item>
        <el-form-item label="商品主图"><image-upload v-model="form.coverUrl" :limit="1" /></el-form-item>
        <el-form-item label="商品详情"><el-input v-model="form.detailText" type="textarea" :rows="5" maxlength="2000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存商品</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { approveXyAfterSale, closeXyOfflinePayment, completeXyOfflineRefund, confirmXyOfflinePayment, getXyAfterSales, getXyMemberDiscountSettings, getXyOfflinePayments, getXyOrders, getXyProducts, rejectXyAfterSale, restockXyReturnedAfterSale, saveXyMemberDiscountSettings, saveXyProduct, shipXyOrder } from '@/api/xy'
import auth from '@/plugins/auth'
import { paymentConfirmMessage } from './payment-confirm'

const route = useRoute()
const canViewFinance = auth.hasPermi('xy:finance:view')
const validTabs = ['products', 'discount', 'orders', 'after', ...(canViewFinance ? ['offline'] : [])]
const tab = ref(validTabs.includes(route.query.tab) ? route.query.tab : 'products')
const loading = ref(false), offlineLoading = ref(false), saving = ref(false), confirmingNo = ref(''), closingNo = ref('')
const products = ref([]), orders = ref([]), offlinePayments = ref([]), afterSales = ref([])
const offlineStatus = ref('PENDING')
const offlinePendingTotal = ref(0)
const discountSettings = ref({ discountRate: 0.95 })
const visible = ref(false), onSale = ref(true)
const blank = () => ({ productId: null, productName: '', categoryName: '', salePrice: 0.01, memberDiscountEnabled: true, stock: 0, coverUrl: '', detailText: '', status: '0', sortOrder: 0 })
const form = ref(blank())
const discountLabel = computed(() => `${(Number(discountSettings.value.discountRate || 1) * 10).toFixed(2).replace(/\.00$/, '')} 折`)
const onSaleCount = computed(() => products.value.filter(item => item.status === '0').length)
const paidOrderCount = computed(() => orders.value.filter(item => item.status === 'PAID').length)
const offlinePendingCount = computed(() => offlinePendingTotal.value)
const pendingAfterCount = computed(() => afterSales.value.filter(item => ['PENDING', 'REFUNDING', 'REFUND_FAILED'].includes(item.status)).length)
const formatMoney = value => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const businessLabel = value => ({ MEMBERSHIP: '会员开通', MEMBER: '会员开通', ORDER: '商城订单', MALL_ORDER: '商城订单' }[value] || value || '其他业务')
const offlineStatusLabel = value => ({ PENDING: '待确认', SUCCESS: '已确认', CLOSED: '已关闭' }[value] || value || '未知')
const offlineStatusClass = value => ({ PENDING: 'xy-status--warning', SUCCESS: 'xy-status--success', CLOSED: 'xy-status--muted' }[value] || 'xy-status--muted')
const offlineEmptyText = computed(() => ({ PENDING: '当前没有待确认的线下收款', SUCCESS: '暂无已确认的线下流水', CLOSED: '暂无已关闭的线下申请' }[offlineStatus.value] || '暂无线下流水'))
const paymentChannel = row => row.paymentChannel || row.channel || ''
const deliveryLabel = value => ({ PICKUP: '到店自提', DELIVERY: '配送', EXPRESS: '快递' }[value] || value || '未标记')
const orderStatusLabel = value => ({ PENDING_PAYMENT: '待付款', PENDING: '待付款', PAID: '待发货', SHIPPED: '已发货', COMPLETED: '已完成', AFTER_SALE: '售后处理中', CANCELED: '已取消', REFUNDED: '已退款' }[value] || value || '未知')
const orderStatusClass = value => ({ PENDING_PAYMENT: 'xy-status--warning', PENDING: 'xy-status--warning', PAID: 'xy-status--info', SHIPPED: 'xy-status--success', COMPLETED: 'xy-status--success', AFTER_SALE: 'xy-status--info', CANCELED: 'xy-status--muted', REFUNDED: 'xy-status--muted' }[value] || 'xy-status--muted')
const afterStatusLabel = row => row.restocked ? '已退款并入库' : (row.restockRequired ? '已退款待入库' : ({ PENDING: '待处理', REFUNDING: '待线下退款', REFUND_FAILED: '退款失败', APPROVED: '已退款', REFUNDED: '已退款', COMPLETED: '已完成', REJECTED: '已拒绝' }[row.status] || row.status || '未知'))
const afterStatusClass = value => ({ PENDING: 'xy-status--warning', REFUNDING: 'xy-status--info', REFUND_FAILED: 'xy-status--danger', APPROVED: 'xy-status--success', REFUNDED: 'xy-status--success', COMPLETED: 'xy-status--success', REJECTED: 'xy-status--muted' }[value] || 'xy-status--muted')

async function loadAll() {
  loading.value = true
  try {
    const [productRows, orderRows, afterRows, settings] = await Promise.all([getXyProducts(), getXyOrders(), getXyAfterSales(), getXyMemberDiscountSettings()])
    products.value = productRows.map(row => ({ ...row, memberDiscountEnabled: Number(row.memberDiscountEnabled) === 1 || row.memberDiscountEnabled === true }))
    orders.value = orderRows; afterSales.value = afterRows; discountSettings.value = settings
    if (canViewFinance) await loadOfflinePayments()
  } finally { loading.value = false }
}
async function loadOfflinePayments() {
  offlineLoading.value = true
  try {
    const selectedRows = await getXyOfflinePayments(offlineStatus.value)
    offlinePayments.value = selectedRows
    offlinePendingTotal.value = offlineStatus.value === 'PENDING'
      ? selectedRows.length
      : (await getXyOfflinePayments('PENDING')).length
  } finally { offlineLoading.value = false }
}
function handleTabChange(name) { if (name === 'offline') loadOfflinePayments() }
function openCreate() { form.value = blank(); onSale.value = true; visible.value = true }
function openEdit(row) { form.value = { ...row }; onSale.value = row.status === '0'; visible.value = true }
async function save() {
  if (!form.value.productName || Number(form.value.salePrice) <= 0) { ElMessage.warning('请填写商品名称和有效售价'); return }
  saving.value = true
  try { await saveXyProduct({ ...form.value, status: onSale.value ? '0' : '1' }); visible.value = false; ElMessage.success('商品已保存'); await loadAll() } finally { saving.value = false }
}
async function saveDiscount() { saving.value = true; try { await saveXyMemberDiscountSettings({ discountRate: discountSettings.value.discountRate }); ElMessage.success('会员优惠已更新'); await loadAll() } finally { saving.value = false } }
async function ship(row) {
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, '请确认该订单已完成备货并实际发出。', '发货状态提交后将同步给顾客。'), '确认发货', { type: 'warning', confirmButtonText: '确认已发货', cancelButtonText: '返回核对' }) } catch { return }
  await shipXyOrder(row.orderNo)
  ElMessage.success('发货状态已更新')
  await loadAll()
}
async function confirmOffline(row) {
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, `请确认已实际收到 ¥${formatMoney(row.amount)}。`, '确认后，相关会员权益或商城订单会立即生效。'), '确认线下收款', { type: 'warning', confirmButtonText: '确认已到账', cancelButtonText: '返回核对' }) } catch { return }
  confirmingNo.value = row.paymentNo
  try { await confirmXyOfflinePayment(row.paymentNo); ElMessage.success('线下收款已确认'); await loadAll() } finally { confirmingNo.value = '' }
}
async function closeOffline(row) {
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, '请确认该笔申请未实际到账。', '关闭后，商城订单将取消并回补库存；会员开卡申请将失效。'), '关闭线下收款申请', { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '返回核对' }) } catch { return }
  closingNo.value = row.paymentNo
  try { await closeXyOfflinePayment(row.paymentNo); ElMessage.success('线下收款申请已关闭'); await loadAll() } finally { closingNo.value = '' }
}
async function approve(row) {
  const isOffline = paymentChannel(row) === 'OFFLINE'
  const lead = isOffline ? '请确认同意该退款申请并登记为“待线下退款”。' : '请确认按订单实付金额发起线上原路退款。'
  const tail = isOffline ? '审批不会直接完成退款；实际向顾客退款后，还需由财务登记完成。' : '提交后系统将调用线上原支付渠道。'
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, lead, tail), '确认退款', { type: 'warning', confirmButtonText: '确认同意退款', cancelButtonText: '返回核对' }) } catch { return }
  await approveXyAfterSale(row.afterSaleNo)
  ElMessage.success(isOffline ? '已登记待线下退款' : '退款申请已提交')
  await loadAll()
}
async function completeOfflineRefund(row) {
  const stockTail = ['SHIPPED', 'COMPLETED'].includes(row.originalOrderStatus)
    ? '该订单已发货或完成，本次登记不会自动回补库存；收到退货后还需确认退货入库。'
    : '该操作只登记已经完成的线下退款，提交后不可撤销。'
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, `请确认已向顾客实际退回 ¥${formatMoney(row.paidAmount)}。`, stockTail), '完成线下退款', { type: 'warning', confirmButtonText: '已退款，完成售后', cancelButtonText: '返回核对' }) } catch { return }
  await completeXyOfflineRefund(row.afterSaleNo)
  ElMessage.success('线下退款已登记')
  await loadAll()
}
async function restockReturned(row) {
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, '请确认顾客退回的商品已实际验收入库。', '确认后系统会回补该订单商品库存；未收到退货时不要操作。'), '确认退货入库', { type: 'warning', confirmButtonText: '已验收入库', cancelButtonText: '返回核对' }) } catch { return }
  await restockXyReturnedAfterSale(row.afterSaleNo)
  ElMessage.success('退货商品已回补库存')
  await loadAll()
}
async function reject(row) {
  try { await ElMessageBox.confirm(paymentConfirmMessage(row, '请确认拒绝该售后申请。', '拒绝后，订单保持原状态，顾客可查看处理结果。'), '拒绝售后', { type: 'warning', confirmButtonText: '确认拒绝', cancelButtonText: '返回核对' }) } catch { return }
  await rejectXyAfterSale(row.afterSaleNo)
  ElMessage.success('售后申请已拒绝')
  await loadAll()
}
onMounted(loadAll)
</script>

<style scoped>
.mall-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.mall-section :deep(.el-tab-pane) { min-height: 300px; }
.toolbar-note { color: var(--xy-muted); font-size: 12px; }
.product-name { color: var(--xy-ink); font-size: 13px; }
.business-cell { display: flex; flex-direction: column; gap: 4px; }.business-cell span:last-child { color: var(--xy-muted); font-size: 11px; }
.discount-layout { display: grid; grid-template-columns: minmax(260px,.85fr) minmax(320px,1.15fr); gap: 36px; padding: 30px; }
.discount-copy h3, .offline-intro h3 { margin: 0 0 8px; color: var(--xy-ink); font-size: 19px; }
.discount-copy p, .offline-intro p { max-width: 55ch; margin: 0; color: var(--xy-ink-3); font-size: 12px; line-height: 1.75; }
.discount-preview { display: flex; flex-direction: column; gap: 5px; margin-top: 28px; padding: 18px; border-radius: 14px; background: var(--xy-mint); }
.discount-preview strong { color: var(--xy-primary-deep); font-size: 30px; letter-spacing: -.04em; }.discount-preview span, .form-tip { color: var(--xy-muted); font-size: 12px; }
.discount-form { padding: 24px; border-radius: 16px; background: #f7faf9; }.discount-form .el-input-number { width: 100%; }.form-tip { margin: -4px 0 20px; line-height: 1.65; }
.tab-note { margin: 18px 24px; }.offline-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 22px 24px; border-bottom: 1px solid var(--xy-hairline); }.offline-intro .el-select { width: 150px; flex-shrink: 0; }
.tab-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; margin-left: 4px; padding: 0 5px; border-radius: 6px; background: #fff1d4; color: #936008; font-size: 10px; }
.dialog-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }.dialog-grid .el-input-number { width: 100%; }.no-action { color: var(--xy-muted); }
@media (max-width: 1100px) { .mall-stats { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media (max-width: 720px) { .mall-stats, .discount-layout, .dialog-grid { grid-template-columns: 1fr; }.discount-layout { gap: 16px; padding: 20px 16px; }.offline-intro { align-items: flex-start; flex-direction: column; }.offline-intro .el-select { width: 100%; } }
</style>
