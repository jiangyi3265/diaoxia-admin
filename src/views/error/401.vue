<template>
  <main class="error-page">
    <section class="error-card" aria-labelledby="error-title">
      <div class="brand"><strong>成泰</strong><span>钓虾俱乐部运营后台</span></div>
      <span class="error-code">401 · ACCESS DENIED</span>
      <h1 id="error-title">当前账号没有访问权限</h1>
      <p>该页面超出了当前角色的授权范围。如确需使用，请联系管理员分配对应业务权限。</p>
      <div class="actions"><el-button type="primary" @click="back">返回上一页</el-button><el-button @click="proxy.$router.push('/')">回到工作台</el-button></div>
    </section>
  </main>
</template>

<script setup>
const { proxy } = getCurrentInstance()
function back() {
  if (proxy.$route.query.noGoBack || window.history.length <= 1) proxy.$router.push({ path: '/' })
  else proxy.$router.go(-1)
}
</script>

<style scoped>
.error-page { display: grid; min-height: 100dvh; place-items: center; padding: 24px; background: radial-gradient(circle at 15% 20%, rgba(14,156,142,.12), transparent 28%), #f1f6f3; }
.error-card { width: min(100%, 640px); padding: clamp(30px, 6vw, 58px); border: 1px solid #dfe9e5; border-radius: 22px; background: #fff; box-shadow: 0 24px 60px rgba(14,61,55,.1); }
.brand { display: flex; align-items: baseline; gap: 9px; margin-bottom: 54px; }.brand strong { color: #0b887d; font-size: 21px; }.brand span { color: #7d8d87; font-size: 11px; }
.error-code { color: #0b887d; font-size: 11px; font-weight: 750; letter-spacing: .12em; }
h1 { margin: 10px 0 14px; color: #17241f; font-size: clamp(27px,5vw,42px); line-height: 1.18; letter-spacing: -.04em; }p { max-width: 52ch; margin: 0; color: #697b74; font-size: 13px; line-height: 1.8; }.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
</style>
