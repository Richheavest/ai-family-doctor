// src/api/request.js — Axios 统一封装：Token注入、错误拦截、弹窗提示
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// ========== 请求拦截器：自动注入 Token ==========
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ========== 响应拦截器：统一错误码处理 ==========
request.interceptors.response.use(
  response => {
    const { code, msg, data } = response.data

    // 业务成功
    if (code === 200) {
      return data
    }

    // 业务错误码处理
    switch (code) {
      case 401: // 未登录
        ElMessage.error(msg || '登录已过期，请重新登录')
        localStorage.removeItem('token')
        router.push('/login')
        break
      case 403: // 权限不足
        ElMessage.error(msg || '权限不足')
        break
      case 1003: // 账号已冻结
        ElMessage.error(msg)
        localStorage.removeItem('token')
        router.push('/login')
        break
      case 9001: // Token过期
      case 9002: // Token无效
        ElMessage.error(msg || '登录已过期')
        localStorage.removeItem('token')
        router.push('/login')
        break
      default:
        ElMessage.error(msg || '操作失败')
    }

    return Promise.reject(new Error(msg || `请求失败，错误码: ${code}`))
  },
  error => {
    // 网络错误 / 超时
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络')
      return Promise.reject(error)
    }
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查后端服务是否启动')
      return Promise.reject(error)
    }

    // HTTP 错误：优先使用后端返回的业务错误信息
    const { data, status } = error.response
    if (data && data.msg) {
      // 特殊处理：401/403 跳转逻辑
      if (status === 401 || data.code === 401 || data.code === 9001 || data.code === 9002) {
        ElMessage.error(data.msg)
        localStorage.removeItem('token')
        router.push('/login')
      } else if (data.code === 1003) {
        // 账号冻结/注销 → 清除token跳回登录
        ElMessage.error(data.msg)
        localStorage.removeItem('token')
        router.push('/login')
      } else {
        ElMessage.error(data.msg)
      }
    } else {
      // 无业务消息时的兜底
      const msgMap = {
        400: '请求参数错误',
        401: '未登录，请先登录',
        403: '权限不足',
        404: '请求的资源不存在',
        500: '服务器内部错误'
      }
      ElMessage.error(msgMap[status] || `服务器错误(${status})`)
    }
    return Promise.reject(error)
  }
)

export default request
