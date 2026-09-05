// config/db.js — MySQL 数据库连接池
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_family_doctor',
  charset: 'utf8mb4',
  timezone: '+08:00',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('[DB] MySQL 连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] MySQL 连接失败:', err.message);
  });

module.exports = pool;
