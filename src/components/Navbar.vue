<template>
  <header v-if="!isFullScreenDashboard" class="navbar-wrapper">
    <div class="navbar-content">
      <!-- 品牌 Logo 与标题 -->
      <div class="brand" @click="router.push('/')">
        <div class="logo-box">
          <el-icon :size="20"><Compass /></el-icon>
        </div>
        <div class="brand-text">
          <span class="title">QR-Link</span>
          <span class="subtitle">共享资源追踪 · Microstone</span>
        </div>
      </div>

      <!-- 桌面端导航 -->
      <nav class="nav-links hide-mobile">
        <router-link to="/scan" class="nav-item">
          <el-icon><Camera /></el-icon>
          <span>扫码借还</span>
        </router-link>
        <router-link to="/assets" class="nav-item">
          <el-icon><Box /></el-icon>
          <span>物资大厅</span>
        </router-link>
        <router-link to="/my-rentals" class="nav-item">
          <el-icon><Tickets /></el-icon>
          <span>我的在借</span>
        </router-link>
        <router-link to="/dashboard" class="nav-item tech-link">
          <el-icon><DataAnalysis /></el-icon>
          <span>大屏看板</span>
        </router-link>

        <!-- 管理员专属菜单 -->
        <el-dropdown v-if="authStore.isAdmin" trigger="hover">
          <span class="nav-item admin-menu-trigger">
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/admin/assets')">
                <el-icon><Files /></el-icon>物资台账与二维码调度
              </el-dropdown-item>
              <el-dropdown-item @click="router.push('/admin/logs')">
                <el-icon><List /></el-icon>借还全生命周期审计
              </el-dropdown-item>
              <el-dropdown-item @click="router.push('/admin/users')">
                <el-icon><UserFilled /></el-icon>团队与用户花名册
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>

      <!-- 用户信息与退出 -->
      <div class="user-actions">
        <template v-if="authStore.isLoggedIn">
          <div class="user-tag">
            <el-tag :type="authStore.isAdmin ? 'danger' : 'success'" effect="dark" size="small" round>
              {{ authStore.isAdmin ? '管理员' : '学生' }}
            </el-tag>
            <span class="user-name">{{ authStore.username }}</span>
          </div>
          <el-button size="small" plain type="danger" @click="handleLogout">
            退出
          </el-button>
        </template>
        <template v-else>
          <el-button type="primary" size="small" @click="router.push('/login')">
            登录
          </el-button>
        </template>
      </div>
    </div>
  </header>

  <!-- 移动端底部便携导航栏 -->
  <div v-if="!isFullScreenDashboard && authStore.isLoggedIn" class="mobile-bottom-bar hide-desktop">
    <router-link to="/scan" class="tab-item">
      <el-icon :size="22"><Camera /></el-icon>
      <span>扫码</span>
    </router-link>
    <router-link to="/assets" class="tab-item">
      <el-icon :size="22"><Box /></el-icon>
      <span>物资</span>
    </router-link>
    <router-link to="/my-rentals" class="tab-item">
      <el-icon :size="22"><Tickets /></el-icon>
      <span>我的</span>
    </router-link>
    <router-link v-if="authStore.isAdmin" to="/dashboard" class="tab-item">
      <el-icon :size="22"><DataAnalysis /></el-icon>
      <span>看板</span>
    </router-link>
    <router-link v-if="authStore.isAdmin" to="/admin/assets" class="tab-item">
      <el-icon :size="22"><Setting /></el-icon>
      <span>管理</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当全屏大屏页面且带有 query.fullscreen 时可隐藏导航，默认正常展示切换
const isFullScreenDashboard = computed(() => {
  return route.path === '/dashboard' && route.query.fullscreen === 'true'
})

function handleLogout() {
  ElMessageBox.confirm('确认退出当前登录账号？', '安全提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    ElMessage.success('已安全退出')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.navbar-wrapper {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.navbar-content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 16px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo-box {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-text .title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.brand-text .subtitle {
  font-size: 0.72rem;
  color: #64748b;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  color: #475569;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #2563eb;
  background-color: #eff6ff;
}

.nav-item.router-link-active {
  color: #2563eb;
  background-color: #dbeafe;
  font-weight: 600;
}

.tech-link {
  color: #0284c7;
}

.admin-menu-trigger {
  cursor: pointer;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-tag {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移动端底部栏 */
.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #64748b;
  font-size: 0.72rem;
  gap: 2px;
  width: 20%;
}

.tab-item.router-link-active {
  color: #2563eb;
  font-weight: 600;
}

@media (min-width: 769px) {
  .hide-desktop {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
}
</style>
