// controller/healthController.js — 健康档案模块 控制器层
// 对请求参数进行校验、调用service、返回统一格式的响应
const healthService = require('../service/healthService');
const { success } = require('../utils/response');

const healthController = {
  // ==================== 基础信息 ====================
  async getBasicProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = await healthService.getBasicProfile(userId);
      res.json(success(data));
    } catch (err) { next(err); }
  },

  async saveBasicInfo(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.saveBasicInfo(userId, req.body);
      res.json(success(result, '基础信息保存成功'));
    } catch (err) { next(err); }
  },

  async getBasicProfileById(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await healthService.getBasicProfile(Number(userId));
      res.json(success(data));
    } catch (err) { next(err); }
  },

  // ==================== 手术史 ====================
  async getSurgeries(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getSurgeries(userId);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async addSurgery(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addSurgery(userId, req.body);
      res.json(success(result, '手术记录添加成功'));
    } catch (err) { next(err); }
  },

  async updateSurgery(req, res, next) {
    try {
      const userId = req.user.userId;
      const { surgeryId } = req.params;
      await healthService.updateSurgery(userId, Number(surgeryId), req.body);
      res.json(success(null, '手术记录修改成功'));
    } catch (err) { next(err); }
  },

  async deleteSurgery(req, res, next) {
    try {
      const userId = req.user.userId;
      const { surgeryId } = req.params;
      await healthService.deleteSurgery(userId, Number(surgeryId));
      res.json(success(null, '手术记录删除成功'));
    } catch (err) { next(err); }
  },

  // ==================== 疾病史 ====================
  async getDiseases(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getDiseases(userId);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async addDisease(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addDisease(userId, req.body);
      res.json(success(result, '疾病记录添加成功'));
    } catch (err) { next(err); }
  },

  async updateDisease(req, res, next) {
    try {
      const userId = req.user.userId;
      const { diseaseId } = req.params;
      await healthService.updateDisease(userId, Number(diseaseId), req.body);
      res.json(success(null, '疾病记录修改成功'));
    } catch (err) { next(err); }
  },

  async deleteDisease(req, res, next) {
    try {
      const userId = req.user.userId;
      const { diseaseId } = req.params;
      await healthService.deleteDisease(userId, Number(diseaseId));
      res.json(success(null, '疾病记录删除成功'));
    } catch (err) { next(err); }
  },

  // ==================== 过敏史 ====================
  async getAllergies(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getAllergies(userId);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async addAllergy(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addAllergy(userId, req.body);
      res.json(success(result, '过敏记录添加成功'));
    } catch (err) { next(err); }
  },

  async updateAllergy(req, res, next) {
    try {
      const userId = req.user.userId;
      const { allergyId } = req.params;
      await healthService.updateAllergy(userId, Number(allergyId), req.body);
      res.json(success(null, '过敏记录修改成功'));
    } catch (err) { next(err); }
  },

  async deleteAllergy(req, res, next) {
    try {
      const userId = req.user.userId;
      const { allergyId } = req.params;
      await healthService.deleteAllergy(userId, Number(allergyId));
      res.json(success(null, '过敏记录删除成功'));
    } catch (err) { next(err); }
  },

  // ==================== 用药史 ====================
  async getMedications(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getMedications(userId);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async addMedication(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addMedication(userId, req.body);
      res.json(success(result, '用药记录添加成功'));
    } catch (err) { next(err); }
  },

  async updateMedication(req, res, next) {
    try {
      const userId = req.user.userId;
      const { medicationId } = req.params;
      await healthService.updateMedication(userId, Number(medicationId), req.body);
      res.json(success(null, '用药记录修改成功'));
    } catch (err) { next(err); }
  },

  async deleteMedication(req, res, next) {
    try {
      const userId = req.user.userId;
      const { medicationId } = req.params;
      await healthService.deleteMedication(userId, Number(medicationId));
      res.json(success(null, '用药记录删除成功'));
    } catch (err) { next(err); }
  },

  // ==================== 体征数据 ====================
  async addSign(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addSign(userId, req.body);
      res.json(success(result, '体征数据记录成功'));
    } catch (err) { next(err); }
  },

  async getSignList(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getSigns(userId, req.query);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async getLatestSign(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = await healthService.getLatestSign(userId);
      res.json(success(data));
    } catch (err) { next(err); }
  },

  async updateSign(req, res, next) {
    try {
      const userId = req.user.userId;
      const { signId } = req.params;
      await healthService.updateSign(userId, Number(signId), req.body);
      res.json(success(null, '体征数据修改成功'));
    } catch (err) { next(err); }
  },

  async deleteSign(req, res, next) {
    try {
      const userId = req.user.userId;
      const { signId } = req.params;
      await healthService.deleteSign(userId, Number(signId));
      res.json(success(null, '体征数据删除成功'));
    } catch (err) { next(err); }
  },

  // ==================== 就诊记录 ====================
  async addVisit(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await healthService.addVisit(userId, req.body);
      res.json(success(result, '就诊记录添加成功'));
    } catch (err) { next(err); }
  },

  async getVisitList(req, res, next) {
    try {
      const userId = req.user.userId;
      const list = await healthService.getVisits(userId, req.query);
      res.json(success({ list }));
    } catch (err) { next(err); }
  },

  async updateVisit(req, res, next) {
    try {
      const userId = req.user.userId;
      const { visitId } = req.params;
      await healthService.updateVisit(userId, Number(visitId), req.body);
      res.json(success(null, '就诊记录修改成功'));
    } catch (err) { next(err); }
  },

  async deleteVisit(req, res, next) {
    try {
      const userId = req.user.userId;
      const { visitId } = req.params;
      await healthService.deleteVisit(userId, Number(visitId));
      res.json(success(null, '就诊记录删除成功'));
    } catch (err) { next(err); }
  }
};

module.exports = healthController;