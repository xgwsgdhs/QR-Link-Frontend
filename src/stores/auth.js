import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getProfileApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const username = computed(() => user.value?.username || '未登录')
  const studentId = computed(() => user.value?.student_id || '')

  async function login(student_id, password) {
    const res = await loginApi(student_id, password)
    token.value = res.access_token
    user.value = res.user
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const profile = await getProfileApi()
      user.value = profile
      localStorage.setItem('user', JSON.stringify(profile))
      return profile
    } catch (e) {
      logout()
      return null
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    username,
    studentId,
    login,
    fetchProfile,
    logout
  }
})
