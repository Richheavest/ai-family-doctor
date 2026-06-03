// dao/userDao.js — 用户表 t_user 数据访问层
// 注意：t_user 无 is_delete 字段，使用 status 管理状态（1-正常，0-冻结）
const BaseDao = require('./baseDao');

const userDao = new BaseDao('t_user', 'user_id', false);

// ========== 表字段常量 ==========
const FIELDS = ['user_id', 'username', 'password', 'real_name', 'id_card',
  'role_id', 'status', 'register_time', 'last_login_time', 'login_ip'];

// ========== 扩展方法 ==========

/**
 * 按用户名查询（精确匹配）
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function findByUsername(username) {
  return userDao.findOne({ username });
}

/**
 * 按身份证号查询
 * @param {string} idCard
 * @returns {Promise<Object|null>}
 */
async function findByIdCard(idCard) {
  return userDao.findOne({ id_card: idCard });
}

/**
 * 按角色查询用户列表
 * @param {number} roleId - 1普通用户 2家人用户 3管理员
 * @param {Object} options
 */
async function findByRole(roleId, options = {}) {
  return userDao.findWithPage({ role_id: roleId, status: 1 }, options);
}

/**
 * 按状态查询（status: 1-正常, 0-冻结）
 */
async function findByStatus(status, options = {}) {
  return userDao.findWithPage({ status }, options);
}

/**
 * 模糊搜索（按姓名或用户名）
 * @param {string} keyword
 * @param {Object} options
 */
async function search(keyword, options = {}) {
  const likeConditions = {};
  if (keyword) {
    // MySQL 多字段模糊搜索用 OR，这里用自定义SQL
    const sql = `SELECT * FROM t_user WHERE (real_name LIKE ? OR username LIKE ?) AND status = 1`;
    const kw = `%${keyword}%`;
    if (options.orderBy) {
      const [rows] = await require('../config/db').execute(
        sql + ` ORDER BY ${options.orderBy}`,
        [kw, kw]
      );
      return rows;
    }
    const [rows] = await require('../config/db').execute(sql, [kw, kw]);
    return rows;
  }
  return userDao.findAll(options);
}

/**
 * 创建用户
 * @param {Object} userData - {username, password, real_name, id_card?, role_id?}
 * @returns {Promise<number>} userId
 */
async function createUser(userData) {
  return userDao.insert({
    username: userData.username,
    password: userData.password,
    real_name: userData.real_name,
    id_card: userData.id_card || null,
    role_id: userData.role_id || 1,
    status: 1
  });
}

/**
 * 冻结用户账号
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function freezeUser(userId) {
  return userDao.updateById(userId, { status: 0 });
}

/**
 * 解冻用户账号
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function unfreezeUser(userId) {
  return userDao.updateById(userId, { status: 1 });
}

/**
 * 更新最后登录信息
 * @param {number} userId
 * @param {string} ip
 */
async function updateLoginInfo(userId, ip) {
  const db = require('../config/db');
  await db.execute(
    `UPDATE t_user SET last_login_time = NOW(), login_ip = ? WHERE user_id = ?`,
    [ip, userId]
  );
}

/**
 * 修改密码
 * @param {number} userId
 * @param {string} hashedPassword
 */
async function updatePassword(userId, hashedPassword) {
  return userDao.updateById(userId, { password: hashedPassword });
}

/**
 * 检查用户名是否已存在
 * @returns {Promise<boolean>}
 */
async function isUsernameExist(username, excludeUserId = null) {
  const user = await findByUsername(username);
  if (!user) return false;
  if (excludeUserId) return user.user_id !== excludeUserId;
  return true;
}

module.exports = {
  // BaseDao 标准方法透出
  findById: userDao.findById.bind(userDao),
  findOne: userDao.findOne.bind(userDao),
  find: userDao.find.bind(userDao),
  findAll: userDao.findAll.bind(userDao),
  findWithPage: userDao.findWithPage.bind(userDao),
  count: userDao.count.bind(userDao),
  insert: userDao.insert.bind(userDao),
  updateById: userDao.updateById.bind(userDao),
  update: userDao.update.bind(userDao),
  deleteById: userDao.deleteById.bind(userDao),
  query: userDao.query.bind(userDao),
  queryOne: userDao.queryOne.bind(userDao),
  // 扩展方法
  findByUsername,
  findByIdCard,
  findByRole,
  findByStatus,
  search,
  createUser,
  freezeUser,
  unfreezeUser,
  updateLoginInfo,
  updatePassword,
  isUsernameExist,
  FIELDS
};
