// router/family.js — 家庭成员路由
const express = require('express');
const router = express.Router();
const familyController = require('../controller/familyController');
const { authRequired } = require('../middleware/auth');

// 所有家庭成员接口需要登录鉴权
router.use(authRequired);

// POST  /api/family/add         — 添加家庭成员
// GET   /api/family/list         — 获取家庭成员列表
// PUT   /api/family/update/:id   — 修改家庭成员
// DELETE /api/family/:id          — 删除家庭成员

router.post('/add', familyController.addFamilyMember);
router.get('/list', familyController.getFamilyList);
router.put('/update/:relationId', familyController.updateFamilyMember);
router.delete('/:relationId', familyController.deleteFamilyMember);

module.exports = router;
