// src/api/health.js — 健康档案模块 API
import request from './request'

// ==================== 基础信息 ====================
// GET /api/health/basic — 获取本人的基础健康档案（含健康史）
export function getBasicProfileAPI() {
  return request.get('/health/basic')
}

// POST /api/health/basic — 创建/更新基础信息
export function saveBasicInfoAPI(data) {
  return request.post('/health/basic', data)
}

// GET /api/health/basic/:userId — 查看某个用户的基础档案
export function getBasicProfileByIdAPI(userId) {
  return request.get(`/health/basic/${userId}`)
}

// ==================== 手术史 ====================
// GET /api/health/surgeries — 获取手术史列表
export function getSurgeriesAPI() {
  return request.get('/health/surgeries')
}

// POST /api/health/surgeries — 新增手术史
export function addSurgeryAPI(data) {
  return request.post('/health/surgeries', data)
}

// PUT /api/health/surgeries/:surgeryId — 修改手术记录
export function updateSurgeryAPI(surgeryId, data) {
  return request.put(`/health/surgeries/${surgeryId}`, data)
}

// DELETE /api/health/surgeries/:surgeryId — 删除手术记录
export function deleteSurgeryAPI(surgeryId) {
  return request.delete(`/health/surgeries/${surgeryId}`)
}

// ==================== 疾病史 ====================
// GET /api/health/diseases — 获取疾病史列表
export function getDiseasesAPI() {
  return request.get('/health/diseases')
}

// POST /api/health/diseases — 新增疾病史
export function addDiseaseAPI(data) {
  return request.post('/health/diseases', data)
}

// PUT /api/health/diseases/:diseaseId — 修改疾病记录
export function updateDiseaseAPI(diseaseId, data) {
  return request.put(`/health/diseases/${diseaseId}`, data)
}

// DELETE /api/health/diseases/:diseaseId — 删除疾病记录
export function deleteDiseaseAPI(diseaseId) {
  return request.delete(`/health/diseases/${diseaseId}`)
}

// ==================== 过敏史 ====================
// GET /api/health/allergies — 获取过敏史列表
export function getAllergiesAPI() {
  return request.get('/health/allergies')
}

// POST /api/health/allergies — 新增过敏史
export function addAllergyAPI(data) {
  return request.post('/health/allergies', data)
}

// PUT /api/health/allergies/:allergyId — 修改过敏记录
export function updateAllergyAPI(allergyId, data) {
  return request.put(`/health/allergies/${allergyId}`, data)
}

// DELETE /api/health/allergies/:allergyId — 删除过敏记录
export function deleteAllergyAPI(allergyId) {
  return request.delete(`/health/allergies/${allergyId}`)
}

// ==================== 用药史 ====================
// GET /api/health/medications — 获取用药史列表
export function getMedicationsAPI() {
  return request.get('/health/medications')
}

// POST /api/health/medications — 新增用药史
export function addMedicationAPI(data) {
  return request.post('/health/medications', data)
}

// PUT /api/health/medications/:medicationId — 修改用药记录
export function updateMedicationAPI(medicationId, data) {
  return request.put(`/health/medications/${medicationId}`, data)
}

// DELETE /api/health/medications/:medicationId — 删除用药记录
export function deleteMedicationAPI(medicationId) {
  return request.delete(`/health/medications/${medicationId}`)
}

// ==================== 体征数据 ====================
// POST /api/health/sign — 新增体征数据
export function addSignAPI(data) {
  return request.post('/health/sign', data)
}

// PUT /api/health/sign/:signId — 修改体征数据
export function updateSignAPI(signId, data) {
  return request.put(`/health/sign/${signId}`, data)
}

// DELETE /api/health/sign/:signId — 删除体征数据
export function deleteSignAPI(signId) {
  return request.delete(`/health/sign/${signId}`)
}

// GET /api/health/sign/list — 体征数据列表
export function getSignListAPI(params) {
  return request.get('/health/sign/list', { params })
}

// GET /api/health/sign/latest — 最近一条体征数据
export function getLatestSignAPI() {
  return request.get('/health/sign/latest')
}

// ==================== 就诊记录 ====================
// POST /api/health/visit — 新增就诊记录
export function addVisitAPI(data) {
  return request.post('/health/visit', data)
}

// PUT /api/health/visit/:visitId — 修改就诊记录
export function updateVisitAPI(visitId, data) {
  return request.put(`/health/visit/${visitId}`, data)
}

// DELETE /api/health/visit/:visitId — 删除就诊记录
export function deleteVisitAPI(visitId) {
  return request.delete(`/health/visit/${visitId}`)
}

// GET /api/health/visit/list — 就诊记录列表
export function getVisitListAPI(params) {
  return request.get('/health/visit/list', { params })
}