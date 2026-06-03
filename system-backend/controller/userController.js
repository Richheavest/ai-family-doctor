// controller/userController.js — 用户控制器
const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtHelper');
const { success, fail } = require('../utils/response');

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

    // SQL 中密码是 BCrypt 加密的（统一测试密码均为 123456 的加密值）
    // 开发阶段兼容明文对比
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

module.exports = { login };
