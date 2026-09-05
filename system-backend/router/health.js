// router/health.js — 健康档案路由
const express = require('express');
const router = express.Router();
const healthController = require('../controller/healthController');
const { authRequired } = require('../middleware/auth');

// 所有健康档案接口需要登录鉴权
router.use(authRequired);

// ==================== 基础信息 ====================
// GET   /api/health/basic                  — 获取本人的基础健康档案（含健康史）
// POST  /api/health/basic                  — 创建/更新基础信息
// GET   /api/health/basic/:userId          — 查看某个用户的基础档案

router.get('/basic', healthController.getBasicProfile);
router.post('/basic', healthController.saveBasicInfo);
router.get('/basic/:userId', healthController.getBasicProfileById);

// ==================== 手术史 ====================
// GET   /api/health/surgeries              — 获取手术史列表
// POST  /api/health/surgeries              — 新增手术史
// PUT   /api/health/surgeries/:surgeryId   — 修改手术记录
// DELETE /api/health/surgeries/:surgeryId   — 删除手术记录

router.get('/surgeries', healthController.getSurgeries);
router.post('/surgeries', healthController.addSurgery);
router.put('/surgeries/:surgeryId', healthController.updateSurgery);
router.delete('/surgeries/:surgeryId', healthController.deleteSurgery);

// ==================== 疾病史 ====================
// GET   /api/health/diseases               — 获取疾病史列表
// POST  /api/health/diseases               — 新增疾病史
// PUT   /api/health/diseases/:diseaseId    — 修改疾病记录
// DELETE /api/health/diseases/:diseaseId    — 删除疾病记录

router.get('/diseases', healthController.getDiseases);
router.post('/diseases', healthController.addDisease);
router.put('/diseases/:diseaseId', healthController.updateDisease);
router.delete('/diseases/:diseaseId', healthController.deleteDisease);

// ==================== 过敏史 ====================
// GET   /api/health/allergies              — 获取过敏史列表
// POST  /api/health/allergies              — 新增过敏史
// PUT   /api/health/allergies/:allergyId   — 修改过敏记录
// DELETE /api/health/allergies/:allergyId   — 删除过敏记录

router.get('/allergies', healthController.getAllergies);
router.post('/allergies', healthController.addAllergy);
router.put('/allergies/:allergyId', healthController.updateAllergy);
router.delete('/allergies/:allergyId', healthController.deleteAllergy);

// ==================== 用药史 ====================
// GET   /api/health/medications                — 获取用药史列表
// POST  /api/health/medications                — 新增用药史
// PUT   /api/health/medications/:medicationId  — 修改用药记录
// DELETE /api/health/medications/:medicationId  — 删除用药记录

router.get('/medications', healthController.getMedications);
router.post('/medications', healthController.addMedication);
router.put('/medications/:medicationId', healthController.updateMedication);
router.delete('/medications/:medicationId', healthController.deleteMedication);

// ==================== 体征数据 ====================
// POST  /api/health/sign                  — 新增体征数据
// GET   /api/health/sign/list             — 体征数据列表
// GET   /api/health/sign/latest           — 最近一条体征数据
// PUT   /api/health/sign/:signId          — 修改体征数据
// DELETE /api/health/sign/:signId          — 删除体征数据

router.post('/sign', healthController.addSign);
router.get('/sign/list', healthController.getSignList);
router.get('/sign/latest', healthController.getLatestSign);
router.put('/sign/:signId', healthController.updateSign);
router.delete('/sign/:signId', healthController.deleteSign);

// ==================== 就诊记录 ====================
// POST  /api/health/visit                 — 新增就诊记录
// GET   /api/health/visit/list            — 就诊记录列表
// PUT   /api/health/visit/:visitId        — 修改就诊记录
// DELETE /api/health/visit/:visitId        — 删除就诊记录

router.post('/visit', healthController.addVisit);
router.get('/visit/list', healthController.getVisitList);
router.put('/visit/:visitId', healthController.updateVisit);
router.delete('/visit/:visitId', healthController.deleteVisit);

module.exports = router;