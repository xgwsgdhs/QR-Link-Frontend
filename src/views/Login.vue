<template>
  <div class="login-page">
    <div class="login-card glass-card">
      <div class="header">
        <div class="logo-circle">
          <el-icon :size="28"><Compass /></el-icon>
        </div>
        <h2>QR-Link 智能借还系统</h2>
        <p class="subtitle">新韩大学 SW中心大学 · 产学联动项目 (Microstone)</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="学号 / 教工号" prop="student_id">
          <el-input 
            v-model="form.student_id" 
            placeholder="请输入学号或教工号" 
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item label="登录密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入登录密码" 
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button 
          type="primary" 
          size="large" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
        >
          立即登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, Compass } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  student_id: '',
  password: ''
})

const rules = {
  student_id: [{ required: true, message: '请输入学号/工号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await authStore.login(form.student_id, form.password)
      ElMessage.success(`欢迎回来，${res.user.username}`)
      
      const redirect = route.query.redirect
      if (redirect) {
        router.push(redirect)
      } else {
        router.push(res.user.role === 'ADMIN' ? '/dashboard' : '/scan')
      }
    } catch (e) {
      // 错误已由 axios 拦截器统一提示
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: radial-gradient(circle at top right, #e0f2fe 0%, #f8fafc 60%, #e2e8f0 100%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 36px 32px;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.06);
}

.header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-circle {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

h2 {
  font-size: 1.4rem;
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 0.82rem;
  color: #64748b;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  height: 44px;
}
</style>
