// router/consult.js — AI问诊路由
const express = require('express');
const router = express.Router();
const consultController = require('../controller/consultController');
const { authRequired } = require('../middleware/auth');

// 所有问诊接口需要登录鉴权
router.use(authRequired);

// POST /api/consult/start    — 发起AI问诊
// POST /api/consult/sendDialog — 发送对话
// PUT  /api/consult/end       — 结束问诊
// GET  /api/consult/list      — 问诊记录列表
// GET  /api/consult/detail/:id — 问诊详情
// DELETE /api/consult/:id      — 删除问诊记录

router.post('/start', consultController.startConsult);
router.post('/sendDialog', consultController.sendDialog);
router.put('/end', consultController.endConsult);
router.get('/list', consultController.getConsultList);
router.get('/detail/:consultId', consultController.getConsultDetail);
router.delete('/:consultId', consultController.deleteConsult);

module.exports = router;
