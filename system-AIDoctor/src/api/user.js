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
export function getUserInfoAPI(userId) {
  return request.get(`/user/info/${userId}`)
}

// 修改个人信息
export function updateUserInfoAPI(userId, data) {
  return request.put(`/user/update/${userId}`, data)
}

// 修改密码
export function updatePasswordAPI(data) {
  return request.put('/user/password', data)
}
