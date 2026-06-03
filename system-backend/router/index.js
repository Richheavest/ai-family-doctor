// router/index.js — 路由汇总入口
const express = require('express');
const router = express.Router();

const consultRouter = require('./consult');
const familyRouter = require('./family');
const userRouter = require('./user');
const adminRouter = require('./admin');

// API路由汇总
router.use('/consult', consultRouter);   // /api/consult/*
router.use('/family', familyRouter);     // /api/family/*
router.use('/user', userRouter);         // /api/user/*
router.use('/admin', adminRouter);       // /api/admin/*

// 健康检查
router.get('/health', (req, res) => {
  res.json({ code: 200, msg: 'AI家庭医生系统运行正常', data: { timestamp: new Date().toISOString() } });
});

module.exports = router;
