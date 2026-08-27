<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="members-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">会员运营</span>
        <h2 id="members-title" class="xy-page-title">会员资料与权益状态</h2>
        <p class="xy-page-description">查询会员身份、联系方式、邀请码和会员卡有效期。会员购买产生的待支付单可在线下收款页确认到账。</p>
      </div>
      <div class="xy-page-actions">
        <el-button v-hasPermi="['xy:member:edit']" type="primary" @click="editMember()">新建会员</el-button>
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
          <el-table-column label="账号状态" width="108"><template #default="s"><span class="xy-status" :class="s.row.memberStatus === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.memberStatus === '0' ? '正常' : '停用' }}</span></template></el-table-column>
          <el-table-column label="操作" width="142" fixed="right"><template #default="s">
            <el-button v-hasPermi="['xy:member:edit']" link type="primary" @click="editMember(s.row)">编辑</el-button>
            <el-button v-hasPermi="['xy:member:edit']" link type="danger" @click="removeMember(s.row)">删除</el-button>
          </template></el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog v-model="memberDialog" :title="memberForm.memberId ? '编辑会员' : '新建会员'" width="500px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="会员昵称" required><el-input v-model.trim="memberForm.nickname" maxlength="100" show-word-limit placeholder="请输入会员昵称" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model.trim="memberForm.mobile" maxlength="11" inputmode="numeric" placeholder="选填，用于预约联系" /></el-form-item>
        <el-form-item label="账号状态"><el-switch v-model="memberEnabled" active-text="正常" inactive-text="停用" /></el-form-item>
        <div class="member-form-note">后台新建会员默认没有会员卡；如会员已有预约、会员卡或财务记录，为保留账目只能停用，不能直接删除。</div>
      </el-form>
      <template #footer><el-button @click="memberDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveMemberForm">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteXyMember, getXyMembers, saveXyMember } from '@/api/xy'

const keyword = ref('')
const members = ref([])
const loading = ref(false)
const saving = ref(false)
const memberDialog = ref(false)
const memberForm = ref({})
const memberEnabled = ref(true)
const activeStatuses = ['ACTIVE', 'VALID', '0']
const activeCount = computed(() => members.value.filter(item => item.memberStatus === '0' && activeStatuses.includes(String(item.cardStatus))).length)
const expiringCount = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const limit = new Date(today); limit.setDate(limit.getDate() + 7)
  return members.value.filter(item => {
    if (!item.expireDate) return false
    const date = new Date(`${item.expireDate}T00:00:00`)
    return item.memberStatus === '0' && date >= today && date <= limit
  }).length
})
const cardStatusLabel = value => ({ ACTIVE: '有效', VALID: '有效', 0: '有效', PENDING: '未生效', EXPIRED: '已到期', REFUNDED: '已退款', INACTIVE: '未开通', NONE: '未开通', 1: '已失效' }[value] || value || '未开通')
const statusClass = value => activeStatuses.includes(String(value)) ? 'xy-status--success' : (String(value) === 'EXPIRED' ? 'xy-status--warning' : 'xy-status--muted')

async function load() {
  loading.value = true
  try { members.value = await getXyMembers(keyword.value) } finally { loading.value = false }
}
function resetSearch() { keyword.value = ''; load() }
function editMember(row = {}) {
  memberForm.value = { memberId: row.memberId, nickname: row.nickname || '', mobile: row.mobile || '' }
  memberEnabled.value = row.memberStatus !== '1'
  memberDialog.value = true
}
async function saveMemberForm() {
  const nickname = memberForm.value.nickname?.trim()
  const mobile = memberForm.value.mobile?.trim() || ''
  if (!nickname) { ElMessage.warning('请填写会员昵称'); return }
  if (mobile && !/^1\d{10}$/.test(mobile)) { ElMessage.warning('请填写正确的11位手机号'); return }
  saving.value = true
  try {
    await saveXyMember({ ...memberForm.value, nickname, mobile, memberStatus: memberEnabled.value ? '0' : '1' })
    ElMessage.success(memberForm.value.memberId ? '会员信息已更新' : '会员已创建')
    memberDialog.value = false
    await load()
  } finally { saving.value = false }
}
async function removeMember(row) {
  try { await ElMessageBox.confirm(`确认删除会员“${row.nickname || row.memberId}”？已有业务记录的会员将禁止删除。`, '删除会员', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }) } catch { return }
  await deleteXyMember(row.memberId)
  ElMessage.success('会员已删除')
  await load()
}
onMounted(load)
</script>

<style scoped>
.member-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.xy-toolbar .el-input { width: min(360px, 100%); }
.member-name { color: var(--xy-ink); font-size: 13px; font-weight: 680; }
.member-form-note { padding: 12px 14px; border-radius: 10px; background: var(--xy-mint); color: var(--xy-ink-2); font-size: 12px; line-height: 1.65; }
@media (max-width: 720px) { .member-stats { grid-template-columns: 1fr; } }
</style>
