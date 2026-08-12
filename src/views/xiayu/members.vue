<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="members-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">会员运营</span>
        <h2 id="members-title" class="xy-page-title">会员资料与权益状态</h2>
        <p class="xy-page-description">查询会员身份、联系方式、邀请码和会员卡有效期。会员购买产生的待支付单可在线下收款页确认到账。</p>
      </div>
      <div class="xy-page-actions">
        <el-button :loading="loading" @click="load">刷新名单</el-button>
      </div>
    </section>

    <section class="xy-stat-grid member-stats" aria-label="会员统计">
      <article class="xy-stat"><span class="xy-stat-label">当前名单</span><strong class="xy-stat-value">{{ members.length }}</strong><span class="xy-stat-note">本次查询结果</span></article>
      <article class="xy-stat"><span class="xy-stat-label">有效会员</span><strong class="xy-stat-value">{{ activeCount }}</strong><span class="xy-stat-note">仍在会员期内</span></article>
      <article class="xy-stat"><span class="xy-stat-label">即将到期</span><strong class="xy-stat-value">{{ expiringCount }}</strong><span class="xy-stat-note">未来 7 天内到期</span></article>
    </section>

    <section class="xy-section">
      <div class="xy-section-head">
        <div><h3>会员名单</h3><p>支持按昵称、手机号或邀请码快速定位。</p></div>
      </div>
      <div class="xy-toolbar" role="search">
        <el-input v-model.trim="keyword" clearable placeholder="输入昵称、手机号或邀请码" aria-label="搜索会员" @clear="load" @keyup.enter="load" />
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
        <el-button v-if="keyword" @click="resetSearch">重置</el-button>
      </div>
      <div class="xy-table-wrap">
        <el-table :data="members" v-loading="loading" empty-text="没有找到符合条件的会员">
          <el-table-column prop="memberId" label="ID" width="86" />
          <el-table-column prop="nickname" label="会员" min-width="140"><template #default="s"><strong class="member-name">{{ s.row.nickname || '微信用户' }}</strong></template></el-table-column>
          <el-table-column prop="mobile" label="手机号" min-width="130"><template #default="s"><span class="xy-date">{{ s.row.mobile || '未绑定' }}</span></template></el-table-column>
          <el-table-column prop="inviteCode" label="邀请码" min-width="115"><template #default="s"><span class="xy-code">{{ s.row.inviteCode || '—' }}</span></template></el-table-column>
          <el-table-column prop="cardNo" label="会员卡号" min-width="160"><template #default="s"><span class="xy-code">{{ s.row.cardNo || '尚未开通' }}</span></template></el-table-column>
          <el-table-column prop="expireDate" label="到期日" min-width="120"><template #default="s"><span class="xy-date">{{ s.row.expireDate || '—' }}</span></template></el-table-column>
          <el-table-column label="卡状态" width="118"><template #default="s"><span class="xy-status" :class="statusClass(s.row.cardStatus)">{{ cardStatusLabel(s.row.cardStatus) }}</span></template></el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getXyMembers } from '@/api/xy'

const keyword = ref('')
const members = ref([])
const loading = ref(false)
const activeStatuses = ['ACTIVE', 'VALID', '0']
const activeCount = computed(() => members.value.filter(item => activeStatuses.includes(String(item.cardStatus))).length)
const expiringCount = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const limit = new Date(today); limit.setDate(limit.getDate() + 7)
  return members.value.filter(item => {
    if (!item.expireDate) return false
    const date = new Date(`${item.expireDate}T00:00:00`)
    return date >= today && date <= limit
  }).length
})
const cardStatusLabel = value => ({ ACTIVE: '有效', VALID: '有效', 0: '有效', EXPIRED: '已到期', INACTIVE: '未开通', NONE: '未开通', 1: '已失效' }[value] || value || '未开通')
const statusClass = value => activeStatuses.includes(String(value)) ? 'xy-status--success' : (String(value) === 'EXPIRED' ? 'xy-status--warning' : 'xy-status--muted')

async function load() {
  loading.value = true
  try { members.value = await getXyMembers(keyword.value) } finally { loading.value = false }
}
function resetSearch() { keyword.value = ''; load() }
onMounted(load)
</script>

<style scoped>
.member-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.xy-toolbar .el-input { width: min(360px, 100%); }
.member-name { color: var(--xy-ink); font-size: 13px; font-weight: 680; }
@media (max-width: 720px) { .member-stats { grid-template-columns: 1fr; } }
</style>
