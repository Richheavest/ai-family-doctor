// controller/userController.js — 用户控制器
const userDao = require('../dao/userDao');
const userService = require('../service/userService');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtHelper');
const { success, fail } = require('../utils/response');

// ==================== 登录 ====================

/**
 * POST /api/user/login — 用户登录
 * 入参: { username, password }
 * 出参: { token, userId, roleId, realName }
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json(fail('BAD_REQUEST', '账号和密码不能为空'));
    }

    const user = await userDao.findByUsername(username);
    if (!user) {
      return res.status(400).json(fail('USER_NOT_EXIST'));
    }
    if (user.status === 0) {
      return res.status(403).json(fail('ACCOUNT_FROZEN'));
    }

    const pwdMatch = await bcrypt.compare(password, user.password);
    if (!pwdMatch) {
      return res.status(400).json(fail('PASSWORD_ERROR'));
    }

    const token = generateToken({
      userId: user.user_id,
      roleId: user.role_id,
      username: user.username
    });

    await userDao.updateLoginInfo(user.user_id, req.ip);

    res.json(success({
      token,
      userId: user.user_id,
      roleId: user.role_id,
      realName: user.real_name
    }, '登录成功'));

  } catch (err) {
    res.status(500).json(fail('INTERNAL_ERROR'));
  }
}

// ==================== 注册 ====================

/**
 * POST /api/user/register — 用户注册
 * 入参: { username, password, realName, idCard? }
 * 出参: { userId, username, realName }
 */
async function register(req, res) {
  try {
    const { username, password, realName, idCard } = req.body;
    const result = await userService.register(username, password, realName, idCard);
    res.json(success(result, '注册成功'));
  } catch (err) {
    const status = err.httpStatus || 400;
    res.status(status).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// ==================== 修改密码 ====================

/**
 * PUT /api/user/password — 修改密码
 * 入参: { oldPassword, newPassword }
 * Headers: Authorization: Bearer <token>
 */
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    await userService.changePassword(userId, oldPassword, newPassword);
    res.json(success(null, '密码修改成功'));
  } catch (err) {
    const status = err.httpStatus || 400;
    res.status(status).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// ==================== 修改个人信息 ====================

/**
 * PUT /api/user/profile — 修改个人信息
 * 入参: { realName?, idCard? }
 * Headers: Authorization: Bearer <token>
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const result = await userService.updateProfile(userId, req.body);
    res.json(success(result, '个人信息修改成功'));
  } catch (err) {
    const status = err.httpStatus || 400;
    res.status(status).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// ==================== 注销账号 ====================

/**
 * PUT /api/user/deactivate — 注销账号（冻结）
 * 入参: { password }
 * Headers: Authorization: Bearer <token>
 */
async function deactivateAccount(req, res) {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    await userService.deactivateAccount(userId, password);
    res.json(success(null, '账号已注销'));
  } catch (err) {
    const status = err.httpStatus || 400;
    res.status(status).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

// ==================== 获取用户信息 ====================

/**
 * GET /api/user/info — 获取当前登录用户信息
 * Headers: Authorization: Bearer <token>
 */
async function getUserInfo(req, res) {
  try {
    const userId = req.user.userId;
    const result = await userService.getUserInfo(userId);
    res.json(success(result));
  } catch (err) {
    const status = err.httpStatus || 400;
    res.status(status).json(fail(err.errorKey || 'INTERNAL_ERROR', err.message));
  }
}

module.exports = {
  login,
  register,
  changePassword,
  updateProfile,
  deactivateAccount,
  getUserInfo
};
