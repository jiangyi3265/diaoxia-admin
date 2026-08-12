<template>
  <main class="app-container home-entry">
    <section v-if="redirecting" class="entry-card" aria-live="polite">
      <span class="entry-mark">虾语</span>
      <h1>正在进入运营工作台</h1>
      <p>系统正在根据你的账号权限打开可用的业务页面。</p>
      <el-skeleton :rows="3" animated />
    </section>
    <section v-else class="entry-card">
      <span class="entry-mark">权限提示</span>
      <h1>当前账号暂无业务页面权限</h1>
      <p>请联系管理员分配经营看板、会员、预约、商城或系统管理权限，然后重新登录。</p>
      <el-button type="primary" @click="router.push('/user/profile')">查看个人资料</el-button>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import auth from '@/plugins/auth'

const router = useRouter()
const redirecting = ref(true)
const entries = [
  ['/xiayu/dashboard', 'xy:dashboard:view'], ['/xiayu/reservations', 'xy:reservation:list'],
  ['/xiayu/members', 'xy:member:list'], ['/xiayu/mall', 'xy:product:list'],
  ['/xiayu/seats', 'xy:reservation:config'], ['/xiayu/finance', 'xy:finance:view'],
  ['/xiayu/staff', 'xy:staff:list'], ['/system/user', 'system:user:list']
]

onMounted(async () => {
  const entry = entries.find(([, permission]) => auth.hasPermi(permission))
  if (entry) await router.replace(entry[0])
  else redirecting.value = false
})
</script>

<style scoped>
.home-entry { display: grid; min-height: 100%; place-items: center; }
.entry-card { width: min(100%, 620px); padding: clamp(28px,5vw,52px); border: 1px solid #e1eae6; border-radius: 20px; background: #fff; box-shadow: 0 18px 48px rgba(19,65,59,.09); }
.entry-mark { color: #0b887d; font-size: 11px; font-weight: 750; letter-spacing: .13em; }.entry-card h1 { margin: 10px 0 12px; color: #17241f; font-size: clamp(25px,4vw,36px); line-height: 1.2; letter-spacing: -.04em; }.entry-card p { margin: 0 0 28px; color: #71817b; font-size: 13px; line-height: 1.75; }
</style>
