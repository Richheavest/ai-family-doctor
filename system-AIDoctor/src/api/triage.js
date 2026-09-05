// src/api/triage.js — 挂号分诊指导模块 API
import request from './request'

// 症状→科室推荐
export function triageRecommendAPI(symptom) {
  return request.post('/triage/recommend', { symptom })
}

// 医院列表（可选筛选）
export function getHospitalsAPI(params = {}) {
  return request.get('/triage/hospitals', { params })
}

// 科室就诊指南
export function getDeptGuideAPI(dept) {
  return request.get(`/triage/guide/${encodeURIComponent(dept)}`)
}

// 所有科室列表
export function getDepartmentsAPI() {
  return request.get('/triage/departments')
}
