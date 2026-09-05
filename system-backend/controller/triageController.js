// controller/triageController.js — 挂号分诊指导控制器
const triageService = require('../service/triageService');
const { success, fail } = require('../utils/response');

/**
 * POST /api/triage/recommend — 症状→科室推荐
 * 入参: { symptom: string }
 * 出参: { symptom, matchedKeywords, recommendations[] }
 */
async function recommend(req, res) {
  try {
    const { symptom } = req.body;
    const result = await triageService.recommend(symptom);
    res.json(success(result, '分诊推荐完成'));
  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/triage/hospitals — 医院列表（可选筛选）
 * 入参: ?keyword&department&level
 * 出参: { list[], total }
 */
async function getHospitals(req, res) {
  try {
    const { keyword, department, level } = req.query;
    const result = triageService.getHospitals({ keyword, department, level });
    res.json(success(result));
  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/triage/guide/:dept — 科室就诊指南
 * 入参: path param dept（科室名称）
 * 出参: { department, description, commonChecks, prepTips, triageGuide }
 */
async function getDepartmentGuide(req, res) {
  try {
    const { dept } = req.params;
    const result = triageService.getDepartmentGuide(dept);
    res.json(success(result, '就诊指南查询成功'));
  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/triage/departments — 所有可推荐科室列表
 * 出参: { departments: string[] }
 */
async function getDepartments(req, res) {
  try {
    const departments = triageService.getAllDepartments();
    res.json(success({ departments }));
  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

module.exports = {
  recommend,
  getHospitals,
  getDepartmentGuide,
  getDepartments
};
