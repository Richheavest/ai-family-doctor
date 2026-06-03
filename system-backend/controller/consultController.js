// controller/consultController.js — AI问诊控制器
const consultService = require('../service/consultService');
const { success, fail } = require('../utils/response');

/**
 * POST /api/consult/start — 发起AI问诊
 * 入参: { patientId, symptom }
 * 出参: { consultId, dialogList, analysis }
 */
async function startConsult(req, res) {
  try {
    const { patientId, symptom } = req.body;
    const userId = req.user.userId;

    const result = await consultService.startConsult(userId, patientId, symptom);
    res.json(success(result, '问诊发起成功'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * POST /api/consult/sendDialog — 发送对话
 * 入参: { consultId, speaker, dialogContent }
 * 出参: { consultId, dialogList, aiReply }
 */
async function sendDialog(req, res) {
  try {
    const { consultId, speaker, dialogContent } = req.body;
    const userId = req.user.userId;

    const result = await consultService.sendDialog(consultId, userId, speaker, dialogContent);
    res.json(success(result, '对话发送成功'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * PUT /api/consult/end — 结束问诊
 * 入参: { consultId, illnessAnalysis?, medicalPriority?, recommendDepartment?, nursingAdvice? }
 * 出参: 完整问诊记录
 */
async function endConsult(req, res) {
  try {
    const {
      consultId, illnessAnalysis, medicalPriority,
      recommendDepartment, nursingAdvice
    } = req.body;
    const userId = req.user.userId;

    const result = await consultService.endConsult(consultId, userId, {
      illnessAnalysis, medicalPriority, recommendDepartment, nursingAdvice
    });
    res.json(success(result, '问诊已结束'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/consult/list — 问诊记录列表
 */
async function getConsultList(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const userId = req.user.userId;

    const list = await consultService.getConsultList(userId, page, pageSize);
    res.json(success({ list, page, pageSize }));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/consult/detail/:consultId — 问诊详情
 */
async function getConsultDetail(req, res) {
  try {
    const consultId = parseInt(req.params.consultId);
    const userId = req.user.userId;

    const result = await consultService.getConsultDetail(consultId, userId);
    res.json(success(result));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * DELETE /api/consult/:consultId — 删除问诊记录
 */
async function deleteConsult(req, res) {
  try {
    const consultId = parseInt(req.params.consultId);
    const userId = req.user.userId;

    await consultService.deleteConsult(consultId, userId);
    res.json(success(null, '问诊记录已删除'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

module.exports = {
  startConsult,
  sendDialog,
  endConsult,
  getConsultList,
  getConsultDetail,
  deleteConsult
};
