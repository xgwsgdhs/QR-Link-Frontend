import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '用户登录', guestOnly: true }
  },
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (token && user?.role === 'ADMIN') {
        return '/dashboard'
      }
      return '/scan'
    }
  },
  {
    path: '/scan',
    name: 'Scan',
    component: () => import('@/views/ScanView.vue'),
    meta: { title: '手机扫码借还', requiresAuth: true }
  },
  {
    path: '/my-rentals',
    name: 'MyRentals',
    component: () => import('@/views/MyRentalsView.vue'),
    meta: { title: '我的在借器材', requiresAuth: true }
  },
  {
    path: '/assets',
    name: 'Assets',
    component: () => import('@/views/AssetsView.vue'),
    meta: { title: '共享物资台账' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '管理端大屏看板', requiresAuth: true }
  },
  {
    path: '/admin/assets',
    name: 'AdminAssets',
    component: () => import('@/views/admin/AssetManageView.vue'),
    meta: { title: '资产调度管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('@/views/admin/LogView.vue'),
    meta: { title: '借还审计流水', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/UserManageView.vue'),
    meta: { title: '团队成员花名册', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/scan'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (to.meta.title) {
    document.title = `${to.meta.title} - QR-Link`
  }

  if (to.meta.guestOnly && token) {
    return next(user?.role === 'ADMIN' ? '/dashboard' : '/scan')
  }

  if (to.meta.requiresAuth && !token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin && user?.role !== 'ADMIN') {
    return next('/scan')
  }

  next()
})

export default router
