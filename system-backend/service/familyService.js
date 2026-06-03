// service/familyService.js — 家庭成员业务逻辑层
const familyDao = require('../dao/familyDao');
const userDao = require('../dao/userDao');
const AppError = require('../utils/appError');

const VALID_RELATIONS = familyDao.VALID_RELATIONS;  // ['父母', '子女', '配偶', '其他']
const VALID_PERMISSIONS = [1, 2];                     // 1-只读，2-可编辑

const familyService = {
  /**
   * 添加家庭成员
   * 严格参照设计文档 PDL 伪代码逻辑
   * @param {number} mainUserId - 主用户ID
   * @param {string} familyUsername - 家人登录账号
   * @param {string} relation - 亲属关系
   * @param {number} permission - 权限 1只读 2可编辑
   * @returns {Object} {relationId, familyUserId, familyUsername, familyRealName, relation, permission}
   */
  async addFamilyMember(mainUserId, familyUsername, relation, permission) {
    // 1. 校验参数
    if (!familyUsername) {
      throw new AppError('BAD_REQUEST', '家人账号不能为空');
    }
    if (!VALID_RELATIONS.includes(relation)) {
      throw new AppError('FAMILY_RELATION_ERROR');
    }
    if (!VALID_PERMISSIONS.includes(permission)) {
      throw new AppError('FAMILY_PERMISSION_ERROR');
    }

    // 2. 校验主用户是否存在且状态正常
    const mainUser = await userDao.findById(mainUserId);
    if (!mainUser || mainUser.status !== 1) {
      throw new AppError('BAD_REQUEST', '主用户不存在或账号已冻结，无法添加家庭成员');
    }

    // 3. 根据家人账号查询家人用户信息
    const familyUser = await userDao.findByUsername(familyUsername);
    if (!familyUser) {
      throw new AppError('FAMILY_ACCOUNT_NOT_EXIST');
    }

    // 4. 校验不可添加自己为家人
    if (mainUserId === familyUser.user_id) {
      throw new AppError('FAMILY_SELF_ADD');
    }

    // 5. 校验家人账号是否已被其他主用户关联
    const existRelation = await familyDao.findRelationByFamilyUser(familyUser.user_id);
    if (existRelation) {
      throw new AppError('FAMILY_ALREADY_EXIST');
    }

    // 6. 校验主用户未重复添加
    const existing = await familyDao.findRelationBetween(mainUserId, familyUser.user_id);
    if (existing) {
      throw new AppError('FAMILY_ALREADY_EXIST');
    }

    // 7. 添加家庭成员关系
    const relationId = await familyDao.addRelation(
      mainUserId, familyUser.user_id, relation, permission
    );

    // 8. 返回结果
    return {
      relationId,
      familyUserId: familyUser.user_id,
      familyUsername: familyUser.username,
      familyRealName: familyUser.real_name,
      relation,
      permission,
      permissionDesc: permission === 1 ? '只读' : '可编辑'
    };
  },

  /**
   * 获取家庭成员列表
   */
  async getFamilyList(mainUserId) {
    return familyDao.getFamilyListByMainUser(mainUserId);
  },

  /**
   * 修改家庭成员信息
   */
  async updateFamilyMember(relationId, mainUserId, relation, permission) {
    if (relation && !VALID_RELATIONS.includes(relation)) {
      throw new AppError('FAMILY_RELATION_ERROR');
    }
    if (permission && !VALID_PERMISSIONS.includes(permission)) {
      throw new AppError('FAMILY_PERMISSION_ERROR');
    }

    const affected = await familyDao.updateRelation(relationId, mainUserId, { relation, permission });
    if (affected === 0) throw new AppError('FAMILY_NOT_EXIST');
    return affected;
  },

  /**
   * 删除家庭成员（逻辑删除）
   */
  async deleteFamilyMember(relationId, mainUserId) {
    const affected = await familyDao.softDeleteRelation(relationId, mainUserId);
    if (affected === 0) throw new AppError('FAMILY_NOT_EXIST');
    return affected;
  }
};

module.exports = familyService;
