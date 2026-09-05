// router/triage.js — 挂号分诊指导路由（全部需要登录鉴权）
const express = require('express');
const router = express.Router();
const triageController = require('../controller/triageController');
const { authRequired } = require('../middleware/auth');

// 所有挂号分诊接口需要登录鉴权
router.use(authRequired);

// POST /api/triage/recommend   — 症状→科室推荐
// GET  /api/triage/hospitals   — 医院列表
// GET  /api/triage/guide/:dept — 科室就诊指南
// GET  /api/triage/departments — 所有科室列表

router.post('/recommend', triageController.recommend);
router.get('/hospitals', triageController.getHospitals);
router.get('/guide/:dept', triageController.getDepartmentGuide);
router.get('/departments', triageController.getDepartments);

module.exports = router;
