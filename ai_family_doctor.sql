/*
 Navicat Premium Dump SQL

 Source Server         : PracticalTraining
 Source Server Type    : MySQL
 Source Server Version : 80040 (8.0.40)
 Source Host           : localhost:3306
 Source Schema         : ai_family_doctor

 Target Server Type    : MySQL
 Target Server Version : 80040 (8.0.40)
 File Encoding         : 65001

 Date: 06/06/2026 22:55:38
*/

CREATE DATABASE IF NOT EXISTS `ai_family_doctor`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `ai_family_doctor`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
INSERT INTO `t_user` VALUES (1, 'zhangsan', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '张三', '110101199003074567', 1, 1, '2026-06-03 09:22:05', '2026-06-06 22:52:32', '::1');
INSERT INTO `t_user` VALUES (2, 'lisi', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '李四', '310106198511227890', 1, 1, '2026-06-03 09:22:05', NULL, NULL);
INSERT INTO `t_user` VALUES (3, 'wangwu', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '王五', '440301199505152345', 2, 1, '2026-06-03 09:22:05', NULL, NULL);
INSERT INTO `t_user` VALUES (4, 'admin', '$2a$10$2GN.rvqcjNmfn./IsbW.qucjrRkJBCotEbEPp.H5K3F01KCOlSg5.', '系统管理员', NULL, 3, 1, '2026-06-03 09:22:05', '2026-06-03 12:29:51', '::1');

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
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '问诊记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_consult_record
-- ----------------------------
INSERT INTO `t_consult_record` VALUES (1, 1, 1, '连续3天咳嗽，喉咙痛，无发烧，晚上加重', 1, '上呼吸道感染可能性大，无肺炎迹象', 3, '呼吸内科', '多喝温水，避免辛辣，室内保湿，保证休息', '2026-06-03 09:22:05', NULL, 0);
INSERT INTO `t_consult_record` VALUES (2, 1, 3, '头晕、头痛，血压偏高，持续2天', 1, '血压控制不佳，需警惕高血压急症', 2, '心血管内科', '规律服药，低盐饮食，每日监测血压', '2026-06-03 09:22:05', NULL, 0);
INSERT INTO `t_consult_record` VALUES (4, 1, 1, '医生，我肚子不舒服好几年了，反反复复的。主要就是肚脐周围隐隐作痛，有时候像拧着一样，但上个厕所大便完了就能好一点。大便也不正常，有时候一天跑三四趟，拉稀，有时候又两三天拉不出来，干得像羊粪蛋。还总觉得肚子胀，咕噜咕噜响，放个屁能舒服点。吃凉的、辣的或者一紧张、一生气就加重，晚上睡着倒没事。您说我这到底是什么毛病？', 0, NULL, NULL, NULL, NULL, '2026-06-05 22:25:39', NULL, 0);
INSERT INTO `t_consult_record` VALUES (5, 1, 1, '你好', 0, NULL, NULL, NULL, NULL, '2026-06-06 22:34:33', NULL, 0);
INSERT INTO `t_consult_record` VALUES (6, 1, 1, '哈哈', 0, NULL, NULL, NULL, NULL, '2026-06-06 22:34:40', NULL, 0);
INSERT INTO `t_consult_record` VALUES (7, 1, 1, '你好', 0, NULL, NULL, NULL, NULL, '2026-06-06 22:49:38', NULL, 0);

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
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '问诊对话表' ROW_FORMAT = DYNAMIC;

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
INSERT INTO `t_consult_dialog` VALUES (13, 4, 1, '医生，我肚子不舒服好几年了，反反复复的。主要就是肚脐周围隐隐作痛，有时候像拧着一样，但上个厕所大便完了就能好一点。大便也不正常，有时候一天跑三四趟，拉稀，有时候又两三天拉不出来，干得像羊粪蛋。还总觉得肚子胀，咕噜咕噜响，放个屁能舒服点。吃凉的、辣的或者一紧张、一生气就加重，晚上睡着倒没事。您说我这到底是什么毛病？', '2026-06-05 22:25:39');
INSERT INTO `t_consult_dialog` VALUES (14, 4, 2, '感谢您的描述。根据您提到的\"医生，我肚子不舒服好几年了，反反复复的。主要就是肚脐周围隐隐...\"症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-05 22:25:39');
INSERT INTO `t_consult_dialog` VALUES (15, 5, 1, '你好', '2026-06-06 22:34:33');
INSERT INTO `t_consult_dialog` VALUES (16, 5, 2, '感谢您的描述。根据您提到的\"你好...\"症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-06 22:34:33');
INSERT INTO `t_consult_dialog` VALUES (17, 6, 1, '哈哈', '2026-06-06 22:34:40');
INSERT INTO `t_consult_dialog` VALUES (18, 6, 2, '感谢您的描述。根据您提到的\"哈哈...\"症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-06 22:34:40');
INSERT INTO `t_consult_dialog` VALUES (19, 7, 1, '你好', '2026-06-06 22:49:38');
INSERT INTO `t_consult_dialog` VALUES (20, 7, 2, '感谢您的描述。根据您提到的\"你好...\"症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。', '2026-06-06 22:49:38');

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
-- Table structure for t_health_allergy
-- ----------------------------
DROP TABLE IF EXISTS `t_health_allergy`;
CREATE TABLE `t_health_allergy`  (
  `allergy_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联用户ID',
  `allergen` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '过敏原名称',
  `reaction` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '过敏反应描述',
  `severity` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '轻' COMMENT '严重程度：轻/中/重',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_delete` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`allergy_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_allergy_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '过敏史表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of t_health_allergy
-- ----------------------------
INSERT INTO `t_health_allergy` VALUES (1, 1, '青霉素', '皮疹', '轻', '', '2026-06-05 16:18:00', 1);
INSERT INTO `t_health_allergy` VALUES (2, 1, '花生', '呼吸困难', '轻', '', '2026-06-06 00:40:42', 1);
INSERT INTO `t_health_allergy` VALUES (3, 1, '青霉素', '', '轻', '', '2026-06-06 02:19:12', 0);

-- ----------------------------
-- Table structure for t_health_basic
-- ----------------------------
DROP TABLE IF EXISTS `t_health_basic`;
CREATE TABLE `t_health_basic`  (
  `basic_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '关联用户',
  `birth_date` date NULL DEFAULT NULL,
  `gender` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `height` decimal(5, 1) NULL DEFAULT NULL,
  `weight` decimal(5, 1) NULL DEFAULT NULL,
  `waist_circumference` decimal(5, 1) NULL DEFAULT NULL COMMENT '腰围(cm)',
  `past_illness` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '既往病史',
  `surgery_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '手术史',
  `allergy_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '过敏史',
  `family_illness` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '家族病史',
  `blood_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `past_medicine` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '既往用药',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_ai` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`basic_id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_basic_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '基础健康档案表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_basic
-- ----------------------------
INSERT INTO `t_health_basic` VALUES (1, 1, '2005-03-18', '男', 168.0, 47.0, 44.0, '过敏性鼻炎', '无', '无', '不告诉', 'O', NULL, '2026-06-06 22:53:59', 1);
INSERT INTO `t_health_basic` VALUES (2, 2, NULL, NULL, NULL, NULL, NULL, '轻度脂肪肝', '2020年阑尾炎手术', '青霉素', '无', 'B型', NULL, '2026-06-03 09:22:05', 1);
INSERT INTO `t_health_basic` VALUES (3, 3, NULL, NULL, NULL, NULL, NULL, '高血压10年', '胆囊切除术', '无', '高血压家族史', 'O型', NULL, '2026-06-03 09:22:05', 1);

-- ----------------------------
-- Table structure for t_health_disease
-- ----------------------------
DROP TABLE IF EXISTS `t_health_disease`;
CREATE TABLE `t_health_disease`  (
  `disease_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `disease_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `diagnosis_time` datetime NOT NULL,
  `hospital` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `is_cured` tinyint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`disease_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_disease_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '疾病史表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_disease
-- ----------------------------
INSERT INTO `t_health_disease` VALUES (1, 1, '急性阑尾炎', '2010-06-16 00:00:00', '', '', 1, '2026-06-06 00:14:50', 1);
INSERT INTO `t_health_disease` VALUES (2, 1, '感冒', '2026-06-02 00:00:00', '', '', 1, '2026-06-06 00:42:57', 0);

-- ----------------------------
-- Table structure for t_health_medication
-- ----------------------------
DROP TABLE IF EXISTS `t_health_medication`;
CREATE TABLE `t_health_medication`  (
  `medication_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `medicine_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `dosage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `frequency` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `start_time` date NULL DEFAULT NULL,
  `end_time` date NULL DEFAULT NULL,
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `is_ongoing` tinyint NOT NULL DEFAULT 0,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`medication_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_medication_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '既往用药史表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_medication
-- ----------------------------
INSERT INTO `t_health_medication` VALUES (1, 1, '布洛芬', '', '', NULL, NULL, '', 0, '2026-06-06 00:14:50', 1);
INSERT INTO `t_health_medication` VALUES (2, 1, '布洛芬', '', '', NULL, NULL, '', 0, '2026-06-06 00:14:50', 1);
INSERT INTO `t_health_medication` VALUES (3, 1, '碘伏', '', '', NULL, NULL, '', 1, '2026-06-06 00:45:13', 1);
INSERT INTO `t_health_medication` VALUES (4, 1, '布洛芬', '', '', NULL, NULL, '', 0, '2026-06-06 02:13:04', 0);

-- ----------------------------
-- Table structure for t_health_sign
-- ----------------------------
DROP TABLE IF EXISTS `t_health_sign`;
CREATE TABLE `t_health_sign`  (
  `sign_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `blood_pressure_high` int NULL DEFAULT NULL,
  `blood_pressure_low` int NULL DEFAULT NULL,
  `blood_sugar` decimal(5, 2) NULL DEFAULT NULL,
  `weight` decimal(5, 1) NULL DEFAULT NULL,
  `heart_rate` int NULL DEFAULT NULL,
  `measure_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `measure_remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `is_abnormal` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`sign_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_sign_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '体征数据表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_sign
-- ----------------------------
INSERT INTO `t_health_sign` VALUES (2, 3, 145, 95, 6.10, 75.0, 80, '2026-06-03 09:22:05', '服药后', 0);
INSERT INTO `t_health_sign` VALUES (7, 1, 60, 30, 1.00, 10.0, 20, '2026-06-06 00:00:00', '', 1);
INSERT INTO `t_health_sign` VALUES (8, 1, 66, 36, 1.90, 16.0, 26, '2026-06-01 00:00:00', '无', 1);

-- ----------------------------
-- Table structure for t_health_surgery
-- ----------------------------
DROP TABLE IF EXISTS `t_health_surgery`;
CREATE TABLE `t_health_surgery`  (
  `surgery_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `surgery_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `surgery_time` datetime NOT NULL,
  `hospital` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`surgery_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_surgery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '手术史表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_surgery
-- ----------------------------
INSERT INTO `t_health_surgery` VALUES (1, 1, '阑尾切除术', '2026-06-02 00:00:00', '江高镇卫生院', '', '2026-06-06 00:14:50', 0);
INSERT INTO `t_health_surgery` VALUES (2, 1, '前额叶切除', '2026-06-06 00:00:00', '', '', '2026-06-06 00:14:50', 1);
INSERT INTO `t_health_surgery` VALUES (3, 1, '前额叶切除术', '2026-02-10 00:00:00', '', '', '2026-06-06 00:57:45', 1);
INSERT INTO `t_health_surgery` VALUES (4, 1, '不知道', '2026-06-01 00:00:00', '', '', '2026-06-06 02:17:08', 1);

-- ----------------------------
-- Table structure for t_health_visit
-- ----------------------------
DROP TABLE IF EXISTS `t_health_visit`;
CREATE TABLE `t_health_visit`  (
  `visit_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `hospital_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `diagnosis_result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `visit_time` datetime NOT NULL,
  `report_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `physical_report_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`visit_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `t_health_visit_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '就诊记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_health_visit
-- ----------------------------
INSERT INTO `t_health_visit` VALUES (1, 3, '北京大学人民医院', '', '', '2026-06-03 09:22:05', NULL, NULL, NULL);
INSERT INTO `t_health_visit` VALUES (5, 1, '白云第一人民医院', '内科', '没事', '2026-06-03 00:00:00', NULL, NULL, '');

-- ----------------------------
-- Table structure for t_operate_log
-- ----------------------------
DROP TABLE IF EXISTS `t_operate_log`;
CREATE TABLE `t_operate_log`  (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `operate_user_id` bigint NOT NULL,
  `operate_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `operate_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `operate_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`) USING BTREE,
  INDEX `operate_user_id`(`operate_user_id` ASC) USING BTREE,
  CONSTRAINT `t_operate_log_ibfk_1` FOREIGN KEY (`operate_user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统操作日志表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
