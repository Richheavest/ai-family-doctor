// service/healthService.js — 健康档案模块 业务逻辑层
const BaseDao = require('../dao/BaseDao');

// 各子模块 DAO
const basicDao = new BaseDao('t_health_basic', 'basic_id', false);
const surgeryDao = new BaseDao('t_health_surgery', 'surgery_id', true);
const diseaseDao = new BaseDao('t_health_disease', 'disease_id', true);
const allergyDao = new BaseDao('t_health_allergy', 'allergy_id', true);
const medicationDao = new BaseDao('t_health_medication', 'medication_id', true);
const signDao = new BaseDao('t_health_sign', 'sign_id', false);
const visitDao = new BaseDao('t_health_visit', 'visit_id', false);

const healthService = {
  // ==================== 基础信息 ====================
  async getBasicProfile(userId) {
    return await basicDao.findOne({ user_id: userId });
  },

  async saveBasicInfo(userId, data) {
    const existing = await basicDao.findOne({ user_id: userId });
    const formatted = {
      birth_date: data.birthDate || null,
      gender: data.gender || null,
      height: data.height || null,
      weight: data.weight || null,
      waist_circumference: data.waistCircumference || null,
      family_illness: data.familyIllness || null,
      blood_type: data.bloodType || null
    };
    if (existing) {
      await basicDao.update({ user_id: userId }, formatted);
      return existing;
    } else {
      formatted.user_id = userId;
      return await basicDao.insert(formatted);
    }
  },

  // ==================== 手术史 ====================
  async getSurgeries(userId) {
    return await surgeryDao.find({ user_id: userId });
  },

  async addSurgery(userId, data) {
    return await surgeryDao.insert({
      user_id: userId,
      surgery_name: data.surgeryName,
      surgery_time: data.surgeryTime,
      hospital: data.hospital || '',
      remark: data.remark || ''
    });
  },

  async updateSurgery(userId, surgeryId, data) {
    return await surgeryDao.update(
      { surgery_id: surgeryId, user_id: userId },
      {
        surgery_name: data.surgeryName,
        surgery_time: data.surgeryTime,
        hospital: data.hospital || '',
        remark: data.remark || ''
      }
    );
  },

  async deleteSurgery(userId, surgeryId) {
    return await surgeryDao.update(
      { surgery_id: surgeryId, user_id: userId },
      { is_delete: 1 }
    );
  },

  // ==================== 疾病史 ====================
  async getDiseases(userId) {
    return await diseaseDao.find({ user_id: userId });
  },

  async addDisease(userId, data) {
    return await diseaseDao.insert({
      user_id: userId,
      disease_name: data.diseaseName,
      diagnosis_time: data.diagnosisTime,
      hospital: data.hospital || '',
      is_cured: data.isCured ? 1 : 0,
      remark: data.remark || ''
    });
  },

  async updateDisease(userId, diseaseId, data) {
    return await diseaseDao.update(
      { disease_id: diseaseId, user_id: userId },
      {
        disease_name: data.diseaseName,
        diagnosis_time: data.diagnosisTime,
        hospital: data.hospital || '',
        is_cured: data.isCured ? 1 : 0,
        remark: data.remark || ''
      }
    );
  },

  async deleteDisease(userId, diseaseId) {
    return await diseaseDao.update(
      { disease_id: diseaseId, user_id: userId },
      { is_delete: 1 }
    );
  },

  // ==================== 过敏史 ====================
  async getAllergies(userId) {
    return await allergyDao.find({ user_id: userId });
  },

  async addAllergy(userId, data) {
    return await allergyDao.insert({
      user_id: userId,
      allergen: data.allergen,
      reaction: data.reaction || '',
      severity: data.severity || '轻',
      remark: data.remark || ''
    });
  },

  async updateAllergy(userId, allergyId, data) {
    return await allergyDao.update(
      { allergy_id: allergyId, user_id: userId },
      {
        allergen: data.allergen,
        reaction: data.reaction || '',
        severity: data.severity || '轻',
        remark: data.remark || ''
      }
    );
  },

  async deleteAllergy(userId, allergyId) {
    return await allergyDao.update(
      { allergy_id: allergyId, user_id: userId },
      { is_delete: 1 }
    );
  },

  // ==================== 用药史 ====================
  async getMedications(userId) {
    return await medicationDao.find({ user_id: userId });
  },

  async addMedication(userId, data) {
    return await medicationDao.insert({
      user_id: userId,
      medicine_name: data.medicineName,
      dosage: data.dosage || '',
      frequency: data.frequency || '',
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      is_ongoing: data.isOngoing ? 1 : 0,
      remark: data.remark || ''
    });
  },

  async updateMedication(userId, medicationId, data) {
    return await medicationDao.update(
      { medication_id: medicationId, user_id: userId },
      {
        medicine_name: data.medicineName,
        dosage: data.dosage || '',
        frequency: data.frequency || '',
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        is_ongoing: data.isOngoing ? 1 : 0,
        remark: data.remark || ''
      }
    );
  },

  async deleteMedication(userId, medicationId) {
    return await medicationDao.update(
      { medication_id: medicationId, user_id: userId },
      { is_delete: 1 }
    );
  },

  // ==================== 体征数据 ====================
  async addSign(userId, data) {
    const abnormal = healthService._checkSignAbnormal(data);
    return await signDao.insert({
      user_id: userId,
      blood_pressure_high: data.bloodPressureHigh || null,
      blood_pressure_low: data.bloodPressureLow || null,
      blood_sugar: data.bloodSugar || null,
      heart_rate: data.heartRate || null,
      weight: data.weight || null,
      measure_time: data.measureTime,
      measure_remark: data.measureRemark || '',
      is_abnormal: abnormal ? 1 : 0
    });
  },

  async getSigns(userId, query = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    return await signDao.find(
      { user_id: userId },
      { page, pageSize, orderBy: 'measure_time DESC' }
    );
  },

  async getLatestSign(userId) {
    const rows = await signDao.find(
      { user_id: userId },
      { page: 1, pageSize: 1, orderBy: 'measure_time DESC' }
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async updateSign(userId, signId, data) {
    const abnormal = healthService._checkSignAbnormal(data);
    return await signDao.update(
      { sign_id: signId, user_id: userId },
      {
        blood_pressure_high: data.bloodPressureHigh || null,
        blood_pressure_low: data.bloodPressureLow || null,
        blood_sugar: data.bloodSugar || null,
        heart_rate: data.heartRate || null,
        weight: data.weight || null,
        measure_time: data.measureTime,
        measure_remark: data.measureRemark || '',
        is_abnormal: abnormal ? 1 : 0
      }
    );
  },

  async deleteSign(userId, signId) {
    const sql = 'DELETE FROM t_health_sign WHERE sign_id = ? AND user_id = ?';
    const result = await signDao.query(sql, [signId, userId]);
    return result ? result.affectedRows : 0;
  },

  /**
   * 判断体征是否异常（简单阈值判断）
   */
  _checkSignAbnormal(data) {
    const bpHigh = data.bloodPressureHigh;
    const bpLow = data.bloodPressureLow;
    const sugar = data.bloodSugar;
    const hr = data.heartRate;
    if (bpHigh && (bpHigh > 140 || bpHigh < 90)) return true;
    if (bpLow && (bpLow > 90 || bpLow < 60)) return true;
    if (sugar && (sugar > 7.0 || sugar < 3.9)) return true;
    if (hr && (hr > 100 || hr < 60)) return true;
    return false;
  },

  // ==================== 就诊记录 ====================
  async addVisit(userId, data) {
    return await visitDao.insert({
      user_id: userId,
      hospital_name: data.hospitalName,
      department: data.department,
      diagnosis_result: data.diagnosisResult,
      visit_time: data.visitTime,
      remark: data.remark || ''
    });
  },

  async getVisits(userId, query = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    return await visitDao.find(
      { user_id: userId },
      { page, pageSize, orderBy: 'visit_time DESC' }
    );
  },

  async updateVisit(userId, visitId, data) {
    return await visitDao.update(
      { visit_id: visitId, user_id: userId },
      {
        hospital_name: data.hospitalName,
        department: data.department,
        diagnosis_result: data.diagnosisResult,
        visit_time: data.visitTime,
        remark: data.remark || ''
      }
    );
  },

  async deleteVisit(userId, visitId) {
    const sql = 'DELETE FROM t_health_visit WHERE visit_id = ? AND user_id = ?';
    const result = await visitDao.query(sql, [visitId, userId]);
    return result ? result.affectedRows : 0;
  },

  // ==================== 健康档案摘要（供AI问诊使用） ====================

  /**
   * 获取用户健康档案摘要（合并所有健康数据，用于AI问诊上下文）
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} 格式化的健康档案摘要文本
   */
  async getHealthProfileSummary(userId) {
    const parts = [];

    // 1. 基础信息
    const basic = await basicDao.findOne({ user_id: userId });
    if (basic) {
      const info = [];
      if (basic.birth_date) info.push(`出生日期：${basic.birth_date}`);
      if (basic.gender) info.push(`性别：${basic.gender}`);
      if (basic.height) info.push(`身高：${basic.height}cm`);
      if (basic.weight) info.push(`体重：${basic.weight}kg`);
      if (basic.waist_circumference) info.push(`腰围：${basic.waist_circumference}cm`);
      if (basic.blood_type) info.push(`血型：${basic.blood_type}`);
      if (basic.family_illness) info.push(`家族病史：${basic.family_illness}`);
      if (info.length > 0) parts.push(`【基础信息】\n${info.join('，')}`);
    }

    // 2. 疾病史
    const diseases = await diseaseDao.find({ user_id: userId });
    if (diseases && diseases.length > 0) {
      const list = diseases.map(d =>
        `${d.disease_name}${d.is_cured ? '（已治愈）' : '（未治愈）'}${d.diagnosis_time ? `，诊断时间：${d.diagnosis_time}` : ''}`
      );
      parts.push(`【疾病史】\n${list.join('；')}`);
    }

    // 3. 手术史
    const surgeries = await surgeryDao.find({ user_id: userId });
    if (surgeries && surgeries.length > 0) {
      const list = surgeries.map(s =>
        `${s.surgery_name}${s.surgery_time ? `，手术时间：${s.surgery_time}` : ''}`
      );
      parts.push(`【手术史】\n${list.join('；')}`);
    }

    // 4. 过敏史
    const allergies = await allergyDao.find({ user_id: userId });
    if (allergies && allergies.length > 0) {
      const list = allergies.map(a =>
        `${a.allergen}${a.reaction ? `（反应：${a.reaction}）` : ''}${a.severity ? `，严重程度：${a.severity}` : ''}`
      );
      parts.push(`【过敏史】\n${list.join('；')}`);
    }

    // 5. 用药史
    const medications = await medicationDao.find({ user_id: userId });
    if (medications && medications.length > 0) {
      const list = medications.map(m =>
        `${m.medicine_name}${m.dosage ? `，剂量：${m.dosage}` : ''}${m.frequency ? `，频次：${m.frequency}` : ''}${m.is_ongoing ? '（持续用药中）' : ''}`
      );
      parts.push(`【用药史】\n${list.join('；')}`);
    }

    // 6. 近期体征（最近一次）
    const latestSign = await healthService.getLatestSign(userId);
    if (latestSign) {
      const signItems = [];
      if (latestSign.blood_pressure_high) signItems.push(`收缩压：${latestSign.blood_pressure_high}mmHg`);
      if (latestSign.blood_pressure_low) signItems.push(`舒张压：${latestSign.blood_pressure_low}mmHg`);
      if (latestSign.blood_sugar) signItems.push(`血糖：${latestSign.blood_sugar}mmol/L`);
      if (latestSign.heart_rate) signItems.push(`心率：${latestSign.heart_rate}次/分`);
      if (latestSign.weight) signItems.push(`体重：${latestSign.weight}kg`);
      if (signItems.length > 0) parts.push(`【近期体征】\n${signItems.join('，')}${latestSign.measure_time ? `（测量时间：${latestSign.measure_time}）` : ''}`);
    }

    if (parts.length === 0) return '';

    return parts.join('\n\n');
  }
};

module.exports = healthService;
