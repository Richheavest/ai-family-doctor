// controller/adminController.js — 后台管理控制器
const adminService = require('../service/adminService');
const { success, fail } = require('../utils/response');

// GET /api/admin/users — 用户列表
async function getUserList(req, res) {
  try {
    const { page, pageSize, keyword, roleId, status } = req.query;
    const result = await adminService.getUserList({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      keyword,
      roleId: roleId ? parseInt(roleId) : undefined,
      status: status !== undefined ? parseInt(status) : undefined
    });
    res.json(success(result));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// GET /api/admin/users/:id — 用户详情
async function getUserDetail(req, res) {
  try {
    const id = parseInt(req.params.id);
    const result = await adminService.getUserDetail(id);
    res.json(success(result));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// PUT /api/admin/users/:id/status — 冻结/解冻
async function updateUserStatus(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    const operatorId = req.user.userId;
    const { status } = req.body;
    const result = await adminService.updateUserStatus(operatorId, targetUserId, status);
    res.json(success(result, result.statusDesc === '冻结' ? '用户已冻结' : '用户已解冻'));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// PUT /api/admin/users/:id/role — 修改角色
async function updateUserRole(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    const operatorId = req.user.userId;
    const { roleId } = req.body;
    const result = await adminService.updateUserRole(operatorId, targetUserId, roleId);
    res.json(success(result, `角色已修改为「${result.roleName}」`));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// PUT /api/admin/users/:id/reset-pwd — 重置密码
async function resetUserPassword(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    const operatorId = req.user.userId;
    const { newPassword } = req.body;
    const result = await adminService.resetUserPassword(operatorId, targetUserId, newPassword);
    res.json(success(result, '密码已重置'));
  } catch (err) {
    res.status(err.httpStatus || 500).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// GET /api/admin/statistics — 系统概览统计
async function getStatistics(req, res) {
  try {
    const result = await adminService.getStatistics();
    res.json(success(result));
  } catch (err) {
    res.status(500).json(fail('INTERNAL_ERROR'));
  }
}

module.exports = {
  getUserList,
  getUserDetail,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  getStatistics
};
