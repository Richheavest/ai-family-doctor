// dao/consultDao.js — 问诊记录表 + 问诊对话表 数据访问层
// t_consult_record 有 is_delete（逻辑删除）
// t_consult_dialog 无 is_delete（随问诊记录逻辑删除）
const BaseDao = require('./baseDao');
const pool = require('../config/db');

// t_consult_record 实例（有 is_delete）
const recordDao = new BaseDao('t_consult_record', 'consult_id', true);
// t_consult_dialog 实例（无 is_delete）
const dialogDao = new BaseDao('t_consult_dialog', 'dialog_id', false);

const RECORD_FIELDS = ['consult_id', 'user_id', 'patient_id', 'symptom',
  'consult_status', 'illness_analysis', 'medical_priority',
  'recommend_department', 'nursing_advice', 'start_time', 'end_time', 'is_delete'];

const DIALOG_FIELDS = ['dialog_id', 'consult_id', 'speaker', 'dialog_content', 'speak_time'];

// ==================== 问诊记录 ====================

/**
 * 创建问诊记录
 * @param {number} userId - 发起用户ID
 * @param {number} patientId - 就诊人ID
 * @param {string} symptom - 初始症状描述
 * @returns {Promise<number>} consultId
 */
async function createRecord(userId, patientId, symptom) {
  return recordDao.insert({
    user_id: userId,
    patient_id: patientId,
    symptom,
    consult_status: 0  // 0-进行中
  });
}

/**
 * 按ID查询问诊记录
 * @param {number} consultId
 */
async function getRecordById(consultId) {
  return recordDao.findById(consultId);
}

/**
 * 按用户ID查询问诊列表
 * @param {number} userId
 * @param {Object} options - {page, pageSize, consultStatus}
 */
async function getRecordsByUser(userId, options = {}) {
  const conditions = { user_id: userId };
  if (options.consultStatus !== undefined) {
    conditions.consult_status = options.consultStatus;
  }
  return recordDao.findWithPage(conditions, {
    orderBy: 'start_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 按就诊人ID查询问诊记录
 * @param {number} patientId
 */
async function getRecordsByPatient(patientId, options = {}) {
  const conditions = { patient_id: patientId };
  if (options.consultStatus !== undefined) {
    conditions.consult_status = options.consultStatus;
  }
  return recordDao.findWithPage(conditions, {
    orderBy: 'start_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 按状态查询问诊（用于后台管理）
 */
async function getRecordsByStatus(consultStatus, options = {}) {
  return recordDao.findWithPage({ consult_status: consultStatus }, {
    orderBy: 'start_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 模糊搜索问诊（按症状关键词）
 * @param {string} keyword
 */
async function searchRecords(keyword, options = {}) {
  return recordDao.findWithPage({}, {
    likeConditions: { symptom: keyword },
    orderBy: 'start_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 时间范围查询
 */
async function getRecordsByTimeRange(startTime, endTime, options = {}) {
  return recordDao.findWithPage({}, {
    rangeConditions: { start_time: { min: startTime, max: endTime } },
    orderBy: 'start_time DESC',
    page: options.page || 1,
    pageSize: options.pageSize || 20
  });
}

/**
 * 更新问诊记录
 * @param {number} consultId
 * @param {Object} data
 */
async function updateRecord(consultId, data) {
  return recordDao.updateById(consultId, data);
}

/**
 * 结束问诊（更新状态 + 分析结果）
 * @param {number} consultId
 * @param {Object} result - {illnessAnalysis, medicalPriority, recommendDepartment, nursingAdvice}
 */
async function endRecord(consultId, result) {
  return recordDao.updateById(consultId, {
    consult_status: 1,      // 已完成
    illness_analysis: result.illnessAnalysis || null,
    medical_priority: result.medicalPriority || null,
    recommend_department: result.recommendDepartment || null,
    nursing_advice: result.nursingAdvice || null,
    end_time: new Date()
  });
}

/**
 * 逻辑删除问诊记录
 * @param {number} consultId
 */
async function softDeleteRecord(consultId) {
  return recordDao.softDeleteById(consultId);
}

// ==================== 问诊对话 ====================

/**
 * 创建问诊对话记录
 * @param {number} consultId
 * @param {number} speaker - 1用户 2AI
 * @param {string} content - 对话内容
 * @returns {Promise<number>} dialogId
 */
async function addDialog(consultId, speaker, content) {
  return dialogDao.insert({
    consult_id: consultId,
    speaker,
    dialog_content: content
  });
}

/**
 * 按问诊记录ID查询所有对话（按时间升序还原对话顺序）
 * @param {number} consultId
 */
async function getDialogsByConsult(consultId) {
  return dialogDao.find({ consult_id: consultId }, {
    orderBy: 'speak_time ASC'
  });
}

/**
 * 按ID查询单条对话
 */
async function getDialogById(dialogId) {
  return dialogDao.findById(dialogId);
}

/**
 * 批量保存对话（原子性）
 * @param {Array<Object>} dialogs - [{consult_id, speaker, dialog_content}]
 */
async function addDialogsBatch(dialogs) {
  return dialogDao.insertBatch(dialogs);
}

/**
 * 删除指定问诊的所有对话（物理删除）
 */
async function deleteDialogsByConsult(consultId) {
  const db = pool;
  const [result] = await db.execute(
    `DELETE FROM t_consult_dialog WHERE consult_id = ?`,
    [consultId]
  );
  return result.affectedRows;
}

module.exports = {
  // 问诊记录
  createRecord,
  getRecordById,
  getRecordsByUser,
  getRecordsByPatient,
  getRecordsByStatus,
  searchRecords,
  getRecordsByTimeRange,
  updateRecord,
  endRecord,
  softDeleteRecord,
  find: recordDao.find.bind(recordDao),
  findWithPage: recordDao.findWithPage.bind(recordDao),
  count: recordDao.count.bind(recordDao),
  // 问诊对话
  addDialog,
  getDialogsByConsult,
  getDialogById,
  addDialogsBatch,
  deleteDialogsByConsult,
  // 字段
  RECORD_FIELDS,
  DIALOG_FIELDS
};
