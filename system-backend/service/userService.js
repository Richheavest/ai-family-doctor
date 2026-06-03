// service/userService.js — 用户管理业务逻辑层
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtHelper');
const AppError = require('../utils/appError');

const userService = {
  /**
   * 用户注册
   * @param {string} username - 手机号（11位）
   * @param {string} password - 密码（字母+数字，≥8位）
   * @param {string} realName - 真实姓名
   * @param {string} idCard - 身份证号（可选，后4位脱敏存储）
   * @returns {Object} {userId, username, realName}
   */
  async register(username, password, realName, idCard = null) {
    // 1. 校验参数
    if (!username) {
      throw new AppError('BAD_REQUEST', '手机号不能为空');
    }
    if (!/^1[3-9]\d{9}$/.test(username)) {
      throw new AppError('BAD_REQUEST', '手机号格式错误（11位）');
    }
    if (!realName || !realName.trim()) {
      throw new AppError('BAD_REQUEST', '真实姓名不能为空');
    }
    if (!password || password.length < 8) {
      throw new AppError('PASSWORD_WEAK');
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      throw new AppError('PASSWORD_WEAK', '密码需包含字母+数字');
    }

    // 2. 校验账号是否已注册
    const existUser = await userDao.findByUsername(username);
    if (existUser) {
      throw new AppError('ACCOUNT_EXIST');
    }

    // 3. 身份证号脱敏（取后4位）
    let maskedIdCard = null;
    if (idCard) {
      maskedIdCard = '******' + idCard.slice(-4);
    }

    // 4. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 创建用户
    const userId = await userDao.createUser({
      username,
      password: hashedPassword,
      real_name: realName.trim(),
      id_card: maskedIdCard,
      role_id: 1  // 默认普通用户
    });

    return {
      userId,
      username,
      realName: realName.trim()
    };
  },

  /**
   * 修改密码
   * @param {number} userId
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    // 1. 校验参数
    if (!oldPassword) {
      throw new AppError('BAD_REQUEST', '旧密码不能为空');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('PASSWORD_WEAK');
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      throw new AppError('PASSWORD_WEAK', '密码需包含字母+数字');
    }
    if (oldPassword === newPassword) {
      throw new AppError('BAD_REQUEST', '新密码不能与旧密码相同');
    }

    // 2. 校验用户存在
    const user = await userDao.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_EXIST');
    }

    // 3. 校验旧密码
    const pwdMatch = await bcrypt.compare(oldPassword, user.password);
    if (!pwdMatch) {
      throw new AppError('PASSWORD_ERROR', '旧密码错误');
    }

    // 4. 加密新密码并更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userDao.updatePassword(userId, hashedPassword);

    return true;
  },

  /**
   * 修改个人信息
   * @param {number} userId
   * @param {Object} data - {realName?, idCard?}
   */
  async updateProfile(userId, data) {
    const user = await userDao.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_EXIST');
    }

    const updateData = {};
    if (data.realName !== undefined) {
      if (!data.realName || !data.realName.trim()) {
        throw new AppError('BAD_REQUEST', '真实姓名不能为空');
      }
      updateData.real_name = data.realName.trim();
    }
    if (data.idCard !== undefined) {
      updateData.id_card = '******' + data.idCard.slice(-4);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('BAD_REQUEST', '没有需要修改的内容');
    }

    await userDao.updateById(userId, updateData);

    // 返回更新后的用户信息
    const updated = await userDao.findById(userId);
    return {
      userId: updated.user_id,
      username: updated.username,
      realName: updated.real_name,
      roleId: updated.role_id,
      status: updated.status
    };
  },

  /**
   * 注销账号（冻结，status=0）
   * @param {number} userId
   * @param {string} password - 二次验证密码
   */
  async deactivateAccount(userId, password) {
    // 1. 校验密码
    if (!password) {
      throw new AppError('BAD_REQUEST', '请输入密码确认注销');
    }

    // 2. 校验用户
    const user = await userDao.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_EXIST');
    }
    if (user.status === 0) {
      throw new AppError('ACCOUNT_FROZEN');
    }

    // 3. 验证密码
    const pwdMatch = await bcrypt.compare(password, user.password);
    if (!pwdMatch) {
      throw new AppError('PASSWORD_ERROR', '密码错误，注销失败');
    }

    // 4. 冻结账号
    await userDao.freezeUser(userId);

    return true;
  },

  /**
   * 获取用户信息
   * @param {number} userId
   */
  async getUserInfo(userId) {
    const user = await userDao.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_EXIST');
    }
    return {
      userId: user.user_id,
      username: user.username,
      realName: user.real_name,
      idCard: user.id_card,
      roleId: user.role_id,
      status: user.status,
      registerTime: user.register_time,
      lastLoginTime: user.last_login_time
    };
  }
};

module.exports = userService;
