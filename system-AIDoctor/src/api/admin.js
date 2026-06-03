// src/api/admin.js — 后台管理 API
import request from './request'

// 系统统计
export function getStatisticsAPI() {
  return request.get('/admin/statistics')
}

// 用户列表
export function getUserListAPI(params) {
  return request.get('/admin/users', { params })
}

// 用户详情
export function getUserDetailAPI(userId) {
  return request.get(`/admin/users/${userId}`)
}

// 冻结/解冻
export function updateUserStatusAPI(userId, status) {
  return request.put(`/admin/users/${userId}/status`, { status })
}

// 修改角色
export function updateUserRoleAPI(userId, roleId) {
  return request.put(`/admin/users/${userId}/role`, { roleId })
}

// 重置密码
export function resetUserPasswordAPI(userId, newPassword) {
  return request.put(`/admin/users/${userId}/reset-pwd`, { newPassword })
}
