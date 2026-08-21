<template>
  <main class="error-page">
    <section class="error-card" aria-labelledby="error-title">
      <div class="brand"><strong>成泰</strong><span>钓虾俱乐部运营后台</span></div>
      <div class="error-number" aria-hidden="true">404</div>
      <span class="error-code">PAGE NOT FOUND</span>
      <h1 id="error-title">这个页面不存在</h1>
      <p>地址可能已经变更，或当前入口已被移除。你可以返回工作台继续处理业务。</p>
      <div class="actions"><el-button type="primary" @click="$router.push('/')">回到工作台</el-button><el-button @click="$router.go(-1)">返回上一页</el-button></div>
    </section>
  </main>
</template>

<style scoped>
.error-page { display: grid; min-height: 100dvh; place-items: center; overflow: hidden; padding: 24px; background: #0c3533; }
.error-card { position: relative; width: min(100%, 670px); overflow: hidden; padding: clamp(30px,6vw,60px); border: 1px solid rgba(255,255,255,.1); border-radius: 22px; background: radial-gradient(circle at 95% 5%, rgba(62,201,183,.2), transparent 35%), #103f3b; color: #fff; box-shadow: 0 30px 80px rgba(0,24,22,.3); }
.brand { display: flex; align-items: baseline; gap: 9px; margin-bottom: 58px; }.brand strong { color: #8be0d5; font-size: 21px; }.brand span { color: rgba(255,255,255,.45); font-size: 11px; }
.error-number { position: absolute; right: -22px; top: 42px; color: rgba(255,255,255,.035); font-size: clamp(150px,27vw,270px); font-weight: 850; line-height: 1; letter-spacing: -.09em; pointer-events: none; }
.error-code { color: #83d8ce; font-size: 11px; font-weight: 750; letter-spacing: .14em; }h1 { position: relative; margin: 10px 0 14px; font-size: clamp(30px,5vw,46px); line-height: 1.15; letter-spacing: -.045em; }p { position: relative; max-width: 49ch; margin: 0; color: rgba(255,255,255,.62); font-size: 13px; line-height: 1.8; }.actions { position: relative; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }.actions :deep(.el-button--primary) { background: #16a596; border-color: #16a596; }.actions :deep(.el-button:not(.el-button--primary)) { background: transparent; border-color: rgba(255,255,255,.24); color: #fff; }
</style>
