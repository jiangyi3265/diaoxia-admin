<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="seats-title">
      <div class="xy-page-copy"><span class="xy-kicker">经营基础配置</span><h2 id="seats-title" class="xy-page-title">门店、时段与座位资源</h2><p class="xy-page-description">这里的营业门店、可用时段和座位会直接展示到小程序。请先选择门店，再维护对应资源。</p></div>
      <div class="xy-page-actions"><el-button :loading="loading" @click="load">刷新配置</el-button></div>
    </section>

    <section class="xy-stat-grid config-stats" aria-label="配置统计">
      <article class="xy-stat"><span class="xy-stat-label">门店</span><strong class="xy-stat-value">{{ stores.length }}</strong><span class="xy-stat-note">{{ enabledStores }} 家营业中</span></article>
      <article class="xy-stat"><span class="xy-stat-label">预约时段</span><strong class="xy-stat-value">{{ filteredSlots.length }}</strong><span class="xy-stat-note">当前所选门店</span></article>
      <article class="xy-stat"><span class="xy-stat-label">可用座位</span><strong class="xy-stat-value">{{ filteredSeats.length }}</strong><span class="xy-stat-note">当前所选门店</span></article>
      <article class="xy-stat"><span class="xy-stat-label">会员方案</span><strong class="xy-stat-value">{{ monthlyPlan ? 1 : 0 }}</strong><span class="xy-stat-note">30 天包月方案</span></article>
    </section>

    <section class="xy-section config-section">
      <div class="xy-toolbar">
        <el-select v-model="storeId" placeholder="选择要配置的门店" clearable aria-label="当前门店">
          <el-option v-for="item in stores" :key="item.storeId" :label="item.storeName" :value="item.storeId" />
        </el-select>
        <span v-if="selectedStore" class="selected-store">当前：{{ selectedStore.storeName }}</span>
      </div>
    <el-tabs v-model="tab">
      <el-tab-pane label="门店" name="stores">
        <div class="xy-toolbar"><el-button type="primary" @click="editStore()">新增门店</el-button><span class="xy-toolbar-spacer"></span><span class="toolbar-note">门店状态决定小程序是否展示</span></div>
        <div class="xy-table-wrap"><el-table :data="stores" v-loading="loading" empty-text="暂无门店，请先创建">
          <el-table-column prop="storeName" label="门店" />
          <el-table-column prop="address" label="地址" min-width="220" />
          <el-table-column prop="phone" label="电话" />
          <el-table-column prop="businessHours" label="营业时间" />
          <el-table-column label="地图坐标" width="116"><template #default="s"><span class="xy-status" :class="hasCoordinates(s.row) ? 'xy-status--success' : 'xy-status--warning'">{{ hasCoordinates(s.row) ? '已配置' : '待配置' }}</span></template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '营业' : '停业' }}</span></template></el-table-column>
          <el-table-column label="操作" width="90"><template #default="s"><el-button link type="primary" @click="editStore(s.row)">编辑</el-button></template></el-table-column>
        </el-table></div>
      </el-tab-pane>

      <el-tab-pane label="预约时段" name="slots">
        <div class="xy-toolbar"><el-button type="primary" :disabled="!storeId" @click="editSlot()">新增时段</el-button><span v-if="!storeId" class="toolbar-note">请先选择门店</span></div>
        <div class="xy-table-wrap"><el-table :data="filteredSlots" v-loading="loading" empty-text="当前门店暂无预约时段">
          <el-table-column prop="startTime" label="开始" /><el-table-column prop="endTime" label="结束" />
          <el-table-column prop="sortOrder" label="排序" /><el-table-column label="状态"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '启用' : '停用' }}</span></template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editSlot(s.row)">编辑</el-button></template></el-table-column>
        </el-table></div>
      </el-tab-pane>

      <el-tab-pane label="座位" name="seats">
        <div class="xy-toolbar"><el-button type="primary" :disabled="!storeId" @click="editSeat()">新增座位</el-button><span v-if="!storeId" class="toolbar-note">请先选择门店</span></div>
        <div class="xy-table-wrap"><el-table :data="filteredSeats" v-loading="loading" empty-text="当前门店暂无座位">
          <el-table-column prop="seatCode" label="座位编号" /><el-table-column prop="zoneName" label="区域" />
          <el-table-column prop="sortOrder" label="排序" /><el-table-column label="状态"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '启用' : '停用' }}</span></template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editSeat(s.row)">编辑</el-button></template></el-table-column>
        </el-table></div>
      </el-tab-pane>

      <el-tab-pane v-if="canManagePlans" label="包月会员" name="plans">
        <div class="xy-toolbar"><el-button type="primary" @click="editPlan()">{{ monthlyPlan ? '编辑包月方案' : '配置包月方案' }}</el-button></div>
        <div class="xy-inline-note plan-tip">小程序仅提供一个 30 天包月方案。当前以线下收款开通为主，确认到账后会员权益生效。</div>
        <div class="xy-table-wrap"><el-table :data="monthlyPlanRows" v-loading="loading" empty-text="暂未配置包月方案">
          <el-table-column prop="planName" label="方案" /><el-table-column prop="amount" label="售价" />
          <el-table-column label="有效期"><template #default>30天</template></el-table-column>
          <el-table-column label="状态"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '上架' : '下架' }}</span></template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editPlan(s.row)">编辑</el-button></template></el-table-column>
        </el-table></div>
      </el-tab-pane>
    </el-tabs>
    </section>

    <el-dialog v-model="storeDialog" title="门店配置" width="560px">
      <el-form label-position="top"><el-form-item label="门店名称" required><el-input v-model.trim="store.storeName" maxlength="80" /></el-form-item><el-form-item label="详细地址" required><el-input v-model.trim="store.address" /></el-form-item><div class="dialog-grid"><el-form-item label="联系电话" required><el-input v-model.trim="store.phone" placeholder="顾客可联系的门店电话" /></el-form-item><el-form-item label="营业时间" required><el-input v-model.trim="store.businessHours" placeholder="例如 10:00-22:00" /></el-form-item></div><div class="dialog-grid"><el-form-item label="经度"><el-input-number v-model="store.longitude" :min="-180" :max="180" :precision="7" /></el-form-item><el-form-item label="纬度"><el-input-number v-model="store.latitude" :min="-90" :max="90" :precision="7" /></el-form-item></div><div class="coordinate-help"><span>请填写腾讯或高德地图中的门店标注坐标，保存后小程序即可直接拉起地图导航。</span><el-button link type="primary" @click="openCoordinatePicker">打开腾讯地图坐标拾取器</el-button></div><el-form-item label="营业状态"><el-switch v-model="storeEnabled" active-text="营业" inactive-text="停业" /></el-form-item></el-form>
      <template #footer><el-button @click="storeDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveStoreForm">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="slotDialog" title="预约时段" width="480px">
      <el-form label-width="80px"><el-form-item label="时段"><el-time-picker v-model="slotRange" is-range value-format="HH:mm" /></el-form-item><el-form-item label="排序"><el-input-number v-model="slot.sortOrder" :min="0" /></el-form-item><el-form-item label="启用"><el-switch v-model="slotEnabled" /></el-form-item></el-form>
      <template #footer><el-button @click="slotDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveSlotForm">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="seatDialog" title="座位配置" width="480px">
      <el-form label-width="90px"><el-form-item label="座位编号"><el-input v-model="seat.seatCode" /></el-form-item><el-form-item label="区域"><el-input v-model="seat.zoneName" /></el-form-item><el-form-item label="排序"><el-input-number v-model="seat.sortOrder" :min="0" /></el-form-item><el-form-item label="启用"><el-switch v-model="seatEnabled" /></el-form-item></el-form>
      <template #footer><el-button @click="seatDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveSeatForm">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="planDialog" title="包月会员方案" width="500px">
      <el-form label-width="110px"><el-form-item label="方案名称"><el-input v-model="plan.planName" /></el-form-item><el-form-item label="售价"><el-input-number v-model="plan.amount" :min="0.01" :precision="2" /></el-form-item><el-form-item label="有效期">支付成功后连续30天有效</el-form-item><el-form-item label="预约规则">同一时间仅保留一条待到场预约，签到后按当天续约规则执行</el-form-item><el-form-item label="排序"><el-input-number v-model="plan.sortOrder" :min="0" /></el-form-item><el-form-item label="上架"><el-switch v-model="planEnabled" /></el-form-item></el-form>
      <template #footer><el-button @click="planDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="savePlanForm">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getXyReservationConfiguration, saveXyPlan, saveXySeat, saveXySlot, saveXyStore } from '@/api/xy'
import auth from '@/plugins/auth'

const tab = ref('stores'), loading = ref(false), saving = ref(false), storeId = ref()
const stores = ref([]), slots = ref([]), seats = ref([]), plans = ref([])
const storeDialog = ref(false), slotDialog = ref(false), seatDialog = ref(false), planDialog = ref(false)
const store = ref({}), slot = ref({}), seat = ref({}), plan = ref({})
const storeEnabled = ref(true), slotEnabled = ref(true), seatEnabled = ref(true), planEnabled = ref(true)
const slotRange = ref(['10:00', '12:00'])
const filteredSlots = computed(() => slots.value.filter(item => item.storeId === storeId.value))
const filteredSeats = computed(() => seats.value.filter(item => item.storeId === storeId.value))
const selectedStore = computed(() => stores.value.find(item => item.storeId === storeId.value))
const enabledStores = computed(() => stores.value.filter(item => item.status === '0').length)
const canManagePlans = computed(() => auth.hasPermi('xy:member:plan'))
const monthlyPlan = computed(() => plans.value.filter(item => Number(item.durationDays) === 30).sort((a, b) => (a.status === '0' ? -1 : 1) - (b.status === '0' ? -1 : 1))[0] || null)
const monthlyPlanRows = computed(() => monthlyPlan.value ? [monthlyPlan.value] : [])

async function load() {
  loading.value = true
  try {
    const data = await getXyReservationConfiguration()
    stores.value = data.stores || []; slots.value = data.slots || []; seats.value = data.seats || []; plans.value = data.plans || []
    if ((!storeId.value || !stores.value.some(item => item.storeId === storeId.value)) && stores.value.length) storeId.value = stores.value[0].storeId
  } finally { loading.value = false }
}
function editStore(row = {}) { store.value = { ...row }; storeEnabled.value = row.status !== '1'; storeDialog.value = true }
const hasCoordinates = row => row?.longitude !== null && row?.longitude !== undefined && row?.longitude !== '' && row?.latitude !== null && row?.latitude !== undefined && row?.latitude !== ''
function openCoordinatePicker() { window.open('https://lbs.qq.com/getPoint/', '_blank', 'noopener,noreferrer') }
function editSlot(row = {}) { slot.value = { sortOrder: 0, ...row }; slotRange.value = row.slotId ? [row.startTime, row.endTime] : ['10:00', '12:00']; slotEnabled.value = row.status !== '1'; slotDialog.value = true }
function editSeat(row = {}) { seat.value = { sortOrder: 0, ...row }; seatEnabled.value = row.status !== '1'; seatDialog.value = true }
function editPlan(row = monthlyPlan.value || {}) { plan.value = { amount: 0.01, sortOrder: 0, ...row, durationDays: 30, dailyReservationLimit: 1 }; planEnabled.value = row.status !== '1'; planDialog.value = true }
async function commit(action, close) { saving.value = true; try { await action(); close.value = false; ElMessage.success('已保存'); await load() } finally { saving.value = false } }
const saveStoreForm = () => {
  if (!store.value.storeName?.trim() || !store.value.address?.trim() || !store.value.phone?.trim() || !store.value.businessHours?.trim()) { ElMessage.warning('请完整填写门店名称、地址、电话和营业时间'); return }
  const longitude = store.value.longitude
  const latitude = store.value.latitude
  const hasLongitude = longitude !== null && longitude !== undefined && longitude !== ''
  const hasLatitude = latitude !== null && latitude !== undefined && latitude !== ''
  if (hasLongitude !== hasLatitude) { ElMessage.warning('门店经度和纬度需要同时填写'); return }
  if (hasLongitude && (Number(longitude) < -180 || Number(longitude) > 180 || Number(latitude) < -90 || Number(latitude) > 90)) { ElMessage.warning('请填写有效的门店经纬度'); return }
  return commit(() => saveXyStore({ ...store.value, status: storeEnabled.value ? '0' : '1' }), storeDialog)
}
const saveSlotForm = () => {
  if (!Array.isArray(slotRange.value) || slotRange.value.length !== 2) { ElMessage.warning('请选择完整的开始和结束时间'); return }
  const [startTime, endTime] = slotRange.value
  if (startTime >= endTime) { ElMessage.warning('结束时间必须晚于开始时间'); return }
  const overlaps = filteredSlots.value.some(item => item.status !== '1' && item.slotId !== slot.value.slotId && startTime < item.endTime && endTime > item.startTime)
  if (overlaps) { ElMessage.warning('该时段与现有预约时段重叠'); return }
  return commit(() => saveXySlot({ ...slot.value, storeId: storeId.value, startTime, endTime, status: slotEnabled.value ? '0' : '1' }), slotDialog)
}
const saveSeatForm = () => {
  if (!seat.value.seatCode?.trim()) { ElMessage.warning('请填写座位编号'); return }
  return commit(() => saveXySeat({ ...seat.value, storeId: storeId.value, status: seatEnabled.value ? '0' : '1' }), seatDialog)
}
const savePlanForm = () => {
  if (!plan.value.planName?.trim() || Number(plan.value.amount) <= 0) { ElMessage.warning('请填写方案名称和有效售价'); return }
  return commit(() => saveXyPlan({ ...plan.value, durationDays: 30, dailyReservationLimit: 1, status: planEnabled.value ? '0' : '1' }), planDialog)
}
onMounted(load)
</script>

<style scoped>
.config-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.config-section :deep(.el-tab-pane) { min-height: 280px; }
.selected-store { color: var(--xy-primary-deep); font-size: 12px; font-weight: 650; }
.toolbar-note { color: var(--xy-muted); font-size: 12px; }
.plan-tip { margin: 18px 24px; }
.dialog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.dialog-grid .el-input-number { width: 100%; }
.coordinate-help { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: -2px 0 18px; padding: 12px 14px; border-radius: 10px; background: var(--xy-mint); color: var(--xy-ink-2); font-size: 12px; line-height: 1.55; }
.coordinate-help span { flex: 1; }
@media (max-width: 1100px) { .config-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .config-stats, .dialog-grid { grid-template-columns: 1fr; } }
</style>
