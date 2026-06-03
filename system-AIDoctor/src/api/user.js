// src/api/user.js — 用户模块 API
import request from './request'

// 用户登录
export function loginAPI(username, password) {
  return request.post('/user/login', { username, password })
}

// 用户注册
export function registerAPI(data) {
  return request.post('/user/register', data)
}

// 获取当前用户信息
export function getUserInfoAPI() {
  return request.get('/user/info')
}

// 修改密码
export function changePasswordAPI(oldPassword, newPassword) {
  return request.put('/user/password', { oldPassword, newPassword })
}

// 修改个人信息
export function updateProfileAPI(data) {
  return request.put('/user/profile', data)
}

// 注销账号
export function deactivateAccountAPI(password) {
  return request.put('/user/deactivate', { password })
}
