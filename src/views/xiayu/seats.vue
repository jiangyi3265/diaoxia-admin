<template>
  <div class="page">
    <div class="toolbar">
      <el-select v-model="storeId" placeholder="选择门店" clearable>
        <el-option v-for="item in stores" :key="item.storeId" :label="item.storeName" :value="item.storeId" />
      </el-select>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </div>

    <el-tabs v-model="tab">
      <el-tab-pane label="门店" name="stores">
        <el-button type="primary" @click="editStore()">新增门店</el-button>
        <el-table :data="stores" empty-text="暂无门店">
          <el-table-column prop="storeName" label="门店" />
          <el-table-column prop="address" label="地址" min-width="220" />
          <el-table-column prop="phone" label="电话" />
          <el-table-column prop="businessHours" label="营业时间" />
          <el-table-column label="状态" width="90"><template #default="s">{{ s.row.status === '0' ? '营业' : '停业' }}</template></el-table-column>
          <el-table-column label="操作" width="90"><template #default="s"><el-button link type="primary" @click="editStore(s.row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="预约时段" name="slots">
        <el-button type="primary" :disabled="!storeId" @click="editSlot()">新增时段</el-button>
        <el-table :data="filteredSlots" empty-text="请先选择门店">
          <el-table-column prop="startTime" label="开始" /><el-table-column prop="endTime" label="结束" />
          <el-table-column prop="sortOrder" label="排序" /><el-table-column label="状态"><template #default="s">{{ s.row.status === '0' ? '启用' : '停用' }}</template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editSlot(s.row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="座位" name="seats">
        <el-button type="primary" :disabled="!storeId" @click="editSeat()">新增座位</el-button>
        <el-table :data="filteredSeats" empty-text="请先选择门店">
          <el-table-column prop="seatCode" label="座位编号" /><el-table-column prop="zoneName" label="区域" />
          <el-table-column prop="sortOrder" label="排序" /><el-table-column label="状态"><template #default="s">{{ s.row.status === '0' ? '启用' : '停用' }}</template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editSeat(s.row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="会员套餐" name="plans">
        <el-button type="primary" @click="editPlan()">新增套餐</el-button>
        <el-table :data="plans" empty-text="暂无套餐">
          <el-table-column prop="planName" label="套餐" /><el-table-column prop="amount" label="售价" />
          <el-table-column prop="durationDays" label="有效天数" /><el-table-column prop="dailyReservationLimit" label="每日预约上限" />
          <el-table-column label="状态"><template #default="s">{{ s.row.status === '0' ? '上架' : '下架' }}</template></el-table-column>
          <el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="editPlan(s.row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="storeDialog" title="门店配置" width="560px">
      <el-form label-width="90px"><el-form-item label="门店名称"><el-input v-model="store.storeName" /></el-form-item><el-form-item label="地址"><el-input v-model="store.address" /></el-form-item><el-form-item label="电话"><el-input v-model="store.phone" /></el-form-item><el-form-item label="营业时间"><el-input v-model="store.businessHours" placeholder="例如 10:00-22:00" /></el-form-item><el-form-item label="经度"><el-input-number v-model="store.longitude" :precision="7" /></el-form-item><el-form-item label="纬度"><el-input-number v-model="store.latitude" :precision="7" /></el-form-item><el-form-item label="营业"><el-switch v-model="storeEnabled" /></el-form-item></el-form>
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

    <el-dialog v-model="planDialog" title="会员套餐" width="500px">
      <el-form label-width="110px"><el-form-item label="套餐名称"><el-input v-model="plan.planName" /></el-form-item><el-form-item label="售价"><el-input-number v-model="plan.amount" :min="0.01" :precision="2" /></el-form-item><el-form-item label="有效天数"><el-input-number v-model="plan.durationDays" :min="1" /></el-form-item><el-form-item label="每日预约上限"><el-input-number v-model="plan.dailyReservationLimit" :min="1" /></el-form-item><el-form-item label="排序"><el-input-number v-model="plan.sortOrder" :min="0" /></el-form-item><el-form-item label="上架"><el-switch v-model="planEnabled" /></el-form-item></el-form>
      <template #footer><el-button @click="planDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="savePlanForm">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getXyReservationConfiguration, saveXyPlan, saveXySeat, saveXySlot, saveXyStore } from '@/api/xy'

const tab = ref('stores'), loading = ref(false), saving = ref(false), storeId = ref()
const stores = ref([]), slots = ref([]), seats = ref([]), plans = ref([])
const storeDialog = ref(false), slotDialog = ref(false), seatDialog = ref(false), planDialog = ref(false)
const store = ref({}), slot = ref({}), seat = ref({}), plan = ref({})
const storeEnabled = ref(true), slotEnabled = ref(true), seatEnabled = ref(true), planEnabled = ref(true)
const slotRange = ref(['10:00', '12:00'])
const filteredSlots = computed(() => slots.value.filter(item => item.storeId === storeId.value))
const filteredSeats = computed(() => seats.value.filter(item => item.storeId === storeId.value))

async function load() {
  loading.value = true
  try {
    const data = await getXyReservationConfiguration()
    stores.value = data.stores; slots.value = data.slots; seats.value = data.seats; plans.value = data.plans
    if ((!storeId.value || !stores.value.some(item => item.storeId === storeId.value)) && stores.value.length) storeId.value = stores.value[0].storeId
  } finally { loading.value = false }
}
function editStore(row = {}) { store.value = { ...row }; storeEnabled.value = row.status !== '1'; storeDialog.value = true }
function editSlot(row = {}) { slot.value = { sortOrder: 0, ...row }; slotRange.value = row.slotId ? [row.startTime, row.endTime] : ['10:00', '12:00']; slotEnabled.value = row.status !== '1'; slotDialog.value = true }
function editSeat(row = {}) { seat.value = { sortOrder: 0, ...row }; seatEnabled.value = row.status !== '1'; seatDialog.value = true }
function editPlan(row = {}) { plan.value = { amount: 0.01, durationDays: 30, dailyReservationLimit: 1, sortOrder: 0, ...row }; planEnabled.value = row.status !== '1'; planDialog.value = true }
async function commit(action, close) { saving.value = true; try { await action(); close.value = false; ElMessage.success('已保存'); await load() } finally { saving.value = false } }
const saveStoreForm = () => commit(() => saveXyStore({ ...store.value, status: storeEnabled.value ? '0' : '1' }), storeDialog)
const saveSlotForm = () => commit(() => saveXySlot({ ...slot.value, storeId: storeId.value, startTime: slotRange.value[0], endTime: slotRange.value[1], status: slotEnabled.value ? '0' : '1' }), slotDialog)
const saveSeatForm = () => commit(() => saveXySeat({ ...seat.value, storeId: storeId.value, status: seatEnabled.value ? '0' : '1' }), seatDialog)
const savePlanForm = () => commit(() => saveXyPlan({ ...plan.value, status: planEnabled.value ? '0' : '1' }), planDialog)
onMounted(load)
</script>

<style scoped>.page{padding:20px;background:#fff;border-radius:16px}.toolbar{display:flex;gap:12px;margin-bottom:12px}.el-tabs .el-button{margin-bottom:14px}</style>
