<template>
  <div class="xy-page">
    <section class="xy-page-hero" aria-labelledby="staff-title">
      <div class="xy-page-copy">
        <span class="xy-kicker">组织与权限</span>
        <h2 id="staff-title" class="xy-page-title">员工账号与访问权限</h2>
        <p class="xy-page-description">员工资料来自统一权限中心。账号用于识别人员，角色决定其可查看和操作的业务范围。</p>
      </div>
      <div class="xy-page-actions"><el-button :loading="loading" @click="load">刷新员工</el-button></div>
    </section>

    <section class="staff-links" aria-label="权限配置入口">
      <button type="button" class="staff-link" @click="router.push('/system/user')"><span class="link-index">01</span><div><strong>员工账号</strong><small>新增、停用与维护员工资料</small></div><span aria-hidden="true">→</span></button>
      <button type="button" class="staff-link" @click="router.push('/system/role')"><span class="link-index">02</span><div><strong>角色权限</strong><small>配置菜单与业务操作权限</small></div><span aria-hidden="true">→</span></button>
    </section>

    <section class="xy-section">
      <div class="xy-section-head"><div><h3>当前员工</h3><p>停用账号无法登录运营后台，权限变更将在重新登录后完整生效。</p></div><span class="staff-count">{{ activeCount }} 位正常</span></div>
      <div class="xy-table-wrap">
        <el-table :data="rows" v-loading="loading" empty-text="暂无员工账号">
          <el-table-column prop="userName" label="登录账号" min-width="130"><template #default="s"><span class="xy-code">{{ s.row.userName }}</span></template></el-table-column>
          <el-table-column prop="nickName" label="员工姓名" min-width="130"><template #default="s"><strong class="staff-name">{{ s.row.nickName || '未填写' }}</strong></template></el-table-column>
          <el-table-column prop="phonenumber" label="手机号" min-width="135"><template #default="s"><span class="xy-date">{{ s.row.phonenumber || '未绑定' }}</span></template></el-table-column>
          <el-table-column prop="deptName" label="所属部门" min-width="150"><template #default="s">{{ s.row.deptName || '未分配' }}</template></el-table-column>
          <el-table-column label="状态" width="110"><template #default="s"><span class="xy-status" :class="s.row.status === '0' ? 'xy-status--success' : 'xy-status--muted'">{{ s.row.status === '0' ? '正常' : '已停用' }}</span></template></el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getXyStaff } from '@/api/xy'

const router = useRouter()
const rows = ref([])
const loading = ref(false)
const activeCount = computed(() => rows.value.filter(item => item.status === '0').length)
async function load() {
  loading.value = true
  try { rows.value = await getXyStaff() } finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.staff-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.staff-link { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; padding: 21px 22px; border: 1px solid var(--xy-hairline); border-radius: 16px; background: #fff; color: var(--xy-ink); text-align: left; cursor: pointer; box-shadow: 0 9px 24px rgba(23,70,63,.05); transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.staff-link:hover { transform: translateY(-2px); border-color: rgba(14,156,142,.24); box-shadow: 0 14px 28px rgba(23,70,63,.09); }
.staff-link:active { transform: translateY(0); }
.link-index { color: var(--xy-primary); font-family: Consolas, monospace; font-size: 12px; font-weight: 700; }
.staff-link div { display: flex; flex-direction: column; gap: 5px; }
.staff-link strong { font-size: 15px; }
.staff-link small { color: var(--xy-ink-3); font-size: 12px; }
.staff-count { color: var(--xy-primary-deep); font-size: 12px; font-weight: 650; }
.staff-name { color: var(--xy-ink); font-size: 13px; }
@media (max-width: 720px) { .staff-links { grid-template-columns: 1fr; } }
</style>
