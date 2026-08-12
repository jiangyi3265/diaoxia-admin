<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="dashboard-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">经营总览</span>
        <h2 id="dashboard-title" class="xy-page-title">今天的经营情况，一眼看清</h2>
        <p class="xy-page-description">汇总今日预约、有效会员、待处理订单和实收金额。数据来自正式运营接口，刷新后即时更新。</p>
      </div>
      <div class="xy-page-actions">
        <el-button :loading="loading" @click="load">刷新数据</el-button>
      </div>
    </section>

    <section class="xy-stat-grid" aria-label="核心经营指标">
      <article v-for="item in cards" :key="item.label" class="xy-stat">
        <span class="xy-stat-label">{{ item.label }}</span>
        <strong class="xy-stat-value">{{ item.prefix }}{{ formatValue(item.value) }}</strong>
        <span class="xy-stat-note">{{ item.note }}</span>
      </article>
    </section>

    <section class="xy-section xy-section-pad">
      <div class="readiness">
        <div>
          <span class="readiness-label">运营准备度</span>
          <h3>基础资料与业务数据</h3>
          <p>完成门店、预约时段、座位和会员方案配置后，小程序即可展示可预约资源。</p>
        </div>
        <el-button type="primary" plain @click="router.push('/xiayu/seats')">前往配置</el-button>
      </div>
      <el-empty v-if="!loading && isEmpty" description="当前还没有业务数据，请先完成门店与座位时段配置。">
        <el-button type="primary" @click="router.push('/xiayu/seats')">配置经营资料</el-button>
      </el-empty>
      <div v-else class="xy-inline-note">待支付订单会保留在业务统计中。当前未接入微信支付，线下收款请到“商城管理 → 线下收款”处理。</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getXyDashboard } from '@/api/xy'

const router = useRouter()
const loading = ref(false)
const summary = ref({ todayReservations: 0, activeMembers: 0, pendingOrders: 0, todayPaidAmount: 0 })
const cards = computed(() => [
  { label: '今日预约', value: summary.value.todayReservations, prefix: '', note: '今天已提交的预约' },
  { label: '有效会员', value: summary.value.activeMembers, prefix: '', note: '当前仍在有效期内' },
  { label: '待支付订单', value: summary.value.pendingOrders, prefix: '', note: '需要跟进线下收款' },
  { label: '今日实收', value: summary.value.todayPaidAmount, prefix: '¥', note: '今日已确认收款金额' }
])
const isEmpty = computed(() => cards.value.every(item => Number(item.value) === 0))
const formatValue = value => Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

async function load() {
  loading.value = true
  try { summary.value = await getXyDashboard() } finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.readiness { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.readiness-label { color: var(--xy-primary-deep); font-size: 11px; font-weight: 700; letter-spacing: .1em; }
.readiness h3 { margin: 5px 0 6px; color: var(--xy-ink); font-size: 17px; }
.readiness p { max-width: 62ch; margin: 0; color: var(--xy-ink-3); font-size: 12px; line-height: 1.7; }
.xy-inline-note { margin-top: 20px; }
@media (max-width: 640px) { .readiness { align-items: flex-start; flex-direction: column; } }
</style>
