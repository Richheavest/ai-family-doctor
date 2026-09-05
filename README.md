# AI 家庭医生问诊 Web 系统

基于 DeepSeek 大模型的 AI 家庭医生问诊系统，采用 Node.js + Vue3 全栈开发，覆盖 **AI 引导式问诊、挂号分诊指导、家庭健康档案、家庭成员管理、管理员后台** 五大模块。

> ⚠️ **免责声明**：本系统仅提供健康咨询、病情可能性分析与就医指导，不构成医疗诊断、处方或治疗方案。AI 内容仅供健康参考，如有不适请及时前往正规医疗机构就诊。

## ✨ 功能亮点

- **引导式多轮 AI 问诊**：通过系统提示词工程约束 LLM 行为（单轮单问、≤10 轮、仅做可能性分析、强制免责声明），并将就诊人健康档案摘要注入上下文，实现「带病史的个性化问诊」。
- **挂号分诊 AI + 规则库双链路**：优先调用大模型输出结构化科室推荐（置信度 + 优先级 + 就诊指南），API 超时/限流时**静默降级**到本地 22 条症状规则库，含急危重症识别（胸痛/呼吸困难自动标「紧急就医」）。
- **家庭健康档案多维建模**：拆分为基础信息、手术史、疾病史、过敏史、用药史、体征记录、就诊记录等实体，作为 AI 问诊的数据底座。
- **三级权限体系**：JWT 鉴权 + 角色中间件区分普通用户 / 家人用户 / 管理员，管理员后台支持用户管理、问诊管理与系统统计。
- **AI 输出容错解析**：用括号匹配 + 转义状态机解析 LLM 可能带 Markdown 代码块、带尾巴免责声明的返回，而非直接 `JSON.parse`。

## 🛠 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite、Element Plus、Pinia、Vue Router、Axios |
| 后端 | Node.js、Express、MySQL (mysql2/promise)、JWT (jsonwebtoken)、bcryptjs |
| AI | DeepSeek API（chat/completions） |
| 数据库 | MySQL 8.0（utf8mb4） |

## 📁 项目结构

```
.
├── system-AIDoctor/          # 前端（Vue3 + Vite）
│   ├── src/
│   │   ├── api/              # Axios 封装与接口定义
│   │   ├── views/            # 页面：登录/问诊/健康档案/分诊/后台
│   │   ├── router/           # 前端路由
│   │   └── store/            # Pinia 状态管理
│   ├── vite.config.js        # 开发端口 5173，/api 代理到 3001
│   └── package.json
├── system-backend/           # 后端（Express 分层架构）
│   ├── app.js                # 入口，端口 3001
│   ├── router/               # 路由层（user/consult/family/health/admin/triage）
│   ├── controller/           # 控制层
│   ├── service/              # 业务逻辑层（AI 调用、分诊降级等）
│   ├── dao/                  # 数据访问层
│   ├── middleware/           # JWT 鉴权、全局错误处理
│   ├── utils/                # claudeApi、jwtHelper、response 等工具
│   └── config/               # 数据库连接、初始化脚本
├── ai_family_doctor.sql      # 数据库完整建表脚本（14 张表）
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- MySQL ≥ 8.0

### 1. 初始化数据库

导入根目录的完整建表脚本：

```bash
mysql -u root -p < ai_family_doctor.sql
```

或使用后端自带的初始化脚本（`npm run db:init`，自动建库建表并初始化角色/权限数据）：

```bash
cd system-backend
npm run db:init
```

### 2. 配置后端环境变量

复制并修改 `system-backend/.env`（或参考 `.env.example`）：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=ai_family_doctor

# JWT
JWT_SECRET=自定义密钥
JWT_EXPIRES_IN=2h

# DeepSeek（AI 问诊 + 挂号分诊）
DEEPSEEK_API_KEY=你的_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

PORT=3001
```

> 未配置 `DEEPSEEK_API_KEY` 时，AI 问诊返回模拟回复、挂号分诊降级到本地规则库，系统仍可正常运行。

### 3. 启动后端

```bash
cd system-backend
npm install
npm run dev        # 或 npm start
```

后端启动于 `http://localhost:3001`，健康检查：`GET /api/health`。

### 4. 启动前端

```bash
cd system-AIDoctor
npm install
npm run dev
```

前端启动于 `http://localhost:5173`，`/api` 请求自动代理到后端 3001 端口。

## 📡 API 概览

所有接口统一前缀 `/api`，除登录/注册外均需在请求头携带 `Authorization: Bearer <token>`。

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 用户 | POST | `/api/user/register` | 注册 |
| 用户 | POST | `/api/user/login` | 登录（返回 JWT） |
| 问诊 | POST | `/api/consult/start` | 发起 AI 问诊 |
| 问诊 | POST | `/api/consult/sendDialog` | 多轮对话 |
| 问诊 | GET | `/api/consult/list` | 问诊记录列表 |
| 分诊 | POST | `/api/triage/recommend` | 症状 → 科室推荐 |
| 分诊 | GET | `/api/triage/hospitals` | 医院列表 |
| 分诊 | GET | `/api/triage/departments` | 科室列表 |
| 健康档案 | GET/POST | `/api/health/basic` | 基础健康档案 |
| 健康档案 | GET/POST/PUT/DELETE | `/api/health/surgeries` 等 | 手术史/疾病史/过敏史/用药史/体征/就诊记录 |
| 家庭成员 | POST/GET | `/api/family/add`、`/api/family/list` | 家庭成员管理 |
| 管理后台 | GET | `/api/admin/statistics` | 系统统计（需管理员） |
| 管理后台 | GET/PUT | `/api/admin/users` | 用户管理（需管理员） |

## 👥 角色说明

| 角色 | role_id | 权限 |
| --- | --- | --- |
| 普通用户 | 1 | AI 问诊、健康档案、挂号分诊、家庭成员管理 |
| 家人用户 | 2 | 被主账号关联，仅查看 / 被代操作 |
| 管理员 | 3 | 用户管理、问诊管理、系统统计 |
