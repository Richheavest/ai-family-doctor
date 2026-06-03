// dao/healthDao.js — 健康档案模块 3张表 数据访问层
// t_health_basic（基础健康档案）— 无 is_delete，user_id UNIQUE
// t_health_sign（体征数据）— 无 is_delete
// t_health_visit（就诊记录）— 无 is_delete
const BaseDao = require('./baseDao');
const pool = require('../config/db');

// ==================== t_health_basic ====================
const basicDao = new BaseDao('t_health_basic', 'basic_id', false);

const BASIC_FIELDS = ['basic_id', 'user_id', 'past_illness', 'surgery_history',
  'allergy_history', 'family_illness', 'blood_type', 'past_medicine',
  'update_time', 'sync_ai'];

/**
 * 按用户ID查基础健康档案（一个用户只有一条）
 * @param {number} userId
 */
async function getBasicByUserId(userId) {
  return basicDao.findOne({ user_id: userId });
}

/**
 * 创建或更新基础健康档案（upsert逻辑：无则插入，有则更新）
 * @param {number} userId
 * @param {Object} data
 */
async function saveBasic(userId, data) {
  const existing = await getBasicByUserId(userId);
  if (existing) {
    return basicDao.update({ user_id: userId }, data);
  }
  return basicDao.insert({ user_id: userId, ...data });
}

/**
 * 按血型查询用户
 */
async function findByBloodType(bloodType, options = {}) {
  return basicDao.findWithPage({ blood_type: bloodType }, options);
}

/**
 * 查询开启了AI同步的用户档案
 */
async function findSyncedToAI() {
  return basicDao.find({ sync_ai: 1 });
}

// ==================== t_health_sign ====================
const signDao = new BaseDao('t_health_sign', 'sign_id', false);

const SIGN_FIELDS = ['sign_id', 'user_id', 'blood_pressure_high', 'blood_pressure_low',
  'blood_sugar', 'weight', 'heart_rate', 'measure_time', 'measure_remark', 'is_abnormal'];

/**
 * 新增体征数据
 * @param {number} userId
 * @param {Object} data - {blood_pressure_high, blood_pressure_low, blood_sugar, weight, heart_rate, measure_remark}
 */
async function addSign(userId, data) {
  return signDao.insert({ user_id: userId, ...data });
}

/**
 * 按用户ID查询体征数据（支持时间范围、分页）
 * @param {number} userId
 * @param {Object} options - {page, pageSize, startTime, endTime, signType}
 */
async function getSignsByUser(userId, options = {}) {
  const rangeConditions = {};
  if (options.startTime) {
    rangeConditions.measure_time = { ...rangeConditions.measure_time, min: options.startTime };
  }
  if (options.endTime) {
    rangeConditions.measure_time = { ...rangeConditions.measure_time, max: options.endTime };
  }
  return signDao.findWithPage({ user_id: userId }, {
    rangeConditions: Object.keys(rangeConditions).length ? rangeConditions : undefined,
    orderBy: 'measure_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 30
  });
}

/**
 * 获取用户最近一条体征数据
 */
async function getLatestSign(userId) {
  const [rows] = await signDao.query(
    `SELECT * FROM t_health_sign WHERE user_id = ? ORDER BY measure_time DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * 查询异常体征数据
 * @param {number} userId - 可选，不传则查全部
 */
async function getAbnormalSigns(userId = null, options = {}) {
  const conditions = { is_abnormal: 1 };
  if (userId) conditions.user_id = userId;
  return signDao.findWithPage(conditions, {
    orderBy: 'measure_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

// ==================== t_health_visit ====================
const visitDao = new BaseDao('t_health_visit', 'visit_id', false);

const VISIT_FIELDS = ['visit_id', 'user_id', 'hospital_name', 'department',
  'diagnosis_result', 'visit_time', 'report_path', 'physical_report_path', 'remark'];

/**
 * 新增就诊记录
 * @param {number} userId
 * @param {Object} data - {hospital_name, department, diagnosis_result, visit_time, report_path?, physical_report_path?, remark?}
 */
async function addVisit(userId, data) {
  return visitDao.insert({ user_id: userId, ...data });
}

/**
 * 按用户ID查询就诊记录
 * @param {number} userId
 * @param {Object} options - {page, pageSize, hospitalName, department, startTime, endTime}
 */
async function getVisitsByUser(userId, options = {}) {
  const conditions = { user_id: userId };
  const likeConditions = {};
  if (options.hospitalName) likeConditions.hospital_name = options.hospitalName;
  if (options.department) likeConditions.department = options.department;

  const rangeConditions = {};
  if (options.startTime || options.endTime) {
    rangeConditions.visit_time = {};
    if (options.startTime) rangeConditions.visit_time.min = options.startTime;
    if (options.endTime) rangeConditions.visit_time.max = options.endTime;
  }

  return visitDao.findWithPage(conditions, {
    likeConditions: Object.keys(likeConditions).length ? likeConditions : undefined,
    rangeConditions: Object.keys(rangeConditions).length ? rangeConditions : undefined,
    orderBy: 'visit_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 按医院名称搜索就诊记录
 */
async function searchVisitsByHospital(hospitalName, options = {}) {
  return visitDao.findWithPage({}, {
    likeConditions: { hospital_name: hospitalName },
    orderBy: 'visit_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

module.exports = {
  // 基础健康档案
  getBasicByUserId,
  saveBasic,
  findByBloodType,
  findSyncedToAI,
  basicFindById: basicDao.findById.bind(basicDao),
  basicUpdateById: basicDao.updateById.bind(basicDao),
  // 体征数据
  addSign,
  getSignsByUser,
  getLatestSign,
  getAbnormalSigns,
  signFindById: signDao.findById.bind(signDao),
  signUpdateById: signDao.updateById.bind(signDao),
  signDeleteById: signDao.deleteById.bind(signDao),
  // 就诊记录
  addVisit,
  getVisitsByUser,
  searchVisitsByHospital,
  visitFindById: visitDao.findById.bind(visitDao),
  visitUpdateById: visitDao.updateById.bind(visitDao),
  visitDeleteById: visitDao.deleteById.bind(visitDao),
  // 字段常量
  BASIC_FIELDS,
  SIGN_FIELDS,
  VISIT_FIELDS
};
