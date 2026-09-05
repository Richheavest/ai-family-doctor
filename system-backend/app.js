// app.js — AI家庭医生问诊Web系统 Node.js后端入口
// 基于Express框架，采用分层架构：controller / service / dao / config / utils / router

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiRouter = require('./router/index');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- 全局中间件 --------------------
// CORS跨域
app.use(cors());

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));

// 解析URL编码请求体
app.use(express.urlencoded({ extended: true }));

// 请求日志（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// -------------------- 路由注册 --------------------
// /api 前缀统一路由
app.use('/api', apiRouter);

// -------------------- 错误处理 --------------------
// 404处理
app.use(notFoundHandler);

// 全局异常捕获
app.use(errorHandler);

// -------------------- 启动服务 --------------------
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   AI家庭医生问诊Web系统 — 后端服务            ║
  ║   端口: ${PORT}                                ║
  ║   环境: ${process.env.NODE_ENV || 'development'}                       ║
  ║   地址: http://localhost:${PORT}                 ║
  ║   健康检查: http://localhost:${PORT}/api/health   ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
