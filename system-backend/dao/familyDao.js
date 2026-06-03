// dao/familyDao.js — 家庭成员关系表 t_family_relation 数据访问层
// 注意：有 is_delete 字段，支持逻辑删除；family_user_id 有 UNIQUE 约束
const BaseDao = require('./baseDao');
const pool = require('../config/db');

const familyDao = new BaseDao('t_family_relation', 'relation_id', true);

const FIELDS = ['relation_id', 'main_user_id', 'family_user_id', 'relation',
  'permission', 'create_time', 'is_delete'];

// 合法关系类型
const VALID_RELATIONS = ['父母', '子女', '配偶', '其他'];

// ========== 扩展方法 ==========

/**
 * 添加家庭成员关系
 * @param {number} mainUserId - 主用户ID
 * @param {number} familyUserId - 家人用户ID
 * @param {string} relation - 亲属关系（父母/子女/配偶/其他）
 * @param {number} permission - 1只读 2可编辑
 * @returns {Promise<number>} relationId
 */
async function addRelation(mainUserId, familyUserId, relation, permission) {
  return familyDao.insert({
    main_user_id: mainUserId,
    family_user_id: familyUserId,
    relation,
    permission: permission || 1
  });
}

/**
 * 按主用户ID查询所有家庭成员（联表查用户信息）
 * @param {number} mainUserId
 * @returns {Promise<Array>}
 */
async function getFamilyListByMainUser(mainUserId) {
  const sql = `
    SELECT fr.relation_id, fr.main_user_id, fr.family_user_id,
           fr.relation, fr.permission, fr.create_time,
           u.username, u.real_name, u.status as family_user_status
    FROM t_family_relation fr
    JOIN t_user u ON fr.family_user_id = u.user_id
    WHERE fr.main_user_id = ? AND fr.is_delete = 0
    ORDER BY fr.create_time DESC
  `;
  return familyDao.query(sql, [mainUserId]);
}

/**
 * 按家人用户ID查询归属关系（检查是否已被他人关联）
 * @param {number} familyUserId
 * @returns {Promise<Object|null>}
 */
async function findRelationByFamilyUser(familyUserId) {
  return familyDao.findOne({ family_user_id: familyUserId });
}

/**
 * 查询主用户与某家人之间是否已有关系
 * @param {number} mainUserId
 * @param {number} familyUserId
 * @returns {Promise<Object|null>}
 */
async function findRelationBetween(mainUserId, familyUserId) {
  return familyDao.findOne({
    main_user_id: mainUserId,
    family_user_id: familyUserId
  });
}

/**
 * 修改家庭成员关系
 * @param {number} relationId
 * @param {number} mainUserId - 权限校验：只能修改自己的家庭成员
 * @param {Object} data - {relation?, permission?}
 * @returns {Promise<number>}
 */
async function updateRelation(relationId, mainUserId, data) {
  const updateData = {};
  if (data.relation) updateData.relation = data.relation;
  if (data.permission !== undefined) updateData.permission = data.permission;
  if (Object.keys(updateData).length === 0) return 0;

  return familyDao.update({ relation_id: relationId, main_user_id: mainUserId }, updateData);
}

/**
 * 按ID查询家庭成员关系
 * @param {number} relationId
 */
async function getRelationById(relationId) {
  return familyDao.findById(relationId);
}

/**
 * 逻辑删除家庭成员关系
 * @param {number} relationId
 * @param {number} mainUserId - 权限校验
 * @returns {Promise<number>}
 */
async function softDeleteRelation(relationId, mainUserId) {
  return familyDao.softDelete({
    relation_id: relationId,
    main_user_id: mainUserId
  });
}

/**
 * 统计某用户的家庭成员数
 * @param {number} mainUserId
 * @returns {Promise<number>}
 */
async function countFamilyMembers(mainUserId) {
  return familyDao.count({ main_user_id: mainUserId });
}

module.exports = {
  // BaseDao 标准方法
  findById: familyDao.findById.bind(familyDao),
  findOne: familyDao.findOne.bind(familyDao),
  find: familyDao.find.bind(familyDao),
  findAll: familyDao.findAll.bind(familyDao),
  findWithPage: familyDao.findWithPage.bind(familyDao),
  count: familyDao.count.bind(familyDao),
  insert: familyDao.insert.bind(familyDao),
  updateById: familyDao.updateById.bind(familyDao),
  update: familyDao.update.bind(familyDao),
  deleteById: familyDao.deleteById.bind(familyDao),
  softDeleteById: familyDao.softDeleteById.bind(familyDao),
  softDelete: familyDao.softDelete.bind(familyDao),
  query: familyDao.query.bind(familyDao),
  queryOne: familyDao.queryOne.bind(familyDao),
  // 扩展方法
  addRelation,
  getFamilyListByMainUser,
  findRelationByFamilyUser,
  findRelationBetween,
  updateRelation,
  getRelationById,
  softDeleteRelation,
  countFamilyMembers,
  // 常量
  FIELDS,
  VALID_RELATIONS
};
