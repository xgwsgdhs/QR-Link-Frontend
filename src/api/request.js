import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    let msg = '网络请求失败，请稍后重试'
    if (error.response) {
      const status = error.response.status
      const detail = error.response.data?.detail
      if (detail) {
        msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      } else if (status === 401) {
        msg = '登录已失效，请重新登录'
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        msg = '权限不足：仅管理员有权执行此操作'
      } else if (status === 404) {
        msg = '请求的资源未找到'
      } else if (status === 500) {
        msg = '后端服务器异常，请检查服务状态'
      }
    }
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service
