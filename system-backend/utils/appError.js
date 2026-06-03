// utils/appError.js — 自定义业务异常类
class AppError extends Error {
  constructor(errorKey, customMsg = '', httpStatus = 400) {
    const ERROR_CODES = require('../config/errorCode');
    const err = ERROR_CODES[errorKey] || ERROR_CODES.INTERNAL_ERROR;
    super(customMsg || err.msg);
    this.isAppError = true;
    this.code = err.code;
    this.errorKey = errorKey;
    this.httpStatus = httpStatus;
  }
}

module.exports = AppError;
