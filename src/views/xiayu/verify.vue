<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="verify-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">现场核销</span>
        <h2 id="verify-title" class="xy-page-title">输入核销码，完成现场确认</h2>
        <p class="xy-page-description">优先输入顾客小程序展示的4位会员码，系统会核验会员身份并自动签到当天待到场预约。8位预约码仍可作为备用核销方式。</p>
      </div>
      <div class="xy-page-actions"><el-button :loading="loading" @click="load">刷新记录</el-button></div>
    </section>

    <section class="verify-panel" aria-label="核销操作">
      <div class="verify-copy"><span class="verify-step">01</span><div><h3>录入4位会员码</h3><p>会员码每10秒更新。输入4位码后按 Enter，即可核验身份并签到当天预约。</p></div></div>
      <div class="verify-action">
        <el-input v-model="code" size="large" maxlength="8" clearable autocomplete="off" inputmode="numeric" placeholder="输入4位会员码或8位预约码" aria-label="会员码或预约码" @input="normalizeCode" @keyup.enter="verifySmart" />
        <div class="verify-buttons">
          <el-button type="primary" size="large" :loading="verifyingType === 'member'" :disabled="Boolean(verifyingType)" @click="verifyMember">4位会员码签到</el-button>
          <el-button size="large" :loading="verifyingType === 'reservation'" :disabled="Boolean(verifyingType)" @click="verifyReservation">8位预约码签到</el-button>
        </div>
      </div>
    </section>

    <section class="xy-section">
      <div class="xy-section-head"><div><h3>最近核销记录</h3><p>展示预约核销结果，便于交班核对。</p></div><span class="record-count">{{ rows.length }} 条</span></div>
      <div class="xy-table-wrap">
        <el-table :data="rows" v-loading="loading" empty-text="暂无预约核销记录">
          <el-table-column prop="reservationNo" label="预约单号" min-width="190"><template #default="s"><span class="xy-code">{{ s.row.reservationNo }}</span></template></el-table-column>
          <el-table-column prop="verifyCode" label="核销码" min-width="130"><template #default="s"><span class="xy-code">{{ s.row.verifyCode }}</span></template></el-table-column>
          <el-table-column prop="nickname" label="会员" min-width="120"><template #default="s">{{ s.row.nickname || '微信用户' }}</template></el-table-column>
          <el-table-column prop="seatCode" label="座位" width="100" />
          <el-table-column label="时段" width="130"><template #default="s"><span class="xy-date">{{ s.row.startTime }}–{{ s.row.endTime }}</span></template></el-table-column>
          <el-table-column label="状态" width="112"><template #default="s"><span class="xy-status" :class="statusClass(s.row.status)">{{ statusLabel(s.row.status) }}</span></template></el-table-column>
          <el-table-column prop="checkinTime" label="签到时间" min-width="170"><template #default="s"><span class="xy-date">{{ s.row.checkinTime || '—' }}</span></template></el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getXyVerificationRecords, verifyXyReservation, verifyXyMember } from '@/api/xy'

const rows = ref([])
const loading = ref(false)
const verifyingType = ref('')
const code = ref('')
const statusLabel = value => ({ CHECKED_IN: '已签到', BOOKED: '待到场', CANCELED: '已取消', NO_SHOW: '已爽约' }[value] || value || '未知')
const statusClass = value => ({ CHECKED_IN: 'xy-status--success', BOOKED: 'xy-status--warning', CANCELED: 'xy-status--muted', NO_SHOW: 'xy-status--danger' }[value] || 'xy-status--muted')

async function load() {
  loading.value = true
  try { rows.value = await getXyVerificationRecords() } finally { loading.value = false }
}
function normalizeCode(value) { code.value = String(value || '').replace(/\D/g, '').slice(0, 8) }
async function run(type, fn) {
  const value = code.value.trim()
  if (!value) { ElMessage.warning('请先输入核销码'); return }
  if (type === 'member' && !/^\d{4}$/.test(value)) { ElMessage.warning('会员码必须是4位数字'); return }
  if (type === 'reservation' && !/^\d{8}$/.test(value)) { ElMessage.warning('预约码必须是8位数字'); return }
  verifyingType.value = type
  try {
    const result = await fn(value)
    const message = type === 'member'
      ? (result?.reservationCheckedIn ? '会员核验成功，预约签到已完成' : '会员核验成功，今天没有待签到预约')
      : '预约签到已完成'
    ElMessage.success(message)
    code.value = ''
    await load()
  } finally { verifyingType.value = '' }
}
const verifyReservation = () => run('reservation', verifyXyReservation)
const verifyMember = () => run('member', verifyXyMember)
const verifySmart = () => /^\d{4}$/.test(code.value) ? verifyMember() : /^\d{8}$/.test(code.value) ? verifyReservation() : ElMessage.warning('请输入4位会员码或8位预约码')
onMounted(load)
</script>

<style scoped>
.verify-panel { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(360px, 1.2fr); gap: 30px; padding: 27px 30px 30px; border-radius: 19px; background: #103a37; color: #fff; box-shadow: 0 16px 36px rgba(7, 50, 46, .2); }
.verify-copy { display: flex; align-items: flex-start; gap: 14px; }
.verify-step { color: #7fd6cb; font-family: Consolas, monospace; font-size: 12px; font-weight: 700; }
.verify-copy h3 { margin: 0 0 7px; font-size: 18px; }
.verify-copy p { max-width: 42ch; margin: 0; color: rgba(255,255,255,.62); font-size: 12px; line-height: 1.7; }
.verify-action { display: grid; gap: 12px; }
.verify-buttons { display: flex; gap: 10px; }
.verify-buttons .el-button { flex: 1; margin: 0; }
.record-count { color: var(--xy-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
@media (max-width: 840px) { .verify-panel { grid-template-columns: 1fr; gap: 20px; } }
@media (max-width: 520px) { .verify-panel { padding: 22px 18px; border-radius: 15px; } .verify-buttons { flex-direction: column; } }
</style>
