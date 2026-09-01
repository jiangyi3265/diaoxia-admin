<template>
  <div class="xy-page benefit-page">
    <section class="xy-page-hero" aria-labelledby="benefit-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">每日付费专场</span>
        <h2 id="benefit-title" class="xy-page-title">福利钓场次、选座与报名</h2>
        <p class="xy-page-description">创建未来7天场次，19:30前确认是否正常开始。原普通预约20:00–22:00时段已停用，其余会员预约时段和18个普通钓位保持不变。</p>
      </div>
      <div class="xy-page-actions">
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button v-hasPermi="['xy:benefit:edit']" type="primary" @click="openEditor()">创建场次</el-button>
      </div>
    </section>

    <el-alert v-if="!benefitNoticesReady" class="notice-config-alert" type="warning" :closable="false" show-icon
      title="福利钓订阅消息尚未配置完整"
      description="开始通知或取消通知模板 ID 为空。场次和退款可以正常处理，但用户暂时收不到对应的微信订阅消息，请先在微信公众平台申请模板并配置到服务器。" />

    <section class="xy-stat-grid benefit-stats" aria-label="福利钓统计">
      <article class="xy-stat"><span class="xy-stat-label">未来场次</span><strong class="xy-stat-value">{{ futureCount }}</strong><span class="xy-stat-note">未来7天内</span></article>
      <article class="xy-stat"><span class="xy-stat-label">当前场报名</span><strong class="xy-stat-value">{{ Number(activeEvent?.bookedCount || 0) }}</strong><span class="xy-stat-note">共22个位置</span></article>
      <article class="xy-stat"><span class="xy-stat-label">待完成支付</span><strong class="xy-stat-value">{{ Number(activeEvent?.pendingCount || 0) }}</strong><span class="xy-stat-note">5分钟自动释放</span></article>
      <article class="xy-stat"><span class="xy-stat-label">剩余位置</span><strong class="xy-stat-value">{{ Math.max(0, Number(activeEvent?.remainingCount || 0)) }}</strong><span class="xy-stat-note">当前所选场次</span></article>
    </section>

    <section class="benefit-workspace">
      <aside class="event-rail" aria-label="福利钓场次列表">
        <div class="rail-head"><div><h3>场次安排</h3><p>选择日期查看座位和报名</p></div></div>
        <div v-if="events.length" class="event-list">
          <button v-for="item in events" :key="item.eventId" type="button" class="event-item" :class="{ active: item.eventId === activeId }" @click="selectEvent(item.eventId)">
            <span class="event-date">{{ formatDate(item.eventDate) }}</span>
            <span class="event-time">20:15–22:15</span>
            <span class="event-price">¥{{ money(item.feeAmount) }}/位</span>
            <span class="event-meta"><span class="xy-status" :class="eventStatusClass(item.status)">{{ eventStatus(item.status) }}</span><span>{{ item.bookedCount || 0 }}/22</span></span>
          </button>
        </div>
        <div v-else class="rail-empty">尚未创建场次。可从今天起创建未来7天的福利钓。</div>
      </aside>

      <div class="event-detail">
        <template v-if="activeEvent">
          <div class="detail-head">
            <div>
              <span class="detail-kicker">{{ activeEvent.eventDate }} · {{ activeEvent.storeName }}</span>
              <h3>20:15–22:15 福利钓专场</h3>
              <p>19:30截止报名，¥{{ money(activeEvent.feeAmount) }}/位，每位用户本场限报一个位置。</p>
            </div>
            <div class="detail-actions">
              <el-button v-hasPermi="['xy:benefit:edit']" :disabled="!editable" :title="editable ? '' : '已有报名或待支付记录，关键信息已锁定'" @click="openEditor(activeEvent)">编辑场次</el-button>
              <el-button v-hasPermi="['xy:benefit:edit']" type="success" :disabled="!canConfirm" :loading="acting" @click="confirmStart">{{ activeEvent.status === 'CONFIRMED' ? '补发开始通知' : '确认正常开始' }}</el-button>
              <el-button v-hasPermi="['xy:benefit:refund']" type="danger" plain :disabled="!canCancel" :loading="acting" @click="cancelEvent">取消专场并一键退款</el-button>
            </div>
          </div>

          <div class="decision-note" :class="activeEvent.status === 'CONFIRMED' ? 'confirmed' : ''">
            <xy-icon :name="activeEvent.status === 'CONFIRMED' ? 'check' : 'clock'" :size="19" />
            <span v-if="activeEvent.status === 'CONFIRMED'">本场已确认正常开始，已向允许接收消息的报名用户发送通知。</span>
            <span v-else-if="activeEvent.status === 'CANCELED'">本场已取消。客户端仅展示“专场已取消”，退款进度仅在本后台可见。</span>
            <span v-else>请最迟在当天19:30前确认正常开始或取消，避免顾客提前到店后才收到变化通知。</span>
          </div>

          <div class="seat-and-notice">
            <div class="seat-panel">
              <div class="panel-title"><div><h4>33平方小池座位图</h4><p>点击已报名座位可在下方表格定位</p></div><div class="seat-legend"><span><i class="free"></i>可报名</span><span><i class="booked"></i>已报名</span><span><i class="pending"></i>支付中</span><span><i class="closed"></i>已关闭</span></div></div>
              <div class="pool-map portrait-map" aria-label="福利钓22座座位图">
                <div class="short-seats"><button v-for="n in topSeats" :key="n" type="button" :class="seatClass(n)" @click="focusSeat(n)">{{ n }}</button></div>
                <div class="pool-middle">
                  <div class="long-seats"><button v-for="n in leftSeats" :key="n" type="button" :class="seatClass(n)" @click="focusSeat(n)">{{ n }}</button></div>
                  <div class="pool"><span>33平方小池</span><small>福利钓专场</small></div>
                  <div class="long-seats"><button v-for="n in rightSeats" :key="n" type="button" :class="seatClass(n)" @click="focusSeat(n)">{{ n }}</button></div>
                </div>
                <div class="short-seats"><button v-for="n in bottomSeats" :key="n" type="button" :class="seatClass(n)" @click="focusSeat(n)">{{ n }}</button></div>
              </div>
            </div>

            <div class="notice-panel">
              <div class="panel-title"><div><h4>当天公告</h4><p>第{{ activeEvent.announcementVersion }}版</p></div></div>
              <div class="notice-copy">{{ activeEvent.announcement }}</div>
              <dl class="fixed-rules"><div><dt>时间</dt><dd>20:15–22:15</dd></div><div><dt>截止</dt><dd>当天19:30</dd></div><div><dt>费用</dt><dd>¥{{ money(activeEvent.feeAmount) }}/位</dd></div><div><dt>限制</dt><dd>每人每场1位</dd></div></dl>
            </div>
          </div>

          <section class="booking-table" aria-labelledby="booking-table-title">
            <div class="xy-section-head"><div><h3 id="booking-table-title">报名与退款记录</h3><p>原路退款成功后才释放位置；失败记录可从原座位再次操作。</p></div></div>
            <div class="xy-table-wrap"><el-table ref="bookingTable" :data="bookings" row-key="bookingId" empty-text="当前场次暂无报名" highlight-current-row>
              <el-table-column prop="seatNo" label="座位" width="76"><template #default="s"><strong class="seat-number">{{ s.row.seatNo }}</strong></template></el-table-column>
              <el-table-column label="报名用户" min-width="150"><template #default="s"><div class="member-cell"><strong>{{ s.row.nickname || '微信用户' }}</strong><span>{{ s.row.mobile || '未绑定手机号' }}</span></div></template></el-table-column>
              <el-table-column prop="bookingNo" label="报名编号" min-width="205"><template #default="s"><span class="xy-code">{{ s.row.bookingNo }}</span></template></el-table-column>
              <el-table-column label="支付" min-width="150"><template #default="s"><div class="payment-cell"><strong>¥{{ money(s.row.amount) }}</strong><span>{{ s.row.paymentNo }}</span></div></template></el-table-column>
              <el-table-column label="报名状态" width="115"><template #default="s"><span class="xy-status" :class="bookingStatusClass(s.row.status)">{{ bookingStatus(s.row.status) }}</span></template></el-table-column>
              <el-table-column label="退款状态" width="120"><template #default="s"><span class="xy-status" :class="refundStatusClass(s.row.refundStatus)">{{ refundStatus(s.row.refundStatus) }}</span></template></el-table-column>
              <el-table-column label="操作" width="110" fixed="right"><template #default="s"><el-button v-if="s.row.status === 'BOOKED' || (s.row.refundStatus === 'FAILED' && s.row.paymentStatus === 'SUCCESS')" v-hasPermi="['xy:benefit:refund']" link type="danger" :loading="processingId === s.row.bookingId" @click="refundSeat(s.row)">{{ s.row.refundStatus === 'FAILED' ? '重试退款' : '单座退款' }}</el-button><span v-else class="no-action">—</span></template></el-table-column>
            </el-table></div>
          </section>
        </template>
        <div v-else class="detail-empty"><xy-icon name="gift" :size="54" /><h3>先创建一个福利钓专场</h3><p>创建后即可编辑公告、查看22座图和管理报名。</p></div>
      </div>
    </section>

    <el-dialog v-model="editorOpen" :title="form.eventId ? '编辑福利钓专场' : '创建福利钓专场'" width="620px">
      <el-form label-position="top">
        <div class="form-grid"><el-form-item label="营业门店" required><el-select v-model="form.storeId" style="width:100%"><el-option v-for="store in stores" :key="store.storeId" :label="store.storeName" :value="store.storeId" /></el-select></el-form-item><el-form-item label="专场日期" required><el-date-picker v-model="form.eventDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disableDate" style="width:100%" /></el-form-item></div>
        <el-form-item label="报名费（元/位）" required>
          <div class="fee-editor"><el-input-number v-model="form.feeAmount" :min="0.01" :max="9999.99" :precision="2" :step="10" controls-position="right" /><span>每个场次可单独定价；出现报名或待支付记录后自动锁定。</span></div>
        </el-form-item>
        <div class="fixed-strip"><span>固定时间 <strong>20:15–22:15</strong></span><span>截止 <strong>19:30</strong></span><span>座位 <strong>22个</strong></span></div>
        <el-form-item label="当天公告、奖品与开闭场条件" required><el-input v-model="form.announcement" type="textarea" :rows="9" maxlength="2000" show-word-limit placeholder="请写清当天奖品、活动规则、开场条件、闭场条件、到店时间和注意事项。" /></el-form-item>
        <el-form-item label="保存状态"><el-radio-group v-model="form.status"><el-radio-button value="DRAFT">保存草稿</el-radio-button><el-radio-button value="OPEN">立即开放报名</el-radio-button></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button @click="editorOpen=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveEvent">保存场次</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import XyIcon from './XyIcon.vue'
import { cancelXyBenefitEvent, confirmXyBenefitEvent, getXyBenefitEvent, getXyBenefitEvents, getXyNotificationSettings, getXyReservationConfiguration, refundXyBenefitBooking, saveXyBenefitEvent } from '@/api/xy'

const events = ref([]), stores = ref([]), activeId = ref(), activeEvent = ref(null)
const loading = ref(false), saving = ref(false), acting = ref(false), processingId = ref(null), editorOpen = ref(false)
const notificationSettings = ref({})
const form = ref({ eventDate: '', storeId: null, feeAmount: 100, announcement: '', status: 'OPEN' })
const bookingTable = ref()
const topSeats = [19,20], bottomSeats = [21,22]
const leftSeats = [1,2,3,4,5,6,7,8,9], rightSeats = [10,11,12,13,14,15,16,17,18]
const bookings = computed(() => activeEvent.value?.bookings || [])
const futureCount = computed(() => events.value.filter(item => !['CANCELED','FINISHED'].includes(item.status)).length)
const editable = computed(() => activeEvent.value && !['CANCELED','FINISHED'].includes(activeEvent.value.status) && Number(activeEvent.value.lockedCount || 0) === 0)
const benefitNoticesReady = computed(() => Boolean(notificationSettings.value.benefitStartTemplateId && notificationSettings.value.benefitCancelTemplateId))
const canConfirm = computed(() => activeEvent.value && ['OPEN','CONFIRMED'].includes(activeEvent.value.status))
const canCancel = computed(() => activeEvent.value && ['DRAFT','OPEN','CONFIRMED'].includes(activeEvent.value.status))
const bookingBySeat = computed(() => {
  const map = new Map()
  for (const row of bookings.value) if (!map.has(Number(row.seatNo)) || ['BOOKED','PENDING_PAYMENT','REFUNDING'].includes(row.status)) map.set(Number(row.seatNo), row)
  return map
})

async function load(keepId = activeId.value) {
  loading.value = true
  try {
    const [eventRows, config, notices] = await Promise.all([getXyBenefitEvents(), getXyReservationConfiguration(), getXyNotificationSettings()])
    events.value = eventRows || []; stores.value = (config.stores || []).filter(item => item.status === '0')
    notificationSettings.value = notices || {}
    const target = events.value.find(item => item.eventId === keepId) || events.value[0]
    activeId.value = target?.eventId
    activeEvent.value = target ? await getXyBenefitEvent(target.eventId) : null
  } finally { loading.value = false }
}
async function selectEvent(id) { activeId.value = id; activeEvent.value = await getXyBenefitEvent(id) }
function openEditor(row = null) {
  const today = dateText(new Date())
  form.value = row ? { eventId: row.eventId, eventDate: row.eventDate, storeId: row.storeId, feeAmount: Number(row.feeAmount), announcement: row.announcement, status: row.status === 'DRAFT' ? 'DRAFT' : 'OPEN' } : { eventDate: today, storeId: stores.value[0]?.storeId, feeAmount: 100, announcement: '', status: 'OPEN' }
  editorOpen.value = true
}
async function saveEvent() {
  if (!form.value.storeId || !form.value.eventDate) { ElMessage.warning('请选择门店和日期'); return }
  if (!Number.isFinite(Number(form.value.feeAmount)) || Number(form.value.feeAmount) < 0.01 || Number(form.value.feeAmount) > 9999.99) { ElMessage.warning('报名费必须在0.01至9999.99元之间'); return }
  if ((form.value.announcement || '').trim().length < 10) { ElMessage.warning('请完整填写公告、奖品与开闭场条件'); return }
  saving.value = true
  try { const saved = await saveXyBenefitEvent(form.value); editorOpen.value = false; ElMessage.success('场次已保存'); await load(saved.eventId) }
  finally { saving.value = false }
}
async function confirmStart() {
  try { await ElMessageBox.confirm('确认本场正常开始，并向已允许接收消息的报名用户发送开始通知？', '确认正常开始', { type: 'success', confirmButtonText: '确认并通知', cancelButtonText: '返回核对' }) } catch { return }
  acting.value = true
  try { const result = await confirmXyBenefitEvent(activeId.value); ElMessage.success(`已确认正常开始，发送 ${result.noticeSentCount || 0} 条通知`); await load(activeId.value) }
  finally { acting.value = false }
}
async function cancelEvent() {
  let value
  try { ({ value } = await ElMessageBox.prompt('请填写取消原因。系统将立即停止报名，并向所有已付款座位逐笔发起原路退款。', '取消福利钓专场', { type: 'warning', inputPlaceholder: '例如：场地临时维护，本场取消', inputValidator: text => String(text || '').trim().length >= 2 || '请填写至少2个字的原因', confirmButtonText: '确认取消并一键退款', cancelButtonText: '暂不取消' })) } catch { return }
  acting.value = true
  try {
    const result = await cancelXyBenefitEvent(activeId.value, value)
    const failures = result.failedBookingIds?.length || 0
    failures ? ElMessage.warning(`专场已取消，${failures} 个座位退款未成功，请在表格中重试`) : ElMessage.success('专场已取消，已提交全部座位退款')
    await load(activeId.value)
  } finally { acting.value = false }
}
async function refundSeat(row) {
  let value
  try { ({ value } = await ElMessageBox.prompt(`座位 ${row.seatNo}，用户 ${row.nickname || '微信用户'}，金额 ¥${money(row.amount)}。退款成功后该座位会重新开放。`, '单座原路退款', { type: 'warning', inputPlaceholder: '填写内部退款原因', inputValidator: text => String(text || '').trim().length >= 2 || '请填写至少2个字的原因', confirmButtonText: '确认原路退款', cancelButtonText: '返回核对' })) } catch { return }
  processingId.value = row.bookingId
  try { await refundXyBenefitBooking(row.bookingId, value); ElMessage.success('已提交单座退款'); await load(activeId.value) }
  finally { processingId.value = null }
}
function seatClass(no) { const row = bookingBySeat.value.get(no); return ['map-seat', row ? row.status === 'BOOKED' ? 'booked' : row.status === 'PENDING_PAYMENT' ? 'pending' : 'closed' : 'free'] }
async function focusSeat(no) { const row = bookingBySeat.value.get(no); if (!row) return; await nextTick(); bookingTable.value?.setCurrentRow(row); document.querySelector('.booking-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
const eventStatus = value => ({ DRAFT:'草稿',OPEN:'报名中',CONFIRMED:'已确认开始',CANCELED:'已取消',FINISHED:'已结束' }[value] || value)
const eventStatusClass = value => value === 'OPEN' ? 'xy-status--success' : value === 'CONFIRMED' ? 'xy-status--info' : value === 'CANCELED' ? 'xy-status--danger' : 'xy-status--muted'
const bookingStatus = value => ({ PENDING_PAYMENT:'支付中',BOOKED:'已报名',REFUNDING:'处理中',CLOSED:'已关闭' }[value] || value)
const bookingStatusClass = value => value === 'BOOKED' ? 'xy-status--success' : value === 'PENDING_PAYMENT' ? 'xy-status--warning' : 'xy-status--muted'
const refundStatus = value => ({ PROCESSING:'处理中',SUCCESS:'已完成',FAILED:'处理失败' }[value] || '未处理')
const refundStatusClass = value => value === 'SUCCESS' ? 'xy-status--success' : value === 'FAILED' ? 'xy-status--danger' : value === 'PROCESSING' ? 'xy-status--warning' : 'xy-status--muted'
const money = value => Number(value || 0).toFixed(2)
const dateText = date => [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-')
const formatDate = value => { const [y,m,d] = String(value).split('-'); return `${m}月${d}日` }
const disableDate = date => { const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+6); end.setHours(23,59,59,999); return date < start || date > end }
onMounted(load)
</script>

<style scoped>
.notice-config-alert{margin-bottom:20px}
.benefit-stats{grid-template-columns:repeat(4,minmax(0,1fr))}.benefit-workspace{display:grid;grid-template-columns:220px minmax(0,1fr);overflow:hidden;border:1px solid var(--xy-hairline);border-radius:18px;background:var(--xy-surface)}.event-rail{padding:20px 14px;background:#f4f8f7;border-right:1px solid var(--xy-hairline)}.rail-head{padding:0 6px 14px}.rail-head h3,.detail-head h3,.panel-title h4{margin:0;color:var(--xy-ink)}.rail-head p,.detail-head p,.panel-title p{margin:5px 0 0;color:var(--xy-ink-3);font-size:12px}.event-list{display:flex;flex-direction:column;gap:8px}.event-item{display:flex;flex-direction:column;align-items:flex-start;width:100%;padding:13px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--xy-ink);cursor:pointer;text-align:left}.event-item:hover{background:#eaf3f0}.event-item.active{border-color:#9bd5cb;background:#e0f2ed}.event-date{font-size:15px;font-weight:750}.event-time{margin-top:4px;color:var(--xy-ink-2);font-size:12px}.event-meta{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:9px;color:var(--xy-ink-3);font-size:12px}.rail-empty{padding:18px 8px;color:var(--xy-ink-3);font-size:13px;line-height:1.6}.event-detail{min-width:0;padding:24px}.detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.detail-kicker{color:var(--xy-primary-deep);font-size:12px;font-weight:700}.detail-head h3{margin-top:5px;font-size:21px}.detail-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.decision-note{display:flex;align-items:center;gap:9px;margin-top:18px;padding:12px 14px;border-radius:11px;background:#fff6e5;color:#76531c;font-size:13px}.decision-note.confirmed{background:#e7f5ef;color:#176b55}.seat-and-notice{display:grid;grid-template-columns:minmax(500px,1.45fr) minmax(240px,.75fr);gap:20px;margin-top:20px}.seat-panel,.notice-panel{padding:19px;border:1px solid var(--xy-hairline);border-radius:15px}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.seat-legend{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px;color:var(--xy-ink-3);font-size:11px}.seat-legend span{display:flex;align-items:center;gap:5px}.seat-legend i{width:9px;height:9px;border-radius:3px}.seat-legend .free{background:#dff1ec}.seat-legend .booked{background:#0e9c8e}.seat-legend .pending{background:#e0a24e}.seat-legend .closed{background:#9daca6}.pool-map{margin-top:18px;padding:15px;border-radius:14px;background:#eef5f3}.seat-row{display:grid;grid-template-columns:repeat(9,minmax(32px,1fr));gap:7px}.pool-middle{display:grid;grid-template-columns:42px minmax(260px,1fr) 42px;align-items:stretch;gap:9px;margin:9px 0}.side-seats{display:flex;flex-direction:column;justify-content:space-around;gap:8px}.pool{display:flex;min-height:145px;align-items:center;justify-content:center;flex-direction:column;border:2px solid #82bdb2;border-radius:20px;background:#d9efea;color:#145e55}.pool span{font-size:26px;font-weight:800;letter-spacing:1px}.pool small{margin-top:6px;color:#5e847d;font-size:11px}.map-seat{min-width:32px;height:34px;padding:0;border:1px solid transparent;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer}.map-seat.free{background:#f9fcfb;color:#45615b}.map-seat.booked{background:#0e9c8e;color:#f4fbf9}.map-seat.pending{background:#f3dfb7;color:#7b5618}.map-seat.closed{background:#dce3e1;color:#778985}.notice-copy{min-height:136px;margin-top:17px;padding:14px;border-radius:11px;background:#f4f8f7;color:var(--xy-ink-2);font-size:13px;line-height:1.75;white-space:pre-wrap}.fixed-rules{margin:14px 0 0}.fixed-rules div{display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--xy-hairline);font-size:12px}.fixed-rules div:last-child{border-bottom:0}.fixed-rules dt{color:var(--xy-ink-3)}.fixed-rules dd{margin:0;color:var(--xy-ink);font-weight:650}.booking-table{scroll-margin-top:96px;margin-top:22px}.member-cell,.payment-cell{display:flex;flex-direction:column;gap:3px}.member-cell span,.payment-cell span{color:var(--xy-ink-3);font-size:11px}.payment-cell span{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.seat-number{display:inline-grid;width:30px;height:30px;place-items:center;border-radius:9px;background:var(--xy-mint);color:var(--xy-primary-deep)}.detail-empty{display:flex;min-height:480px;align-items:center;justify-content:center;flex-direction:column;color:var(--xy-ink-3);text-align:center}.detail-empty h3{margin:18px 0 5px;color:var(--xy-ink)}.detail-empty p{margin:0;font-size:13px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fixed-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}.fixed-strip span{padding:10px;border-radius:9px;background:var(--xy-mint);color:var(--xy-ink-2);font-size:12px}.fixed-strip strong{display:block;margin-top:3px;color:var(--xy-primary-deep)}
.event-price{margin-top:5px;color:var(--xy-primary-deep);font-size:12px;font-weight:700}.fee-editor{display:flex;align-items:center;gap:14px}.fee-editor .el-input-number{width:220px}.fee-editor span{color:var(--xy-ink-3);font-size:12px}.fixed-strip{grid-template-columns:repeat(3,1fr)}
.portrait-map{max-width:430px;margin:18px auto 0}.short-seats{display:grid;grid-template-columns:repeat(2,42px);justify-content:center;gap:9px}.portrait-map .pool-middle{display:grid;grid-template-columns:42px minmax(160px,1fr) 42px;align-items:stretch;gap:9px;margin:9px 0}.long-seats{display:grid;grid-template-rows:repeat(9,34px);gap:7px}.portrait-map .pool{min-height:362px}
@media(max-width:1200px){.benefit-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.seat-and-notice{grid-template-columns:1fr}.detail-head{flex-direction:column}.detail-actions{justify-content:flex-start}}
@media(max-width:820px){.benefit-workspace{grid-template-columns:1fr}.event-rail{border-right:0;border-bottom:1px solid var(--xy-hairline)}.event-list{display:grid;grid-template-columns:repeat(2,1fr)}.event-detail{padding:16px}.portrait-map{min-width:0}.form-grid,.fixed-strip{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.benefit-stats,.event-list,.form-grid,.fixed-strip{grid-template-columns:1fr}.fee-editor{align-items:flex-start;flex-direction:column}.fee-editor .el-input-number{width:100%}.detail-actions{width:100%}.detail-actions .el-button{margin-left:0}}
</style>
