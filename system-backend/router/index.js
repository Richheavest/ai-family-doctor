// router/index.js — 路由汇总入口
const express = require('express');
const router = express.Router();

const consultRouter = require('./consult');
const familyRouter = require('./family');
const healthRouter = require('./health');
const userRouter = require('./user');
const adminRouter = require('./admin');
const triageRouter = require('./triage');

// API路由汇总
router.use('/consult', consultRouter);   // /api/consult/*
router.use('/family', familyRouter);     // /api/family/*
router.use('/health', healthRouter);     // /api/health/*
router.use('/user', userRouter);         // /api/user/*
router.use('/admin', adminRouter);       // /api/admin/*
router.use('/triage', triageRouter);     // /api/triage/*

// 健康检查
router.get('/health', (req, res) => {
  res.json({ code: 200, msg: 'AI家庭医生系统运行正常', data: { timestamp: new Date().toISOString() } });
});

module.exports = router;
