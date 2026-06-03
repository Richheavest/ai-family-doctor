// config/initDb.js — 数据库初始化脚本（建表）
const mysql = require('mysql2/promise');
require('dotenv').config();

const SCHEMA = `
-- ============================================
-- AI家庭医生问诊Web系统 — 数据库初始化脚本
-- 严格按照数据库设计说明书，10张核心表
-- ============================================

CREATE DATABASE IF NOT EXISTS ai_family_doctor
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE ai_family_doctor;

-- 1. 角色表
CREATE TABLE IF NOT EXISTS t_role (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(20) NOT NULL UNIQUE COMMENT '角色名称',
  role_desc VARCHAR(200) COMMENT '角色权限范围描述'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 2. 用户信息表
CREATE TABLE IF NOT EXISTS t_user (
  user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号（手机号/邮箱）',
  password VARCHAR(100) NOT NULL COMMENT 'BCrypt加密后的密码',
  real_name VARCHAR(20) NOT NULL COMMENT '用户真实姓名',
  id_card VARCHAR(20) UNIQUE COMMENT '脱敏存储的身份证号',
  role_id INT NOT NULL DEFAULT 1 COMMENT '关联角色ID',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '账号状态：1-正常，0-冻结',
  register_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  last_login_time DATETIME COMMENT '最后登录时间',
  login_ip VARCHAR(50) COMMENT '最后登录IP',
  FOREIGN KEY (role_id) REFERENCES t_role(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 3. 权限表
CREATE TABLE IF NOT EXISTS t_permission (
  perm_id INT PRIMARY KEY AUTO_INCREMENT,
  perm_name VARCHAR(50) NOT NULL UNIQUE COMMENT '权限名称',
  perm_key VARCHAR(100) NOT NULL UNIQUE COMMENT '权限标识，用于接口鉴权',
  role_id INT NOT NULL COMMENT '关联角色ID',
  FOREIGN KEY (role_id) REFERENCES t_role(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 4. 问诊记录表
CREATE TABLE IF NOT EXISTS t_consult_record (
  consult_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '发起问诊的用户ID',
  patient_id BIGINT NOT NULL COMMENT '实际就诊人ID',
  symptom TEXT NOT NULL COMMENT '初始症状描述',
  consult_status TINYINT NOT NULL DEFAULT 0 COMMENT '0-进行中，1-已完成，2-已终止',
  illness_analysis TEXT COMMENT 'AI病情分析结果',
  medical_priority TINYINT COMMENT '1-紧急就医，2-常规就诊，3-居家观察',
  recommend_department VARCHAR(50) COMMENT '推荐科室',
  nursing_advice TEXT COMMENT '居家护理建议',
  start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '问诊开始时间',
  end_time DATETIME COMMENT '问诊结束时间',
  is_delete TINYINT NOT NULL DEFAULT 0 COMMENT '0-未删除，1-已删除',
  FOREIGN KEY (user_id) REFERENCES t_user(user_id),
  FOREIGN KEY (patient_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问诊记录表';

-- 5. 问诊对话表
CREATE TABLE IF NOT EXISTS t_consult_dialog (
  dialog_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  consult_id BIGINT NOT NULL COMMENT '关联问诊记录ID',
  speaker TINYINT NOT NULL COMMENT '1-用户，2-AI',
  dialog_content TEXT NOT NULL COMMENT '对话内容',
  speak_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发言时间',
  FOREIGN KEY (consult_id) REFERENCES t_consult_record(consult_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问诊对话表';

-- 6. 基础健康档案表
CREATE TABLE IF NOT EXISTS t_health_basic (
  basic_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE COMMENT '关联用户ID（一个用户一条基础档案）',
  past_illness TEXT COMMENT '既往病史',
  surgery_history TEXT COMMENT '手术史',
  allergy_history TEXT NOT NULL COMMENT '过敏史（无过敏填"无"）',
  family_illness TEXT COMMENT '家族病史',
  blood_type VARCHAR(10) COMMENT '血型',
  past_medicine TEXT COMMENT '既往用药史',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  sync_ai TINYINT NOT NULL DEFAULT 1 COMMENT '是否同步AI问诊：0-不同步，1-同步',
  FOREIGN KEY (user_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基础健康档案表';

-- 7. 体征数据表
CREATE TABLE IF NOT EXISTS t_health_sign (
  sign_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '关联用户ID',
  blood_pressure_high INT COMMENT '血压收缩压(mmHg)',
  blood_pressure_low INT COMMENT '血压舒张压(mmHg)',
  blood_sugar DECIMAL(5,2) COMMENT '血糖(mmol/L)',
  weight DECIMAL(5,1) COMMENT '体重(kg)',
  heart_rate INT COMMENT '心率(次/分钟)',
  measure_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '测量时间',
  measure_remark VARCHAR(200) COMMENT '测量备注',
  is_abnormal TINYINT NOT NULL DEFAULT 0 COMMENT '0-正常，1-异常',
  FOREIGN KEY (user_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体征数据表';

-- 8. 就诊记录表
CREATE TABLE IF NOT EXISTS t_health_visit (
  visit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '关联用户ID',
  hospital_name VARCHAR(100) NOT NULL COMMENT '就诊医院',
  department VARCHAR(50) NOT NULL COMMENT '就诊科室',
  diagnosis_result TEXT NOT NULL COMMENT '诊断结果',
  visit_time DATETIME NOT NULL COMMENT '就诊时间',
  report_path VARCHAR(255) COMMENT '检查报告存储路径',
  physical_report_path VARCHAR(255) COMMENT '体检报告存储路径',
  remark VARCHAR(200) COMMENT '备注',
  FOREIGN KEY (user_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='就诊记录表';

-- 9. 家庭成员关系表
CREATE TABLE IF NOT EXISTS t_family_relation (
  relation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  main_user_id BIGINT NOT NULL COMMENT '主用户ID',
  family_user_id BIGINT NOT NULL UNIQUE COMMENT '家人用户ID（一个用户只能被一个主用户关联）',
  relation VARCHAR(20) NOT NULL COMMENT '亲属关系',
  permission TINYINT NOT NULL DEFAULT 1 COMMENT '1-只读，2-可编辑',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  is_delete TINYINT NOT NULL DEFAULT 0 COMMENT '0-未删除，1-已删除',
  FOREIGN KEY (main_user_id) REFERENCES t_user(user_id),
  FOREIGN KEY (family_user_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭成员关系表';

-- 10. 操作日志表
CREATE TABLE IF NOT EXISTS t_operate_log (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  operate_user_id BIGINT NOT NULL COMMENT '操作人ID',
  operate_type VARCHAR(50) NOT NULL COMMENT '操作类型',
  operate_content TEXT NOT NULL COMMENT '操作内容',
  operate_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  ip_address VARCHAR(50) COMMENT '操作IP',
  FOREIGN KEY (operate_user_id) REFERENCES t_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 初始化角色数据
INSERT INTO t_role (role_id, role_name, role_desc) VALUES
  (1, '普通用户', '可操作个人所有功能'),
  (2, '家人用户', '仅查看/被代操作'),
  (3, '管理员', '可操作后台所有功能')
ON DUPLICATE KEY UPDATE role_desc = VALUES(role_desc);

-- 初始化权限数据
INSERT INTO t_permission (perm_id, perm_name, perm_key, role_id) VALUES
  (1, 'AI问诊', 'consult:submit', 1),
  (2, '健康档案查看', 'health:view', 1),
  (3, '用户管理', 'user:manage', 3),
  (4, '系统配置', 'system:config', 3)
ON DUPLICATE KEY UPDATE perm_key = VALUES(perm_key);

-- 初始化测试管理员（密码 123456 的bcrypt加密）
-- INSERT INTO t_user (username, password, real_name, role_id) VALUES
--   ('admin', '$2a$10$...', '系统管理员', 3);
`;

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('[DB Init] 开始初始化数据库...');
  await connection.query(SCHEMA);
  console.log('[DB Init] ✅ 数据库初始化完成：10张表已创建，角色/权限已初始化');
  await connection.end();
}

initDb().catch(err => {
  console.error('[DB Init] ❌ 初始化失败:', err.message);
  process.exit(1);
});
