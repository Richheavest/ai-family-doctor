// dao/roleDao.js — 角色表 + 权限表 数据访问层
// t_role（无 is_delete）、t_permission（无 is_delete）
const BaseDao = require('./baseDao');

const roleDao = new BaseDao('t_role', 'role_id', false);
const permissionDao = new BaseDao('t_permission', 'perm_id', false);

// ==================== t_role ====================

/**
 * 按角色名称查询
 * @param {string} roleName
 */
async function getRoleByName(roleName) {
  return roleDao.findOne({ role_name: roleName });
}

/**
 * 获取全部角色列表
 */
async function getAllRoles() {
  return roleDao.findAll({ orderBy: 'role_id ASC' });
}

// ==================== t_permission ====================

/**
 * 按角色ID查询该角色拥有的全部权限
 * @param {number} roleId
 */
async function getPermissionsByRole(roleId) {
  return permissionDao.find({ role_id: roleId });
}

/**
 * 按权限标识符查询（鉴权用）
 * @param {string} permKey
 */
async function findByPermKey(permKey) {
  return permissionDao.findOne({ perm_key: permKey });
}

/**
 * 检查某角色是否拥有某权限
 * @param {number} roleId
 * @param {string} permKey
 * @returns {Promise<boolean>}
 */
async function hasPermission(roleId, permKey) {
  const perm = await permissionDao.findOne({ role_id: roleId, perm_key: permKey });
  return !!perm;
}

/**
 * 为角色分配权限
 * @param {number} roleId
 * @param {Object} permData - {perm_name, perm_key}
 */
async function assignPermission(roleId, permData) {
  return permissionDao.insert({ ...permData, role_id: roleId });
}

/**
 * 移除权限
 * @param {number} permId
 */
async function removePermission(permId) {
  return permissionDao.deleteById(permId);
}

module.exports = {
  // 角色
  getRoleById: roleDao.findById.bind(roleDao),
  getRoleByName,
  getAllRoles,
  // 权限
  getPermissionsByRole,
  findByPermKey,
  hasPermission,
  assignPermission,
  removePermission,
  permissionFindById: permissionDao.findById.bind(permissionDao)
};
