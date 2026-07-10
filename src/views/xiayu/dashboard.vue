<template>
  <div class="dashboard">
    <div class="header"><div><h2>运营数据看板</h2><p>所有数据来自已登录的运营接口。</p></div><el-button :loading="loading" @click="load">刷新数据</el-button></div>
    <div class="grid">
      <div v-for="item in cards" :key="item.label" class="card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
    </div>
    <el-empty v-if="!loading && cards.every(item => Number(item.value) === 0)" description="暂无业务数据，请先在座位时段页配置门店、套餐和座位。" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getXyDashboard } from '@/api/xy'

const loading = ref(false)
const summary = ref({ todayReservations: 0, activeMembers: 0, pendingOrders: 0, todayPaidAmount: 0 })
const cards = computed(() => [
  { label: '今日预约', value: summary.value.todayReservations },
  { label: '有效会员', value: summary.value.activeMembers },
  { label: '待支付订单', value: summary.value.pendingOrders },
  { label: '今日实收（元）', value: summary.value.todayPaidAmount }
])
async function load() { loading.value = true; try { summary.value = await getXyDashboard() } finally { loading.value = false } }
onMounted(load)
</script>

<style scoped>
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }.header h2 { margin:0; color:#142320; }.header p { color:#6a7d79; }.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }.card { padding:24px; border-radius:16px; background:#fff; box-shadow:0 4px 18px rgba(16,78,74,.08); }.card span { color:#6a7d79; }.card strong { display:block; margin-top:14px; font-size:32px; color:#0e9c8e; } @media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}
</style>
