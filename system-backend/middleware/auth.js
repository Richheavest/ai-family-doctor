// middleware/auth.js — JWT鉴权中间件
const { verifyToken } = require('../utils/jwtHelper');
const { fail } = require('../utils/response');

/**
 * 强制鉴权中间件 — 校验token，未登录返回401
 */
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json(fail('UNAUTHORIZED'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json(fail('TOKEN_EXPIRED'));
  }

  // 将用户信息挂载到请求对象上
  req.user = {
    userId: decoded.userId,
    roleId: decoded.roleId,
    username: decoded.username
  };

  next();
}

/**
 * 可选鉴权中间件 — 有token就解析，不强制
 */
function authOptional(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        roleId: decoded.roleId,
        username: decoded.username
      };
    }
  }

  next();
}

/**
 * 管理员鉴权中间件
 */
function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.roleId !== 3) {
      return res.status(403).json(fail('FORBIDDEN'));
    }
    next();
  });
}

module.exports = { authRequired, authOptional, adminRequired };
