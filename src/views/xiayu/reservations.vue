<template>
  <div class="page">
    <div class="toolbar"><el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" @change="load" /><el-select v-model="status" clearable placeholder="全部状态" @change="load"><el-option label="待到场" value="BOOKED" /><el-option label="已签到" value="CHECKED_IN" /><el-option label="已取消" value="CANCELED" /><el-option label="爽约" value="NO_SHOW" /></el-select><el-button :loading="loading" @click="load">刷新</el-button></div>
    <el-table :data="reservations" v-loading="loading" empty-text="暂无预约数据"><el-table-column prop="reservationNo" label="预约单号" min-width="190" /><el-table-column prop="reservationDate" label="日期" width="120" /><el-table-column label="时段" width="130"><template #default="scope">{{ scope.row.startTime }}-{{ scope.row.endTime }}</template></el-table-column><el-table-column label="座位" min-width="120"><template #default="scope">{{ scope.row.zoneName ? `${scope.row.zoneName} · ` : '' }}{{ scope.row.seatCode }}</template></el-table-column><el-table-column prop="nickname" label="会员" min-width="120" /><el-table-column prop="mobile" label="手机" min-width="130" /><el-table-column label="状态" width="120"><template #default="scope">{{ statusLabel(scope.row.status) }}</template></el-table-column><el-table-column label="操作" width="100"><template #default="scope"><el-button v-if="scope.row.status === 'BOOKED'" v-hasPermi="['xy:reservation:verify']" link type="primary" @click="verify(scope.row)">签到</el-button></template></el-table-column></el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getXyReservations, verifyXyReservation } from '@/api/xy'
const pad = value => String(value).padStart(2, '0')
const now = new Date()
const date = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`); const status = ref(''); const reservations = ref([]); const loading = ref(false)
const statusLabel = value => ({ BOOKED: '待到场', CHECKED_IN: '已签到', CANCELED: '已取消', NO_SHOW: '已爽约' }[value] || value || '—')
async function load() { loading.value = true; try { reservations.value = await getXyReservations(date.value, status.value) } finally { loading.value = false } }
async function verify(row) {
  try { await ElMessageBox.confirm(`确认将 ${row.nickname || '该会员'} 的预约标记为已签到？`, '签到确认', { type: 'warning' }) } catch { return }
  await verifyXyReservation(row.verifyCode); ElMessage.success('已签到'); load()
}
onMounted(load)
</script>

<style scoped>.page{background:#fff;padding:20px;border-radius:16px}.toolbar{display:flex;gap:12px;margin-bottom:18px}</style>
