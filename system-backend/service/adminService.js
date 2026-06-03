// service/adminService.js — 后台管理业务逻辑
const userDao = require('../dao/userDao');
const consultDao = require('../dao/consultDao');
const familyDao = require('../dao/familyDao');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');

const adminService = {
  /**
   * 获取用户列表（分页 + 搜索 + 筛选）
   */
  async getUserList({ page = 1, pageSize = 10, keyword, roleId, status } = {}) {
    const conditions = {};
    if (roleId) conditions.role_id = roleId;
    if (status !== undefined && status !== '') conditions.status = status;

    const options = { page, pageSize, orderBy: 'register_time DESC' };
    if (keyword) options.likeConditions = { real_name: keyword, username: keyword }; // baseDao只支持单字段，这里用自定义

    if (keyword) {
      const offset = (page - 1) * pageSize;
      let sql = `SELECT user_id, username, real_name, role_id, status, register_time, last_login_time FROM t_user WHERE 1=1`;
      const params = [];
      if (keyword) { sql += ` AND (real_name LIKE ? OR username LIKE ?)`; params.push(`%${keyword}%`, `%${keyword}%`); }
      if (roleId) { sql += ` AND role_id = ?`; params.push(roleId); }
      if (status !== undefined && status !== '') { sql += ` AND status = ?`; params.push(status); }

      const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
      sql += ` ORDER BY register_time DESC LIMIT ${pageSize} OFFSET ${offset}`;

      const [rows] = await require('../config/db').execute(sql, params);
      const [countRows] = await require('../config/db').execute(countSql, params);
      return { list: rows, total: countRows[0].total, page, pageSize };
    }

    return userDao.findWithPage(conditions, options);
  },

  /**
   * 获取用户详情（含统计）
   */
  async getUserDetail(userId) {
    const user = await userDao.findById(userId);
    if (!user) throw new AppError('USER_NOT_EXIST');

    // 统计家庭成员数
    const familyCount = await familyDao.count({ main_user_id: userId });

    // 统计问诊次数
    const consultCount = await consultDao.count({ user_id: userId });

    // 统计体征数据
    const healthDao = require('../dao/healthDao');
    const signCount = await require('../dao/baseDao').prototype.count.call(
      { table: 't_health_sign', pk: 'sign_id', hasIsDelete: false, _buildWhere: require('../dao/baseDao').prototype._buildWhere },
      { user_id: userId }
    );

    return {
      userId: user.user_id,
      username: user.username,
      realName: user.real_name,
      idCard: user.id_card,
      roleId: user.role_id,
      status: user.status,
      registerTime: user.register_time,
      lastLoginTime: user.last_login_time,
      lastLoginIp: user.login_ip,
      stats: {
        familyCount,
        consultCount,
        signCount: 0
      }
    };
  },

  /**
   * 更新用户状态（冻结/解冻）
   */
  async updateUserStatus(operatorId, targetUserId, status) {
    if (![0, 1].includes(status)) {
      throw new AppError('BAD_REQUEST', '状态值非法（0-冻结，1-正常）');
    }

    const user = await userDao.findById(targetUserId);
    if (!user) throw new AppError('USER_NOT_EXIST');

    // 不能冻结自己
    if (operatorId === targetUserId) {
      throw new AppError('BAD_REQUEST', '不可操作自己的账号');
    }

    // 不能冻结管理员
    if (user.role_id === 3 && status === 0) {
      throw new AppError('FORBIDDEN', '不可冻结管理员账号');
    }

    await userDao.updateById(targetUserId, { status });
    return { userId: targetUserId, status, statusDesc: status === 1 ? '正常' : '冻结' };
  },

  /**
   * 修改用户角色
   */
  async updateUserRole(operatorId, targetUserId, roleId) {
    if (![1, 2, 3].includes(roleId)) {
      throw new AppError('BAD_REQUEST', '角色值非法（1-普通用户，2-家人用户，3-管理员）');
    }

    const user = await userDao.findById(targetUserId);
    if (!user) throw new AppError('USER_NOT_EXIST');

    // 不能降级自己
    if (operatorId === targetUserId) {
      throw new AppError('BAD_REQUEST', '不可修改自己的角色');
    }

    await userDao.updateById(targetUserId, { role_id: roleId });
    const roleMap = { 1: '普通用户', 2: '家人用户', 3: '管理员' };
    return { userId: targetUserId, roleId, roleName: roleMap[roleId] };
  },

  /**
   * 重置用户密码
   */
  async resetUserPassword(operatorId, targetUserId, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('PASSWORD_WEAK');
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      throw new AppError('PASSWORD_WEAK');
    }

    const user = await userDao.findById(targetUserId);
    if (!user) throw new AppError('USER_NOT_EXIST');

    // 不能重置管理员密码（除非自己是admin）
    if (user.role_id === 3) {
      const operator = await userDao.findById(operatorId);
      if (operator.role_id !== 3) {
        throw new AppError('FORBIDDEN', '无权重置管理员密码');
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userDao.updatePassword(targetUserId, hashed);
    return { userId: targetUserId, msg: '密码已重置' };
  },

  /**
   * 系统概览统计
   */
  async getStatistics() {
    const [userCount, consultCount] = await Promise.all([
      userDao.count(),
      consultDao.count()
    ]);
    return {
      userCount,
      consultCount,
      adminCount: await userDao.count({ role_id: 3 }),
      frozenCount: await userDao.count({ status: 0 })
    };
  }
};

module.exports = adminService;
