// utils/jwtHelper.js — JWT工具函数
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'ai_family_doctor_jwt_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * 生成JWT令牌
 * @param {Object} payload - {userId, roleId, username}
 */
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * 验证JWT令牌
 * @param {string} token
 * @returns {Object|null} 解析后的payload或null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
