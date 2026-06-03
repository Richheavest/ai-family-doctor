// utils/response.js — 统一API响应格式
const ERROR_CODES = require('../config/errorCode');

/**
 * 成功响应
 */
function success(data = null, msg = '操作成功') {
  return {
    code: 200,
    msg,
    data
  };
}

/**
 * 失败响应（根据ERROR_CODES中的预设）
 */
function fail(errorKey, customMsg = null) {
  const err = ERROR_CODES[errorKey] || ERROR_CODES.INTERNAL_ERROR;
  return {
    code: err.code,
    msg: customMsg || err.msg,
    data: null
  };
}

/**
 * 自定义失败响应
 */
function failCustom(code, msg) {
  return {
    code,
    msg,
    data: null
  };
}

module.exports = { success, fail, failCustom };
