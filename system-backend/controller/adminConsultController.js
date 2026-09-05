// controller/adminConsultController.js — 管理员问诊管理控制器
const adminConsultService = require('../service/adminConsultService');
const { success, fail } = require('../utils/response');

/**
 * GET /api/admin/consults — 问诊列表
 */
async function getConsultList(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { keyword, consultStatus, userId, userKeyword, startDate, endDate } = req.query;

    const result = await adminConsultService.getConsultList({
      page, pageSize, keyword, consultStatus, userId, userKeyword, startDate, endDate
    });
    res.json(success(result));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/admin/consults/:id — 问诊详情
 */
async function getConsultDetail(req, res) {
  try {
    const consultId = parseInt(req.params.id);
    const result = await adminConsultService.getConsultDetail(consultId);
    res.json(success(result));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * DELETE /api/admin/consults/:id — 删除问诊记录
 */
async function deleteConsult(req, res) {
  try {
    const consultId = parseInt(req.params.id);
    const result = await adminConsultService.deleteConsult(consultId);
    res.json(success(null, result.msg));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

module.exports = { getConsultList, getConsultDetail, deleteConsult };
