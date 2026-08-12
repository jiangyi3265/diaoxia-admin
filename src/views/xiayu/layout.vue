<template>
  <div class="xy-admin">
    <a class="xy-skip-link" href="#xy-main-content">跳到主要内容</a>
    <button v-if="mobileNavOpen" class="xy-side-backdrop" type="button" aria-label="关闭导航" @click="mobileNavOpen = false" />
    <!-- 侧边栏 -->
    <aside id="xy-navigation" class="xy-side" :class="{ 'is-open': mobileNavOpen }" aria-label="运营后台导航">
      <div class="xy-brand">
        <div class="xy-brand-mark"><xy-icon name="fish" :size="26" :weight="1.7" /></div>
        <div class="xy-brand-txt">
          <span class="xy-brand-name">虾语</span>
          <span class="xy-brand-sub">钓虾生活馆运营后台</span>
        </div>
      </div>

      <nav class="xy-nav">
        <div class="xy-nav-group" v-for="g in nav" :key="g.group">
          <div class="xy-nav-label">{{ g.group }}</div>
          <button
            class="xy-nav-item"
            :class="{ on: active === it.key }"
            type="button"
            :aria-current="active === it.key ? 'page' : undefined"
            v-for="it in g.items"
            :key="it.key"
            @click="go(it.key)"
          >
            <xy-icon :name="it.icon" :size="19" :weight="active === it.key ? 2 : 1.7" />
            <span>{{ it.label }}</span>
            <span v-if="it.badge" class="xy-nav-badge">{{ it.badge }}</span>
          </button>
        </div>
      </nav>

      <div class="xy-side-foot">
        <div class="xy-acc">
          <div class="xy-acc-avatar"><xy-icon name="user" :size="20" :weight="1.7" /></div>
          <div class="xy-acc-txt">
            <span class="xy-acc-name">{{ userName }}</span>
            <span class="xy-acc-role">{{ roleText }}</span>
          </div>
          <button class="xy-acc-out" type="button" aria-label="退出登录" @click="logout">
            <xy-icon name="logout" :size="18" :weight="1.7" />
          </button>
        </div>
      </div>
    </aside>

    <!-- 主区 -->
    <div class="xy-main">
      <header class="xy-top">
        <div class="xy-top-left">
          <button class="xy-mobile-menu xy-icon-button" type="button" aria-label="打开导航" aria-controls="xy-navigation" :aria-expanded="mobileNavOpen" @click="mobileNavOpen = true">
            <span></span><span></span><span></span>
          </button>
          <div>
          <h1 class="xy-top-title">{{ title }}</h1>
          <div class="xy-crumb">
            <span>虾语生活馆</span>
            <xy-icon name="chevron-right" :size="14" :weight="2" />
            <span class="on">{{ title }}</span>
          </div>
          </div>
        </div>
        <div class="xy-top-right">
          <div class="xy-top-acc">
            <div class="xy-top-avatar"><xy-icon name="user" :size="18" :weight="1.7" /></div>
            <div class="xy-top-acc-txt">
              <span class="n">{{ userName }}</span>
              <span class="r">{{ roleText }}</span>
            </div>
          </div>
        </div>
      </header>

      <main id="xy-main-content" class="xy-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="xy-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import auth from '@/plugins/auth'
import useUserStore from '@/store/modules/user'
import XyIcon from './XyIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const mobileNavOpen = ref(false)

const allNav = [
  { group: '经营概览', items: [
    { key: 'dashboard', label: '数据看板', icon: 'dashboard', permission: 'xy:dashboard:view' },
    { key: 'members', label: '会员管理', icon: 'users', permission: 'xy:member:list' },
    { key: 'finance', label: '财务对账', icon: 'wallet', permission: 'xy:finance:view' }
  ]},
  { group: '预约运营', items: [
    { key: 'reservations', label: '预约看板', icon: 'calendar-check', permission: 'xy:reservation:list' },
    { key: 'seats', label: '座位时段', icon: 'seat', permission: 'xy:reservation:config' },
    { key: 'verify', label: '核销管理', icon: 'qrcode', permission: 'xy:reservation:verify' }
  ]},
  { group: '商城运营', items: [
    { key: 'mall', label: '商城管理', icon: 'bag', permission: 'xy:product:list' }
  ]},
  { group: '系统设置', items: [
    { key: 'staff', label: '员工权限', icon: 'shield', permission: 'xy:staff:list' }
  ]}
]

const nav = computed(() => allNav
  .map(group => ({ ...group, items: group.items.filter(item => auth.hasPermi(item.permission)) }))
  .filter(group => group.items.length > 0))
const userName = computed(() => userStore.name || '已登录用户')
const roleText = computed(() => userStore.roles && userStore.roles.length ? userStore.roles.join(' / ') : '运营账号')

const titleMap = {
  dashboard: '数据看板', members: '会员管理', finance: '财务对账',
  reservations: '预约看板', seats: '座位时段', verify: '核销管理',
  mall: '商城管理', staff: '员工权限'
}

const active = computed(() => {
  const seg = route.path.split('/')[2] || 'dashboard'
  return seg
})
const title = computed(() => titleMap[active.value] || '数据看板')

function go(key) {
  mobileNavOpen.value = false
  router.push('/xiayu/' + key)
}

async function logout() {
  await userStore.logOut()
  router.replace('/login')
}
</script>

<style scoped>
.xy-admin {
  --xy-primary: #0E9C8E;
  --xy-primary-bright: #16C2B3;
  --xy-primary-deep: #0A7D72;
  --xy-lake: #0C6C88;
  --xy-ink: #16241F;
  --xy-ink-2: #46574F;
  --xy-ink-3: #7A8C86;
  --xy-muted: #9DACA6;
  --xy-bg: #EEF4F2;
  --xy-surface: #FFFFFF;
  --xy-hairline: #E6EDEA;
  --xy-mint: #E8F5F1;
  --xy-danger: #E1584A;
  --xy-warn: #E0A24E;
  --xy-success: #17A57F;

  /* Element Plus 主色改青碧 */
  --el-color-primary: #0E9C8E;
  --el-color-primary-light-3: #40b3a6;
  --el-color-primary-light-5: #6ac6bb;
  --el-color-primary-light-7: #a7ddd6;
  --el-color-primary-light-8: #cbeae6;
  --el-color-primary-light-9: #e8f5f1;
  --el-color-primary-dark-2: #0b7d72;
  --el-border-radius-base: 10px;

  display: flex;
  min-height: 100dvh;
  background: var(--xy-bg);
  color: var(--xy-ink);
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
}

.xy-skip-link {
  position: fixed; left: 16px; top: 12px; z-index: 100;
  padding: 9px 14px; border-radius: 9px; background: #fff; color: var(--xy-primary-deep);
  font-size: 13px; font-weight: 700; box-shadow: 0 8px 24px rgba(8,45,41,.18);
  transform: translateY(-150%); transition: transform .16s ease;
}
.xy-skip-link:focus { transform: translateY(0); }
.xy-side-backdrop { display: none; }

/* 侧边栏 */
.xy-side {
  width: 244px;
  flex-shrink: 0;
  background: #0E2A2A;
  background: linear-gradient(190deg, #123B39 0%, #0E2A2A 60%, #0B2432 100%);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 0;
  margin: 0;
  border-radius: 0;
  line-height: normal;
  z-index: 40;
}
.xy-brand { display: flex; align-items: center; gap: 12px; padding: 24px 22px 22px; }
.xy-brand-mark {
  width: 42px; height: 42px; border-radius: 13px;
  background: linear-gradient(135deg, var(--xy-primary-bright), var(--xy-primary) 60%, var(--xy-lake));
  color: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(14,156,142,0.4);
}
.xy-brand-txt { display: flex; flex-direction: column; }
.xy-brand-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }
.xy-brand-sub { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 2px; margin-top: 1px; }

.xy-nav { flex: 1; overflow-y: auto; padding: 8px 14px; }
.xy-nav-group { margin-bottom: 14px; }
.xy-nav-label { font-size: 11px; color: rgba(255,255,255,0.36); letter-spacing: 1px; padding: 10px 12px 8px; font-weight: 600; }
.xy-nav-item {
  width: 100%; border: 0; text-align: left;
  display: flex; align-items: center; gap: 12px;
  height: 46px; padding: 0 14px; border-radius: 12px;
  color: rgba(255,255,255,0.68); font-size: 14.5px; cursor: pointer;
  transition: all 0.18s; position: relative; margin-bottom: 2px;
}
.xy-nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.xy-nav-item.on {
  background: linear-gradient(120deg, var(--xy-primary), var(--xy-lake));
  color: #fff; font-weight: 600;
  box-shadow: 0 8px 18px rgba(12,84,80,0.4);
}
.xy-nav-badge {
  margin-left: auto; min-width: 20px; height: 20px; padding: 0 6px;
  border-radius: 10px; background: var(--xy-danger); color: #fff;
  font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.xy-nav-item.on .xy-nav-badge { background: rgba(255,255,255,0.9); color: var(--xy-primary-deep); }

.xy-side-foot { padding: 14px; }
.xy-acc {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 14px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
}
.xy-acc-avatar { width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.12); color: #fff; display: flex; align-items: center; justify-content: center; }
.xy-acc-txt { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.xy-acc-name { font-size: 13.5px; color: #fff; font-weight: 600; }
.xy-acc-role { font-size: 11px; color: rgba(255,255,255,0.44); }
.xy-acc-out { display: grid; place-items: center; padding: 6px; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; }
.xy-acc-out:hover { color: #fff; }

/* 主区 */
.xy-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.xy-top {
  height: 76px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 30px;
  background: rgba(255,255,255,0.86);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--xy-hairline);
  position: sticky; top: 0; z-index: 20;
}
.xy-top-title { font-size: 21px; font-weight: 800; color: var(--xy-ink); margin: 0; letter-spacing: 0.3px; }
.xy-top-left { display: flex; align-items: center; gap: 12px; }
.xy-mobile-menu { display: none; }
.xy-crumb { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 12px; color: var(--xy-muted); }
.xy-crumb .on { color: var(--xy-primary-deep); font-weight: 600; }
.xy-top-right { display: flex; align-items: center; gap: 14px; }
.xy-search {
  display: flex; align-items: center; gap: 9px;
  width: 300px; height: 42px; padding: 0 16px;
  background: var(--xy-mint); border-radius: 12px; color: var(--xy-ink-3);
}
.xy-search input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--xy-ink); }
.xy-top-btn {
  position: relative; width: 42px; height: 42px; border-radius: 12px;
  background: var(--xy-surface); border: 1px solid var(--xy-hairline);
  display: flex; align-items: center; justify-content: center; color: var(--xy-ink-2); cursor: pointer;
}
.xy-top-btn:hover { color: var(--xy-primary); border-color: var(--xy-primary-light-7); }
.xy-dot { position: absolute; top: 9px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: var(--xy-danger); border: 2px solid #fff; }
.xy-top-acc { display: flex; align-items: center; gap: 10px; padding-left: 8px; }
.xy-top-avatar { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, var(--xy-primary-bright), var(--xy-primary)); color: #fff; display: flex; align-items: center; justify-content: center; }
.xy-top-acc-txt { display: flex; flex-direction: column; gap: 2px; }
.xy-top-acc-txt .n { font-size: 13.5px; font-weight: 700; color: var(--xy-ink); }
.xy-top-acc-txt .r { font-size: 11px; color: var(--xy-muted); }

.xy-content { flex: 1; padding: 26px 30px 40px; overflow-y: auto; }

.xy-fade-enter-active, .xy-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.xy-fade-enter-from { opacity: 0; transform: translateY(8px); }
.xy-fade-leave-to { opacity: 0; }

@media (max-width: 980px) {
  .xy-side {
    position: fixed; left: 0; top: 0; height: 100dvh;
    transform: translateX(-102%); transition: transform .24s cubic-bezier(.22,.8,.28,1);
    box-shadow: 22px 0 50px rgba(4,31,29,.24);
  }
  .xy-side.is-open { transform: translateX(0); }
  .xy-side-backdrop {
    display: block; position: fixed; inset: 0; z-index: 35; border: 0;
    background: rgba(8,30,29,.38); backdrop-filter: blur(2px);
  }
  .xy-mobile-menu {
    display: grid; gap: 4px; width: 38px; height: 38px; padding: 10px;
    border: 1px solid var(--xy-hairline); border-radius: 10px; background: #fff;
  }
  .xy-mobile-menu span { display: block; width: 100%; height: 2px; border-radius: 2px; background: var(--xy-ink-2); }
  .xy-top { padding: 0 20px; }
  .xy-content { padding: 20px; }
}

@media (max-width: 640px) {
  .xy-top { height: 66px; padding: 0 14px; }
  .xy-top-title { font-size: 18px; }
  .xy-crumb, .xy-top-acc-txt { display: none; }
  .xy-top-avatar { width: 36px; height: 36px; }
  .xy-content { padding: 12px 12px 28px; }
}
</style>

<style>
/* xiayu 后台内 Element Plus 局部风格微调 */
.xy-admin .el-button--primary {
  --el-button-bg-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary);
}
.xy-admin .el-table th.el-table__cell { background: #F4F8F7 !important; color: #46574F; font-weight: 600; }
.xy-admin .el-table { --el-table-border-color: #EEF3F1; }
.xy-admin .el-tag { border-radius: 8px; }
</style>
