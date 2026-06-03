// router/user.js — 用户路由
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { authRequired } = require('../middleware/auth');

// 公开接口（无需登录）
router.post('/login', userController.login);
router.post('/register', userController.register);

// 需要登录鉴权的接口
router.put('/password', authRequired, userController.changePassword);
router.put('/profile', authRequired, userController.updateProfile);
router.put('/deactivate', authRequired, userController.deactivateAccount);
router.get('/info', authRequired, userController.getUserInfo);

module.exports = router;
