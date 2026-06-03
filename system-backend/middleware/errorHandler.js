// middleware/errorHandler.js — 全局异常捕获中间件
const { fail } = require('../utils/response');

/**
 * 全局异常处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  // Joi/express-validator 参数校验错误
  if (err.type === 'validation') {
    return res.status(400).json(fail('BAD_REQUEST', err.message));
  }

  // 已知业务异常（带有code的AppError）
  if (err.isAppError) {
    return res.status(err.httpStatus || 400).json({
      code: err.code || 400,
      msg: err.message,
      data: null
    });
  }

  // 未知服务器错误
  res.status(500).json(fail('INTERNAL_ERROR'));
}

/**
 * 404处理中间件
 */
function notFoundHandler(req, res) {
  res.status(404).json(fail('NOT_FOUND'));
}

module.exports = { errorHandler, notFoundHandler };
