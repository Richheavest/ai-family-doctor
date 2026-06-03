/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : ai_family_doctor

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 03/06/2026 12:40:51
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_consult_dialog
-- ----------------------------
DROP TABLE IF EXISTS `t_consult_dialog`;
CREATE TABLE `t_consult_dialog`  (
  `dialog_id` bigint NOT NULL AUTO_INCREMENT,
  `consult_id` bigint NOT NULL COMMENT '关联对应的问诊记录',
  `speaker` tinyint NOT NULL COMMENT '发言方：1-用户，2-AI',
  `dialog_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '对话内容（用户输入或AI回复）',
  `speak_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发言时间戳',
  PRIMARY KEY (`dialog_id`) USING BTREE,
  INDEX `consult_id`(`consult_id` ASC) USING BTREE,
  CONSTRAINT `t_consult_dialog_ibfk_1` FOREIGN KEY (`consult_id`) REFERENCES `t_consult_record` (`consult_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '问诊对话表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_consult_dialog
-- ----------------------------
INSERT INTO `t_consult_dialog` VALUES (1, 1, 1, '医生我咳嗽三天了，喉咙很痛', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (2, 1, 2, '请问有没有发烧、咳痰、胸闷？', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (3, 1, 1, '没有发烧，就是干咳，晚上更厉害', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (4, 1, 2, '根据症状判断为上呼吸道感染，建议多喝水、休息，如加重及时就医', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (5, 2, 1, '我父亲头晕，血压145/95', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (6, 2, 2, '是否在服用降压药？有无胸痛、视力模糊？', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (7, 2, 1, '一直在吃药，没有胸痛，就是晕', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (8, 2, 2, '血压控制不佳，建议尽快到心血管内科复诊调整用药', '2026-06-03 09:22:05');
INSERT INTO `t_consult_dialog` VALUES (9, 3, 1, 'ͷʹ���������죬���ϼ��أ��޷���', '2026-06-03 09:43:11');
INSERT INTO `t_consult_dialog` VALUES (10, 3, 2, '感谢您的描述。根据您提到的\"ͷʹ���������죬���ϼ��أ��޷���...\"症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-03 09:43:11');
INSERT INTO `t_consult_dialog` VALUES (11, 3, 1, 'û��̵�����Ǹɿȣ������е���', '2026-06-03 09:43:11');
INSERT INTO `t_consult_dialog` VALUES (12, 3, 2, '根据您补充的信息，以下是初步分析：\n\n您描述的症状可能与常见呼吸道感染或上呼吸道过敏有关。冬季是呼吸道疾病的高发期，建议关注体温变化。\n\n请注意：这仅是可能性分析，并非确诊结论。', '2026-06-03 09:43:11');

-- ----------------------------
-- Table structure for t_consult_record
-- ----------------------------
DROP TABLE IF EXISTS `t_consult_record`;
CREATE TABLE `t_consult_record`  (
  `consult_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '发起问诊的用户ID，若为代问诊则记录主用户ID',
  `patient_id` bigint NOT NULL COMMENT '实际就诊人（用户本人或家人）ID',
  `symptom` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户初始输入的症状、发病时间、诱因等信息',
  `consult_status` tinyint NOT NULL DEFAULT 0 COMMENT '问诊状态：0-进行中，1-已完成，2-已终止',
  `illness_analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI输出的病情可能性分析，不含确诊结论',
  `medical_priority` tinyint NULL DEFAULT NULL COMMENT '就医优先级：1-紧急就医，2-常规就诊，3-居家观察',
  `recommend_department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'AI推荐的就诊科室，区分普通门诊/急诊',
  `nursing_advice` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI输出的通用居家护理建议，不含处方药推荐',
  `start_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '问诊发起的时间戳',
  `end_time` datetime NULL DEFAULT NULL COMMENT '问诊完成或终止的时间戳',
  `is_delete` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`consult_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `patient_id`(`patient_id` ASC) USING BTREE,
  CONSTRAINT `t_consult_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `t_consult_record_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '问诊记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_consult_record
-- ----------------------------
INSERT INTO `t_consult_record` VALUES (1, 1, 1, '连续3天咳嗽，喉咙痛，无发烧，晚上加重', 1, '上呼吸道感染可能性大，无肺炎迹象', 3, '呼吸内科', '多喝温水，避免辛辣，室内保湿，保证休息', '2026-06-03 09:22:05', NULL, 0);
INSERT INTO `t_consult_record` VALUES (2, 1, 3, '头晕、头痛，血压偏高，持续2天', 1, '血压控制不佳，需警惕高血压急症', 2, '心血管内科', '规律服药，低盐饮食，每日监测血压', '2026-06-03 09:22:05', NULL, 0);
INSERT INTO `t_consult_record` VALUES (3, 1, 1, 'ͷʹ���������죬���ϼ��أ��޷���', 1, '根据您补充的信息，以下是初步分析：\n\n您描述的症状可能与常见呼吸道感染或上呼吸道过敏有关。冬季是呼吸道疾病的高发期，建议关注体温变化。\n\n请注意：这仅是可能性分析，并非确诊结论。', 3, '普通内科 / 呼吸内科', '1. 注意保暖，多喝温水\n2. 保持室内通风\n3. 清淡饮食，避免辛辣刺激\n4. 若症状持续超过3天不缓解，建议前往医院就诊\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-03 09:43:11', '2026-06-03 09:43:12', 0);

-- ----------------------------
-- Table structure for t_family_relation
-- ----------------------------
DROP TABLE IF EXISTS `t_family_relation`;
CREATE TABLE `t_family_relation`  (
  `relation_id` bigint NOT NULL AUTO_INCREMENT,
  `main_user_id` bigint NOT NULL COMMENT '创建家庭关系的主用户ID',
  `family_user_id` bigint NOT NULL COMMENT '被关联的家人用户ID',
  `relation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主用户与家人的亲属关系，如父母、子女、配偶等',
  `permission` tinyint NOT NULL DEFAULT 1 COMMENT '权限：1-只读，2-可编辑',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '家庭关系创建时间戳',
  `is_delete` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识：0-未删除，1-已删除',
  PRIMARY KEY (`relation_id`) USING BTREE,
  UNIQUE INDEX `family_user_id`(`family_user_id` ASC) USING BTREE,
  INDEX `main_user_id`(`main_user_id` ASC) USING BTREE,
  CONSTRAINT `t_family_relation_ibfk_1` FOREIGN KEY (`main_user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `t_family_relation_ibfk_2` FOREIGN KEY (`family_user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '家庭成员关系表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_family_relation
-- ----------------------------
INSERT INTO `t_family_relation` VALUES (1, 1, 2, '配偶', 2, '2026-06-03 09:22:05', 0);
INSERT INTO `t_family_relation` VALUES (2, 1, 3, '父亲', 1, '2026-06-03 09:22:05', 0);

-- ----------------------------
-- Table structure for t_health_basic
-- ----------------------------
DROP TABLE IF EXISTS `t_health_basic`;
CREATE TABLE `t_health_basic`  (
  `basic_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联用户，一个用户对应一条基础档案',
  `past_illness` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '既往病史，如高血压、糖尿病等',
  `surgery_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '既往手术记录',
  `allergy_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '过敏史，无过敏则填“无”',
  `family_illness` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '家族遗传性疾病记录',
  `blood_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '血型，如A、B、AB、O、Rh阳性',
  `past_medicine` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '既往长期服用的药物记录',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '档案最后更新时间',
  `sync_ai` tinyint NOT NULL DEFAULT 1 COMMENT '是否同步AI问诊：0-不同步，1-同步',
  PRIMARY KEY (`basic_id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_basic_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '基础健康档案表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_health_basic
-- ----------------------------
INSERT INTO `t_health_basic` VALUES (1, 1, '过敏性鼻炎', '无', '无', '父亲有高血压', 'A型', NULL, '2026-06-03 09:22:05', 1);
INSERT INTO `t_health_basic` VALUES (2, 2, '轻度脂肪肝', '2020年阑尾炎手术', '青霉素', '无', 'B型', NULL, '2026-06-03 09:22:05', 1);
INSERT INTO `t_health_basic` VALUES (3, 3, '高血压10年', '胆囊切除术', '无', '高血压家族史', 'O型', NULL, '2026-06-03 09:22:05', 1);

-- ----------------------------
-- Table structure for t_health_sign
-- ----------------------------
DROP TABLE IF EXISTS `t_health_sign`;
CREATE TABLE `t_health_sign`  (
  `sign_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联体征数据所属用户',
  `blood_pressure_high` int NULL DEFAULT NULL COMMENT '血压（收缩压），单位mmHg',
  `blood_pressure_low` int NULL DEFAULT NULL COMMENT '血压（舒张压），单位mmHg',
  `blood_sugar` decimal(5, 2) NULL DEFAULT NULL COMMENT '血糖，单位mmol/L',
  `weight` decimal(5, 1) NULL DEFAULT NULL COMMENT '体重，单位kg',
  `heart_rate` int NULL DEFAULT NULL COMMENT '心率，单位次/分钟',
  `measure_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '测量时间戳',
  `measure_remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '测量备注，如“空腹测量”',
  `is_abnormal` tinyint NOT NULL DEFAULT 0 COMMENT '是否异常：0-正常，1-异常',
  PRIMARY KEY (`sign_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_sign_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '体征数据表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_health_sign
-- ----------------------------
INSERT INTO `t_health_sign` VALUES (1, 1, 118, 76, 5.20, 68.5, 72, '2026-06-03 09:22:05', '早上空腹', 0);
INSERT INTO `t_health_sign` VALUES (2, 3, 145, 95, 6.10, 75.0, 80, '2026-06-03 09:22:05', '服药后', 0);

-- ----------------------------
-- Table structure for t_health_visit
-- ----------------------------
DROP TABLE IF EXISTS `t_health_visit`;
CREATE TABLE `t_health_visit`  (
  `visit_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联就诊用户',
  `hospital_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '就诊医院名称',
  `department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '就诊科室名称',
  `diagnosis_result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '医生给出的诊断结果',
  `visit_time` datetime NOT NULL COMMENT '实际就诊时间戳',
  `report_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '检查报告存储路径',
  `physical_report_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '体检报告存储路径',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '就诊相关备注',
  PRIMARY KEY (`visit_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_visit_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '就诊记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_health_visit
-- ----------------------------
INSERT INTO `t_health_visit` VALUES (1, 3, '北京大学人民医院', '心血管内科', '原发性高血压2级', '2025-01-10 09:30:00', NULL, NULL, NULL);
INSERT INTO `t_health_visit` VALUES (2, 1, '北京协和医院', '呼吸内科', '急性支气管炎', '2025-02-15 14:10:00', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for t_operate_log
-- ----------------------------
DROP TABLE IF EXISTS `t_operate_log`;
CREATE TABLE `t_operate_log`  (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `operate_user_id` bigint NOT NULL COMMENT '操作人ID',
  `operate_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作类型',
  `operate_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作详情',
  `operate_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`) USING BTREE,
  INDEX `operate_user_id`(`operate_user_id` ASC) USING BTREE,
  CONSTRAINT `t_operate_log_ibfk_1` FOREIGN KEY (`operate_user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统操作日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_operate_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_permission
-- ----------------------------
DROP TABLE IF EXISTS `t_permission`;
CREATE TABLE `t_permission`  (
  `perm_id` int NOT NULL AUTO_INCREMENT,
  `perm_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '权限名称',
  `perm_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '权限标识，用于接口鉴权',
  `role_id` int NOT NULL COMMENT '关联角色ID',
  PRIMARY KEY (`perm_id`) USING BTREE,
  UNIQUE INDEX `perm_name`(`perm_name` ASC) USING BTREE,
  UNIQUE INDEX `perm_key`(`perm_key` ASC) USING BTREE,
  INDEX `role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `t_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `t_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '权限表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_permission
-- ----------------------------

-- ----------------------------
-- Table structure for t_role
-- ----------------------------
DROP TABLE IF EXISTS `t_role`;
CREATE TABLE `t_role`  (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色名称',
  `role_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色权限范围描述',
  PRIMARY KEY (`role_id`) USING BTREE,
  UNIQUE INDEX `role_name`(`role_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_role
-- ----------------------------
INSERT INTO `t_role` VALUES (1, '普通用户', '可问诊、管理家人、健康档案');
INSERT INTO `t_role` VALUES (2, '家人用户', '仅查看本人健康档案');
INSERT INTO `t_role` VALUES (3, '管理员', '全系统数据管理');

-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user`  (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录账号（手机号/邮箱）',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'BCrypt加密后的密码',
  `real_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户真实姓名',
  `id_card` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '脱敏存储的身份证号',
  `role_id` int NOT NULL COMMENT '关联角色ID',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '账号状态：1-正常，0-冻结',
  `register_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后登录IP',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `id_card`(`id_card` ASC) USING BTREE,
  INDEX `role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `t_user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `t_role` (`role_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户信息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_user
-- ----------------------------
INSERT INTO `t_user` VALUES (1, 'zhangsan', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '张三', '110101199003074567', 1, 1, '2026-06-03 09:22:05', '2026-06-03 12:30:14', '::1');
INSERT INTO `t_user` VALUES (2, 'lisi', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '李四', '310106198511227890', 1, 1, '2026-06-03 09:22:05', NULL, NULL);
INSERT INTO `t_user` VALUES (3, 'wangwu', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '王五', '440301199505152345', 2, 1, '2026-06-03 09:22:05', NULL, NULL);
INSERT INTO `t_user` VALUES (4, 'admin', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '系统管理员', NULL, 3, 1, '2026-06-03 09:22:05', '2026-06-03 12:29:51', '::1');

SET FOREIGN_KEY_CHECKS = 1;
