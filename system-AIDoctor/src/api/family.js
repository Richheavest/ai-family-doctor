// src/api/family.js — 家庭成员模块 API
import request from './request'

// 添加家庭成员
export function addFamilyAPI(familyUsername, relation, permission) {
  return request.post('/family/add', { familyUsername, relation, permission })
}

// 家庭成员列表
export function getFamilyListAPI() {
  return request.get('/family/list')
}

// 修改家庭成员
export function updateFamilyAPI(relationId, data) {
  return request.put(`/family/update/${relationId}`, data)
}

// 删除家庭成员
export function deleteFamilyAPI(relationId) {
  return request.delete(`/family/${relationId}`)
}
