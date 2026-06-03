// src/api/consult.js — AI问诊模块 API
import request from './request'

// 发起AI问诊
export function startConsultAPI(patientId, symptom) {
  return request.post('/consult/start', { patientId, symptom })
}

// 发送对话
export function sendDialogAPI(consultId, speaker, dialogContent) {
  return request.post('/consult/sendDialog', { consultId, speaker, dialogContent })
}

// 结束问诊
export function endConsultAPI(consultId, options = {}) {
  return request.put('/consult/end', { consultId, ...options })
}

// 问诊记录列表
export function getConsultListAPI(page = 1, pageSize = 20) {
  return request.get('/consult/list', { params: { page, pageSize } })
}

// 问诊详情
export function getConsultDetailAPI(consultId) {
  return request.get(`/consult/detail/${consultId}`)
}

// 删除问诊记录
export function deleteConsultAPI(consultId) {
  return request.delete(`/consult/${consultId}`)
}
