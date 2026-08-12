<template>
  <main class="login">
    <section class="brand-panel" aria-label="虾语品牌介绍">
      <div class="brand-content">
        <span class="brand-kicker">XIAYU MERCHANT</span>
        <h1>虾语<br><em>钓虾生活馆</em></h1>
        <p>管理门店预约、会员权益、商城订单与线下收款，让每一笔业务都有记录、可核对。</p>
        <div class="brand-points"><span>预约到店</span><span>会员运营</span><span>线下收款</span></div>
      </div>
      <div class="brand-foot">钓虾生活馆运营后台</div>
    </section>

    <section class="form-panel">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form" aria-labelledby="login-title">
      <div class="mobile-brand"><strong>虾语</strong><span>钓虾生活馆</span></div>
      <span class="form-kicker">运营人员登录</span>
      <h2 id="login-title" class="title">欢迎回来</h2>
      <p class="subtitle">请使用管理员分配的账号进入后台。</p>
      <el-form-item prop="username" label="账号">
        <el-input
          v-model="loginForm.username"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="请输入登录账号"
        >
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password" label="密码">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          placeholder="请输入登录密码"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="code" label="验证码" v-if="captchaEnabled">
        <div class="captcha-row"><el-input
          v-model="loginForm.code"
          size="large"
          auto-complete="off"
          placeholder="验证码"
          class="captcha-input"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
        </el-input>
        <button class="login-code" type="button" title="看不清，换一张" @click="getCode">
          <img :src="codeUrl" alt="验证码，点击刷新" class="login-code-img"/>
        </button></div>
      </el-form-item>
      <div class="login-options"><el-checkbox v-model="loginForm.rememberMe">记住登录信息</el-checkbox><span>仅建议在个人设备使用</span></div>
      <el-form-item class="submit-item">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          class="submit-button"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">进入运营后台</span>
          <span v-else>正在验证...</span>
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
      <p class="security-note">系统会记录关键经营操作。请妥善保管账号，不要与他人共用。</p>
    </el-form>
    <footer class="el-login-footer"><span>{{ footerContent }}</span></footer>
    </section>
  </main>
</template>

<script setup>
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'

const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref({
  username: "",
  password: "",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 验证码开关
const captchaEnabled = ref(true)
// 注册开关
const register = ref(false)
const redirect = ref(undefined)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 否则移除
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        // 重新获取验证码
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

getCode()
getCookie()
</script>

<style lang='scss' scoped>
.login {
  display: grid;
  grid-template-columns: minmax(420px, 1.15fr) minmax(460px, .85fr);
  min-height: 100dvh;
  overflow: auto;
  background: #f4f7f5;
}
.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100dvh;
  overflow: hidden;
  padding: clamp(34px, 5vw, 72px);
  background:
    linear-gradient(150deg, rgba(9, 46, 43, .9), rgba(7, 59, 60, .84)),
    url("../assets/images/login-background.jpg") center/cover;
  color: #fff;
}
.brand-panel::before { position: absolute; inset: 0; background: radial-gradient(circle at 70% 18%, rgba(64, 211, 192, .2), transparent 28%); content: ""; }
.brand-panel::after { position: absolute; right: -110px; bottom: 8%; width: 360px; height: 360px; border: 64px solid rgba(255,255,255,.045); border-radius: 50%; content: ""; }
.brand-content, .brand-foot { position: relative; z-index: 1; }
.brand-content { align-self: center; width: min(100%, 610px); margin: auto 0; }
.brand-kicker { color: #80d8cc; font-size: 11px; font-weight: 750; letter-spacing: .22em; }
.brand-content h1 { margin: 22px 0 24px; font-size: clamp(50px, 6vw, 86px); font-weight: 790; line-height: .98; letter-spacing: -.06em; }
.brand-content h1 em { color: #d6f2ed; font-size: .48em; font-style: normal; font-weight: 580; letter-spacing: -.025em; }
.brand-content p { max-width: 48ch; margin: 0; color: rgba(255,255,255,.66); font-size: 14px; line-height: 1.85; }
.brand-points { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
.brand-points span { padding: 7px 10px; border: 1px solid rgba(255,255,255,.14); border-radius: 7px; background: rgba(255,255,255,.055); color: rgba(255,255,255,.76); font-size: 11px; }
.brand-foot { color: rgba(255,255,255,.42); font-size: 11px; letter-spacing: .1em; }
.form-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 42px clamp(28px, 6vw, 84px) 24px;
}
.title {
  margin: 8px 0 0;
  color: #15241f;
  font-size: 34px;
  font-weight: 760;
  line-height: 1.2;
  letter-spacing: -.035em;
}
.login-form {
  width: min(100%, 420px);
  padding: 0;
  z-index: 1;
  .el-form-item { margin-bottom: 22px; }
  :deep(.el-form-item__label) { height: auto; margin-bottom: 7px; color: #3f514a; font-size: 12px; font-weight: 650; line-height: 1.3; }
  .el-input {
    height: 46px;
    :deep(.el-input__wrapper) { border-radius: 11px; box-shadow: 0 0 0 1px #dfe8e4 inset; }
    :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #0e9c8e inset, 0 0 0 4px rgba(14,156,142,.09); }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}
.form-kicker { color: #0a7d72; font-size: 11px; font-weight: 750; letter-spacing: .12em; }
.subtitle { margin: 9px 0 30px; color: #71827b; font-size: 13px; line-height: 1.6; }
.mobile-brand { display: none; }
.captcha-row { display: flex; width: 100%; gap: 10px; }.captcha-input { flex: 1; min-width: 0; }
.login-code {
  flex: 0 0 120px;
  height: 46px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #dfe8e4;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  img {
    display: block;
  }
}
.login-options { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -2px 0 22px; }.login-options span { color: #97a59f; font-size: 11px; }
.submit-item { width: 100%; margin-bottom: 0 !important; }.submit-button { width: 100%; height: 46px; border-radius: 11px; background: #0b887d; border-color: #0b887d; font-weight: 680; box-shadow: 0 8px 20px rgba(11,136,125,.2); }.submit-button:hover { background: #08796f; border-color: #08796f; }
.security-note { margin: 18px 0 0; color: #9aa6a1; font-size: 11px; line-height: 1.65; text-align: center; }
.el-login-footer {
  width: min(100%, 420px);
  margin-top: 48px;
  text-align: center;
  color: #9ba7a2;
  font-size: 11px;
}
.login-code-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .brand-panel { display: none; }
  .form-panel { min-height: 100dvh; justify-content: flex-start; padding: 48px 22px 24px; }
  .mobile-brand { display: flex; align-items: baseline; gap: 8px; margin-bottom: 46px; color: #0b887d; }.mobile-brand strong { font-size: 22px; }.mobile-brand span { color: #71827b; font-size: 12px; }
  .el-login-footer { margin-top: auto; padding-top: 42px; }
}
@media (max-width: 420px) {
  .form-panel { padding-top: 28px; }
  .mobile-brand { margin-bottom: 32px; }
  .captcha-row { align-items: stretch; }.login-code { flex-basis: 104px; }
  .login-options { align-items: flex-start; flex-direction: column; gap: 6px; }
}
</style>
