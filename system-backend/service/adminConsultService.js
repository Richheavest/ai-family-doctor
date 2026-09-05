// service/adminConsultService.js — 管理员问诊管理业务逻辑
const consultDao = require('../dao/consultDao');
const userDao = require('../dao/userDao');
const pool = require('../config/db');
const AppError = require('../utils/appError');

const adminConsultService = {
  /**
   * 获取问诊列表（全量，管理员视角，分页+筛选+多表JOIN）
   * @param {Object} params
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页条数
   * @param {string} params.keyword - 症状关键词模糊搜索
   * @param {number} params.consultStatus - 状态筛选 0进行中/1已完成
   * @param {number} params.userId - 发起用户ID筛选
   * @param {string} params.startDate - 开始日期 YYYY-MM-DD
   * @param {string} params.endDate - 结束日期 YYYY-MM-DD
   * @returns {{ list, total, page, pageSize }}
   */
  async getConsultList({ page = 1, pageSize = 10, keyword, consultStatus, userId, userKeyword, startDate, endDate } = {}) {
    const offset = (page - 1) * pageSize;

    // 构建JOIN查询：问诊记录 + 发起用户 + 就诊人
    let sql = `
      SELECT
        cr.consult_id,
        cr.user_id,
        cr.patient_id,
        cr.symptom,
        cr.consult_status,
        cr.start_time,
        cr.end_time,
        u.username AS user_username,
        u.real_name AS user_real_name,
        p.username AS patient_username,
        p.real_name AS patient_real_name
      FROM t_consult_record cr
      JOIN t_user u ON cr.user_id = u.user_id
      JOIN t_user p ON cr.patient_id = p.user_id
      WHERE cr.is_delete = 0
    `;
    const params = [];

    // 动态筛选
    if (keyword) {
      sql += ' AND cr.symptom LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (consultStatus !== undefined && consultStatus !== null && consultStatus !== '') {
      sql += ' AND cr.consult_status = ?';
      params.push(Number(consultStatus));
    }
    if (userId && !isNaN(Number(userId))) {
      sql += ' AND cr.user_id = ?';
      params.push(Number(userId));
    }
    if (userKeyword) {
      sql += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR p.username LIKE ? OR p.real_name LIKE ?)';
      params.push(`%${userKeyword}%`, `%${userKeyword}%`, `%${userKeyword}%`, `%${userKeyword}%`);
    }
    if (startDate) {
      sql += ' AND cr.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND cr.start_time <= ?';
      params.push(endDate + ' 23:59:59');
    }

    // COUNT 查询
    const countSql = sql.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) AS total FROM'
    );

    // 分页 + 排序
    sql += ` ORDER BY cr.start_time DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute(sql, params);
    const [countRows] = await pool.execute(countSql, params);

    return {
      list: rows,
      total: countRows[0].total,
      page,
      pageSize
    };
  },

  /**
   * 获取单个问诊详情（管理员视角，含用户信息+对话记录）
   * @param {number} consultId
   * @returns {Object} 完整问诊详情
   */
  async getConsultDetail(consultId) {
    const record = await consultDao.getRecordById(consultId);
    if (!record) {
      throw new AppError('CONSULT_NOT_FOUND');
    }

    const [dialogs, user, patient] = await Promise.all([
      consultDao.getDialogsByConsult(consultId),
      userDao.findById(record.user_id),
      userDao.findById(record.patient_id)
    ]);

    return {
      consultId: record.consult_id,
      userId: record.user_id,
      patientId: record.patient_id,
      symptom: record.symptom,
      consultStatus: record.consult_status,
      illnessAnalysis: record.illness_analysis || '',
      medicalPriority: record.medical_priority,
      recommendDepartment: record.recommend_department || '',
      nursingAdvice: record.nursing_advice || '',
      startTime: record.start_time,
      endTime: record.end_time,
      user: {
        userId: user?.user_id,
        username: user?.username || '',
        realName: user?.real_name || ''
      },
      patient: {
        userId: patient?.user_id,
        username: patient?.username || '',
        realName: patient?.real_name || ''
      },
      dialogList: (dialogs || []).map(d => ({
        dialogId: d.dialog_id,
        consultId: d.consult_id,
        speaker: d.speaker,
        dialogContent: d.dialog_content,
        speakTime: d.speak_time
      }))
    };
  },

  /**
   * 删除问诊记录（管理员强制逻辑删除）
   * @param {number} consultId
   */
  async deleteConsult(consultId) {
    const record = await consultDao.getRecordById(consultId);
    if (!record) {
      throw new AppError('CONSULT_NOT_FOUND');
    }
    await consultDao.softDeleteRecord(consultId);
    return { consultId, msg: '问诊记录已删除' };
  }
};

module.exports = adminConsultService;
