/**
 * 初始化缺失的健康档案相关表
 * 运行方式：node init_missing_tables.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'ai_family_doctor',
    charset: 'utf8mb4'
  });

  console.log('[OK] 已连接数据库');

  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

  const tables = [
    {
      name: 't_health_basic',
      sql: `CREATE TABLE IF NOT EXISTS t_health_basic (
        basic_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL COMMENT '关联用户',
        birth_date date DEFAULT NULL,
        gender varchar(4) DEFAULT NULL,
        height decimal(5,1) DEFAULT NULL,
        weight decimal(5,1) DEFAULT NULL,
        chest_circumference decimal(5,1) DEFAULT NULL,
        past_illness text COMMENT '既往病史',
        surgery_history text COMMENT '手术史',
        allergy_history text COMMENT '过敏史',
        family_illness text COMMENT '家族病史',
        blood_type varchar(10) DEFAULT NULL,
        past_medicine text COMMENT '既往用药',
        update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        sync_ai tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (basic_id),
        UNIQUE KEY user_id (user_id),
        CONSTRAINT t_health_basic_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基础健康档案表'`,
      data: [
        [1, 1, '2005-05-02', '男', 170.0, 48.0, null, '过敏性鼻炎', '无', '无', '无', 'O', null, '2026-06-05 16:03:12', 1],
        [2, 2, null, null, null, null, null, '轻度脂肪肝', '2020年阑尾炎手术', '青霉素', '无', 'B型', null, '2026-06-03 09:22:05', 1],
        [3, 3, null, null, null, null, null, '高血压10年', '胆囊切除术', '无', '高血压家族史', 'O型', null, '2026-06-03 09:22:05', 1]
      ]
    },
    {
      name: 't_health_surgery',
      sql: `CREATE TABLE IF NOT EXISTS t_health_surgery (
        surgery_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        surgery_name varchar(200) NOT NULL,
        surgery_time datetime NOT NULL,
        hospital varchar(200) DEFAULT '',
        remark varchar(500) DEFAULT '',
        create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_delete tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (surgery_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_surgery_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='手术史表'`,
      data: [
        [1, 1, '阑尾切除术', '2010-06-16 00:00:00', '', '', '2026-06-05 16:03:55', 0],
        [2, 1, '前额叶切除', '2025-07-01 00:00:00', '', '', '2026-06-05 16:07:20', 0]
      ]
    },
    {
      name: 't_health_disease',
      sql: `CREATE TABLE IF NOT EXISTS t_health_disease (
        disease_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        disease_name varchar(200) NOT NULL,
        diagnosis_time datetime NOT NULL,
        hospital varchar(200) DEFAULT '',
        remark varchar(500) DEFAULT '',
        is_cured tinyint NOT NULL DEFAULT 0,
        create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_delete tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (disease_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_disease_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='疾病史表'`,
      data: [
        [1, 1, '急性阑尾炎', '2010-06-17 00:00:00', '江高镇卫生院', '', 1, '2026-06-05 16:18:48', 0]
      ]
    },
    {
      name: 't_health_allergy',
      sql: `CREATE TABLE IF NOT EXISTS t_health_allergy (
        allergy_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        allergen varchar(200) NOT NULL,
        reaction varchar(500) DEFAULT '',
        severity varchar(10) DEFAULT '轻',
        remark varchar(500) DEFAULT '',
        create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_delete tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (allergy_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_allergy_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='过敏史表'`,
      data: [
        [1, 1, '青霉素', '皮疹', '轻', '', '2026-06-05 16:18:00', 0]
      ]
    },
    {
      name: 't_health_medication',
      sql: `CREATE TABLE IF NOT EXISTS t_health_medication (
        medication_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        medicine_name varchar(200) NOT NULL,
        dosage varchar(100) DEFAULT '',
        frequency varchar(100) DEFAULT '',
        start_time date DEFAULT NULL,
        end_time date DEFAULT NULL,
        remark varchar(500) DEFAULT '',
        is_ongoing tinyint NOT NULL DEFAULT 0,
        create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_delete tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (medication_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_medication_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='既往用药史表'`,
      data: [
        [1, 1, '布洛芬', '', '', null, null, '', 0, '2026-06-05 16:19:14', 1],
        [2, 1, '布洛芬', '', '', null, null, '', 1, '2026-06-05 16:33:10', 0]
      ]
    },
    {
      name: 't_health_sign',
      sql: `CREATE TABLE IF NOT EXISTS t_health_sign (
        sign_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        blood_pressure_high int DEFAULT NULL,
        blood_pressure_low int DEFAULT NULL,
        blood_sugar decimal(5,2) DEFAULT NULL,
        weight decimal(5,1) DEFAULT NULL,
        heart_rate int DEFAULT NULL,
        measure_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        measure_remark varchar(200) DEFAULT NULL,
        is_abnormal tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (sign_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_sign_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体征数据表'`,
      data: [
        [1, 1, 118, 76, 5.20, 68.5, 72, '2026-06-03 09:22:05', '早上空腹', 0],
        [2, 3, 145, 95, 6.10, 75.0, 80, '2026-06-03 09:22:05', '服药后', 0],
        [3, 1, 100, 70, 7.00, 46.0, 60, '2026-06-04 00:00:00', '', 1],
        [4, 1, 120, 30, 6.00, 79.0, 95, '2026-05-01 08:00:00', '无', 1]
      ]
    },
    {
      name: 't_health_visit',
      sql: `CREATE TABLE IF NOT EXISTS t_health_visit (
        visit_id bigint NOT NULL AUTO_INCREMENT,
        user_id bigint NOT NULL,
        hospital_name varchar(100) NOT NULL,
        department varchar(50) NOT NULL,
        diagnosis_result text NOT NULL,
        visit_time datetime NOT NULL,
        report_path varchar(255) DEFAULT NULL,
        physical_report_path varchar(255) DEFAULT NULL,
        remark varchar(200) DEFAULT NULL,
        PRIMARY KEY (visit_id),
        KEY user_id (user_id),
        CONSTRAINT t_health_visit_ibfk_1 FOREIGN KEY (user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='就诊记录表'`,
      data: [
        [1, 3, '北京大学人民医院', '心血管内科', '原发性高血压2级', '2025-01-10 09:30:00', null, null, null],
        [2, 1, '北京协和医院', '呼吸内科', '急性支气管炎', '2025-02-15 14:10:00', null, null, null],
        [3, 1, '南医三院', '骨科', '骨折', '2026-03-11 00:00:00', null, null, '']
      ]
    },
    {
      name: 't_operate_log',
      sql: `CREATE TABLE IF NOT EXISTS t_operate_log (
        log_id bigint NOT NULL AUTO_INCREMENT,
        operate_user_id bigint NOT NULL,
        operate_type varchar(30) NOT NULL,
        operate_content text NOT NULL,
        operate_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip varchar(50) DEFAULT NULL,
        PRIMARY KEY (log_id),
        KEY operate_user_id (operate_user_id),
        CONSTRAINT t_operate_log_ibfk_1 FOREIGN KEY (operate_user_id) REFERENCES t_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表'`
    }
  ];

  for (const table of tables) {
    try {
      const [rows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_NAME || 'ai_family_doctor', table.name]
      );
      const exists = rows[0].cnt > 0;

      if (!exists) {
        console.log(`[创建] ${table.name} ...`);
        await conn.execute(table.sql);
        console.log(`[OK] ${table.name} 表已创建`);
      } else {
        console.log(`[跳过] ${table.name} 表已存在`);
      }

      if (table.data && table.data.length > 0) {
        for (const row of table.data) {
          const placeholders = row.map(() => '?').join(',');
          try {
            await conn.execute(
              `INSERT IGNORE INTO ${table.name} VALUES (${placeholders})`,
              row
            );
          } catch (e) {
            console.log(`  [数据] ${table.name}: ${e.message}`);
          }
        }
        console.log(`[数据] ${table.name} 插入 ${table.data.length} 条`);
      }
    } catch (e) {
      console.error(`[失败] ${table.name}: ${e.message}`);
    }
  }

  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  await conn.end();
  console.log('\n✅ 所有缺失表已创建完成！请重启后端服务后刷新页面。');
}

main().catch(err => {
  console.error('脚本执行失败:', err.message);
  process.exit(1);
});