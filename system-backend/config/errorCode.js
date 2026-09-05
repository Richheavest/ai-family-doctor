// config/errorCode.js — 全局统一错误码配置
// 参考详细设计说明书出错处理：400/403/404/500

const ERROR_CODES = {
  // 通用错误
  SUCCESS: { code: 200, msg: '操作成功' },
  BAD_REQUEST: { code: 400, msg: '请求参数错误' },
  UNAUTHORIZED: { code: 401, msg: '未登录或登录已过期，请重新登录' },
  FORBIDDEN: { code: 403, msg: '权限不足，无法访问该资源' },
  NOT_FOUND: { code: 404, msg: '请求的资源不存在' },
  INTERNAL_ERROR: { code: 500, msg: '服务器内部错误，请稍后重试' },

  // 用户模块 1xxx
  USER_NOT_EXIST: { code: 1001, msg: '账号不存在，请检查账号是否正确' },
  PASSWORD_ERROR: { code: 1002, msg: '密码错误，请重新输入' },
  ACCOUNT_FROZEN: { code: 1003, msg: '该账号已注销或已被冻结，无法登录' },
  ACCOUNT_EXIST: { code: 1004, msg: '该账号已被注册，请更换账号或登录' },
  USERNAME_EMPTY: { code: 1005, msg: '账号不能为空' },
  PASSWORD_WEAK: { code: 1006, msg: '密码需包含字母+数字，长度≥8位' },
  LOGIN_LOCKED: { code: 1007, msg: '连续5次登录失败，账号临时锁定15分钟' },

  // AI问诊模块 2xxx
  CONSULT_NOT_FOUND: { code: 2001, msg: '问诊记录不存在' },
  CONSULT_PARAM_ERROR: { code: 2002, msg: '症状描述不能为空，请输入症状' },
  PATIENT_NOT_EXIST: { code: 2003, msg: '就诊人不存在或已注销' },
  CONSULT_ALREADY_END: { code: 2004, msg: '该问诊已结束，无法继续对话' },
  AI_API_ERROR: { code: 2005, msg: 'AI服务繁忙，请稍后重试' },
  AI_TIMEOUT: { code: 2006, msg: '网络繁忙，请稍后再试' },

  // 家庭成员模块 3xxx
  FAMILY_ALREADY_EXIST: { code: 3001, msg: '该家庭成员已添加，无需重复操作' },
  FAMILY_NOT_EXIST: { code: 3002, msg: '该家庭成员不存在' },
  FAMILY_SELF_ADD: { code: 3003, msg: '不可添加自己为家庭成员' },
  FAMILY_ACCOUNT_NOT_EXIST: { code: 3004, msg: '该家人账号未注册，请确认后重新输入' },
  FAMILY_RELATION_ERROR: { code: 3005, msg: '请选择正确的家庭成员关系' },
  FAMILY_PERMISSION_ERROR: { code: 3006, msg: '权限参数错误，请选择正确权限（1-只读，2-可编辑）' },

  // 健康档案模块 4xxx
  HEALTH_RECORD_NOT_FOUND: { code: 4001, msg: '健康档案不存在，请先完善档案' },
  SIGN_DATA_INVALID: { code: 4002, msg: '数据不合法，请输入合理的体征数据' },

  // 挂号分诊模块 5xxx
  TRIAGE_SYMPTOM_EMPTY: { code: 5001, msg: '请输入您的症状，以便为您推荐合适的科室' },
  TRIAGE_NO_MATCH: { code: 5002, msg: '未匹配到合适的科室，建议前往综合医院普通内科或急诊科就诊' },
  TRIAGE_DEPT_NOT_FOUND: { code: 5003, msg: '未找到该科室的就诊指南，请查阅医院官网或电话咨询' },

  // 系统模块 9xxx
  TOKEN_EXPIRED: { code: 9001, msg: '登录凭证已过期，请重新登录' },
  TOKEN_INVALID: { code: 9002, msg: '登录凭证无效' },
  RATE_LIMIT: { code: 9003, msg: '请求过于频繁，请稍后重试' }
};

module.exports = ERROR_CODES;
