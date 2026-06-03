// dao/logDao.js — 系统操作日志表 t_operate_log 数据访问层
// 无 is_delete 字段，日志不可删除（合规要求：留存不少于6个月）
const BaseDao = require('./baseDao');

const logDao = new BaseDao('t_operate_log', 'log_id', false);

const FIELDS = ['log_id', 'operate_user_id', 'operate_type', 'operate_content',
  'operate_time', 'ip'];

/**
 * 记录操作日志
 * @param {number} userId - 操作人ID
 * @param {string} type - 操作类型，如：LOGIN/CONSULT/FAMILY_ADD/USER_FREEZE
 * @param {string} content - 操作详情
 * @param {string} ip - 操作IP（可选）
 * @returns {Promise<number>} logId
 */
async function addLog(userId, type, content, ip = null) {
  return logDao.insert({
    operate_user_id: userId,
    operate_type: type,
    operate_content: content,
    ip
  });
}

/**
 * 按操作人查询日志
 * @param {number} userId
 * @param {Object} options - {page, pageSize, operateType, startTime, endTime}
 */
async function getLogsByUser(userId, options = {}) {
  const conditions = { operate_user_id: userId };
  return logDao.findWithPage(conditions, {
    orderBy: 'operate_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 50
  });
}

/**
 * 按操作类型查询日志
 * @param {string} operateType
 * @param {Object} options
 */
async function getLogsByType(operateType, options = {}) {
  return logDao.findWithPage({ operate_type: operateType }, {
    orderBy: 'operate_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 50
  });
}

/**
 * 多条件组合查询日志（管理员审计用）
 * @param {Object} filters - {userId, operateType, startTime, endTime, keyword}
 * @param {Object} options - {page, pageSize}
 */
async function searchLogs(filters = {}, options = {}) {
  const conditions = {};
  const likeConditions = {};
  const rangeConditions = {};

  if (filters.userId) conditions.operate_user_id = filters.userId;
  if (filters.operateType) conditions.operate_type = filters.operateType;
  if (filters.keyword) likeConditions.operate_content = filters.keyword;

  if (filters.startTime || filters.endTime) {
    rangeConditions.operate_time = {};
    if (filters.startTime) rangeConditions.operate_time.min = filters.startTime;
    if (filters.endTime) rangeConditions.operate_time.max = filters.endTime;
  }

  return logDao.findWithPage(conditions, {
    likeConditions: Object.keys(likeConditions).length ? likeConditions : undefined,
    rangeConditions: Object.keys(rangeConditions).length ? rangeConditions : undefined,
    orderBy: 'operate_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 50
  });
}

/**
 * 清理过期日志（超过指定天数的日志，合规要求≥180天）
 * @param {number} days - 保留天数，默认180
 * @returns {Promise<number>}
 */
async function cleanOldLogs(days = 180) {
  const db = require('../config/db');
  const [result] = await db.execute(
    `DELETE FROM t_operate_log WHERE operate_time < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return result.affectedRows;
}

module.exports = {
  // BaseDao 标准方法
  findById: logDao.findById.bind(logDao),
  findOne: logDao.findOne.bind(logDao),
  find: logDao.find.bind(logDao),
  findAll: logDao.findAll.bind(logDao),
  findWithPage: logDao.findWithPage.bind(logDao),
  count: logDao.count.bind(logDao),
  query: logDao.query.bind(logDao),
  // 扩展方法
  addLog,
  getLogsByUser,
  getLogsByType,
  searchLogs,
  cleanOldLogs,
  FIELDS
};
