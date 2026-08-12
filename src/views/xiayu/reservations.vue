<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="reservations-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">到店运营</span>
        <h2 id="reservations-title" class="xy-page-title">预约排期与到店状态</h2>
        <p class="xy-page-description">按日期和状态查看预约，及时完成签到。座位与时段调整请在“座位时段”页面操作。</p>
      </div>
      <div class="xy-page-actions">
        <el-button :loading="loading" @click="load">刷新预约</el-button>
      </div>
    </section>

    <section class="xy-stat-grid reservation-stats" aria-label="预约状态统计">
      <article v-for="item in statusStats" :key="item.label" class="xy-stat">
        <span class="xy-stat-label">{{ item.label }}</span><strong class="xy-stat-value">{{ item.value }}</strong><span class="xy-stat-note">{{ item.note }}</span>
      </article>
    </section>

    <section class="xy-section">
      <div class="xy-section-head"><div><h3>{{ date || '全部日期' }} 预约清单</h3><p>签到操作会立即改变预约状态，请现场核对会员信息。</p></div></div>
      <div class="xy-toolbar" aria-label="预约筛选">
        <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" :clearable="false" placeholder="选择日期" aria-label="预约日期" @change="load" />
        <el-select v-model="status" clearable placeholder="全部状态" aria-label="预约状态" @change="load">
          <el-option label="待到场" value="BOOKED" /><el-option label="已签到" value="CHECKED_IN" /><el-option label="已取消" value="CANCELED" /><el-option label="已爽约" value="NO_SHOW" />
        </el-select>
        <el-button v-if="status" @click="status = ''; load()">清除状态</el-button>
      </div>
      <div class="xy-table-wrap">
        <el-table :data="reservations" v-loading="loading" empty-text="所选条件下暂无预约">
          <el-table-column prop="reservationNo" label="预约单号" min-width="195"><template #default="s"><span class="xy-code">{{ s.row.reservationNo }}</span></template></el-table-column>
          <el-table-column prop="reservationDate" label="日期" width="118"><template #default="s"><span class="xy-date">{{ s.row.reservationDate }}</span></template></el-table-column>
          <el-table-column label="时段" width="130"><template #default="s"><span class="xy-date">{{ s.row.startTime }}–{{ s.row.endTime }}</span></template></el-table-column>
          <el-table-column label="座位" min-width="130"><template #default="s"><strong class="seat-name">{{ s.row.zoneName ? `${s.row.zoneName} · ` : '' }}{{ s.row.seatCode }}</strong></template></el-table-column>
          <el-table-column prop="nickname" label="会员" min-width="120"><template #default="s">{{ s.row.nickname || '微信用户' }}</template></el-table-column>
          <el-table-column prop="mobile" label="手机" min-width="130"><template #default="s"><span class="xy-date">{{ s.row.mobile || '未绑定' }}</span></template></el-table-column>
          <el-table-column label="状态" width="118"><template #default="s"><span class="xy-status" :class="statusClass(s.row.status)">{{ statusLabel(s.row.status) }}</span></template></el-table-column>
          <el-table-column label="操作" width="92" fixed="right"><template #default="s"><el-button v-if="s.row.status === 'BOOKED'" v-hasPermi="['xy:reservation:verify']" link type="primary" @click="verify(s.row)">确认签到</el-button><span v-else class="no-action">—</span></template></el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getXyReservations, verifyXyReservation } from '@/api/xy'

const pad = value => String(value).padStart(2, '0')
const now = new Date()
const date = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
const status = ref('')
const reservations = ref([])
const loading = ref(false)
const countStatus = value => reservations.value.filter(item => item.status === value).length
const statusStats = computed(() => [
  { label: '全部预约', value: reservations.value.length, note: '当前筛选结果' },
  { label: '待到场', value: countStatus('BOOKED'), note: '需要现场跟进' },
  { label: '已签到', value: countStatus('CHECKED_IN'), note: '已完成到店确认' },
  { label: '异常结束', value: countStatus('CANCELED') + countStatus('NO_SHOW'), note: '取消或爽约' }
])
const statusLabel = value => ({ BOOKED: '待到场', CHECKED_IN: '已签到', CANCELED: '已取消', NO_SHOW: '已爽约' }[value] || value || '未知')
const statusClass = value => ({ BOOKED: 'xy-status--warning', CHECKED_IN: 'xy-status--success', CANCELED: 'xy-status--muted', NO_SHOW: 'xy-status--danger' }[value] || 'xy-status--muted')

async function load() {
  if (!date.value) return
  loading.value = true
  try { reservations.value = await getXyReservations(date.value, status.value) } finally { loading.value = false }
}
async function verify(row) {
  try { await ElMessageBox.confirm(`确认 ${row.nickname || '该会员'} 已到店，并核销本次预约？`, '确认签到', { type: 'warning', confirmButtonText: '确认签到', cancelButtonText: '返回核对' }) } catch { return }
  await verifyXyReservation(row.verifyCode)
  ElMessage.success('签到已记录')
  await load()
}
onMounted(load)
</script>

<style scoped>
.reservation-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.xy-toolbar .el-select { width: 180px; }
.seat-name { color: var(--xy-ink); font-size: 13px; font-weight: 680; }
.no-action { color: var(--xy-muted); }
@media (max-width: 1100px) { .reservation-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .reservation-stats { grid-template-columns: 1fr; } }
</style>
