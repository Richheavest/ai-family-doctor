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

// ==================== 问诊管理 ====================

// 问诊列表（管理员视角，全量数据）
export function getAdminConsultListAPI(params) {
  return request.get('/admin/consults', { params })
}

// 问诊详情
export function getAdminConsultDetailAPI(consultId) {
  return request.get(`/admin/consults/${consultId}`)
}

// 删除问诊
export function deleteAdminConsultAPI(consultId) {
  return request.delete(`/admin/consults/${consultId}`)
}
