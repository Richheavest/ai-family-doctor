// controller/familyController.js — 家庭成员控制器
const familyService = require('../service/familyService');
const { success, fail } = require('../utils/response');

/**
 * POST /api/family/add — 添加家庭成员
 * 入参: { familyUsername, relation, permission }
 * 出参: { relationId, familyUserId, familyUsername, familyRealName, relation, permission, permissionDesc }
 */
async function addFamilyMember(req, res) {
  try {
    const { familyUsername, relation, permission } = req.body;
    const mainUserId = req.user.userId;

    const result = await familyService.addFamilyMember(
      mainUserId, familyUsername, relation, permission
    );
    res.json(success(result, '添加家庭成员成功'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * GET /api/family/list — 获取家庭成员列表
 */
async function getFamilyList(req, res) {
  try {
    const mainUserId = req.user.userId;
    const list = await familyService.getFamilyList(mainUserId);
    res.json(success({ list }));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * PUT /api/family/update/:relationId — 修改家庭成员
 * 入参: { relation?, permission? }
 */
async function updateFamilyMember(req, res) {
  try {
    const relationId = parseInt(req.params.relationId);
    const mainUserId = req.user.userId;
    const { relation, permission } = req.body;

    await familyService.updateFamilyMember(relationId, mainUserId, relation, permission);
    res.json(success(null, '家庭成员信息修改成功'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

/**
 * DELETE /api/family/:relationId — 删除家庭成员
 */
async function deleteFamilyMember(req, res) {
  try {
    const relationId = parseInt(req.params.relationId);
    const mainUserId = req.user.userId;

    await familyService.deleteFamilyMember(relationId, mainUserId);
    res.json(success(null, '删除家庭成员成功'));

  } catch (err) {
    res.status(err.httpStatus || 400).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

module.exports = {
  addFamilyMember,
  getFamilyList,
  updateFamilyMember,
  deleteFamilyMember
};
