// router/admin.js — 后台管理路由（全部需要管理员鉴权）
const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminConsultController = require('../controller/adminConsultController');
const { adminRequired } = require('../middleware/auth');

router.use(adminRequired);

// 统计
router.get('/statistics', adminController.getStatistics);

// 用户管理
router.get('/users', adminController.getUserList);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/reset-pwd', adminController.resetUserPassword);

// 问诊管理
router.get('/consults', adminConsultController.getConsultList);
router.get('/consults/:id', adminConsultController.getConsultDetail);
router.delete('/consults/:id', adminConsultController.deleteConsult);

module.exports = router;
