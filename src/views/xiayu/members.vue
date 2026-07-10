<template>
  <div class="page">
    <div class="toolbar"><el-input v-model="keyword" clearable placeholder="昵称、手机号或邀请码" @keyup.enter="load" /><el-button type="primary" :loading="loading" @click="load">查询</el-button></div>
    <el-table :data="members" v-loading="loading" empty-text="暂无会员数据">
      <el-table-column prop="memberId" label="ID" width="90" /><el-table-column prop="nickname" label="昵称" min-width="130" /><el-table-column prop="mobile" label="手机号" min-width="130" /><el-table-column prop="inviteCode" label="邀请码" min-width="110" /><el-table-column prop="cardNo" label="会员卡" min-width="150" /><el-table-column prop="expireDate" label="到期日" min-width="120" /><el-table-column prop="cardStatus" label="卡状态" min-width="110" />
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getXyMembers } from '@/api/xy'
const keyword = ref(''); const members = ref([]); const loading = ref(false)
async function load() { loading.value = true; try { members.value = await getXyMembers(keyword.value) } finally { loading.value = false } }
onMounted(load)
</script>

<style scoped>.page{background:#fff;padding:20px;border-radius:16px}.toolbar{display:flex;gap:12px;margin-bottom:18px}.toolbar .el-input{max-width:360px}</style>
