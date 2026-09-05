// service/consultService.js — AI问诊业务逻辑层
const consultDao = require('../dao/consultDao');
const userDao = require('../dao/userDao');
const healthService = require('./healthService');
const { callClaude } = require('../utils/claudeApi');
const AppError = require('../utils/appError');

const consultService = {
  /**
   * 发起AI问诊
   * 参考详细设计说明书接口表格
   * @param {number} userId - 发起用户ID
   * @param {number} patientId - 就诊人ID（本人或家人）
   * @param {string} symptom - 初始症状描述
   * @returns {Object} {consultId, dialogList, analysis}
   */
  async startConsult(userId, patientId, symptom) {
    // 1. 校验参数
    if (!symptom || !symptom.trim()) {
      throw new AppError('CONSULT_PARAM_ERROR');
    }
    if (!patientId) {
      throw new AppError('PATIENT_NOT_EXIST');
    }

    console.log('[consultService] 参数校验通过:', { userId, patientId, symptom: symptom.substring(0, 20) + '...' });

    // 2. 校验就诊人是否存在且状态正常
    const patientUser = await userDao.findById(patientId);
    if (!patientUser || patientUser.status !== 1) {
      throw new AppError('PATIENT_NOT_EXIST');
    }

    console.log('[consultService] 就诊人存在:', { patientName: patientUser.real_name });

    // 3. 创建问诊记录（状态：进行中=0）
    const consultId = await consultDao.createRecord(userId, patientId, symptom.trim());
    console.log('[consultService] 问诊记录创建成功:', { consultId });

    // 4. 获取就诊人的健康档案摘要，辅助AI诊断
    const healthProfile = await healthService.getHealthProfileSummary(patientId);
    if (healthProfile) {
      console.log('[consultService] 已获取健康档案摘要，长度:', healthProfile.length);
    }

    // 5. 调用AI生成初始回复（传入健康档案）
    const aiResponse = await callClaude([
      { role: 'user', content: symptom.trim() }
    ], healthProfile);

    console.log('[consultService] AI响应获取成功:', { phase: aiResponse.phase });

    // 6. 保存对话记录（先用户输入，再AI回复，保证时间线）
    await consultDao.addDialog(consultId, 1, symptom.trim());  // 用户
    const aiContent = aiResponse.content || '';
    await consultDao.addDialog(consultId, 2, aiContent);       // AI

    // 6. 返回结果
    const dialogs = await consultDao.getDialogsByConsult(consultId);
    return {
      consultId,
      dialogList: dialogs,
      analysis: {
        phase: aiResponse.phase || '追问',
        content: aiContent,
        medicalPriority: aiResponse.medicalPriority || null,
        recommendDepartment: aiResponse.recommendDepartment || null,
        nursingAdvice: aiResponse.nursingAdvice || null
      }
    };
  },

  /**
   * 发送对话（多轮问诊）
   * @param {number} consultId - 问诊记录ID
   * @param {number} userId - 当前用户ID（权限校验）
   * @param {number} speaker - 发言方：1-用户，2-AI
   * @param {string} dialogContent - 对话内容
   * @returns {Object} {consultId, dialogList, aiReply}
   */
  async sendDialog(consultId, userId, speaker, dialogContent) {
    // 1. 校验参数
    if (!dialogContent || !dialogContent.trim()) {
      throw new AppError('BAD_REQUEST', '对话内容不能为空');
    }
    if (![1, 2].includes(speaker)) {
      throw new AppError('BAD_REQUEST', '发言方参数错误（1-用户，2-AI）');
    }

    // 2. 校验问诊记录存在且归属正确
    const consult = await consultDao.getRecordById(consultId);
    if (!consult) {
      throw new AppError('CONSULT_NOT_FOUND');
    }
    if (consult.user_id !== userId) {
      throw new AppError('FORBIDDEN');
    }
    if (consult.consult_status !== 0) {
      throw new AppError('CONSULT_ALREADY_END');
    }

      // 3. 如果是用户发言，保存并调用AI回复
    if (speaker === 1) {
      await consultDao.addDialog(consultId, 1, dialogContent.trim());

      // 获取历史对话上下文
      const historyDialogs = await consultDao.getDialogsByConsult(consultId);
      const messages = historyDialogs
        .filter(d => d.speaker === 1)
        .map(d => ({ role: 'user', content: d.dialog_content }));

      // 获取就诊人的健康档案摘要，辅助AI诊断
      const healthProfile = await healthService.getHealthProfileSummary(consult.patient_id);
      if (healthProfile) {
        console.log('[consultService] 已获取健康档案摘要，长度:', healthProfile.length);
      }

      // 调用AI（传入健康档案）
      const aiResponse = await callClaude(messages, healthProfile);
      const aiContent = aiResponse.content || JSON.stringify(aiResponse);
      await consultDao.addDialog(consultId, 2, aiContent);

      const updatedDialogs = await consultDao.getDialogsByConsult(consultId);
      return {
        consultId,
        dialogList: updatedDialogs,
        aiReply: {
          phase: aiResponse.phase || '分析',
          content: aiContent,
          medicalPriority: aiResponse.medicalPriority || null,
          recommendDepartment: aiResponse.recommendDepartment || null,
          nursingAdvice: aiResponse.nursingAdvice || null
        }
      };
    }

    // 如果是AI发言直接保存（审核后内容回写）
    await consultDao.addDialog(consultId, 2, dialogContent.trim());
    const dialogs = await consultDao.getDialogsByConsult(consultId);
    return { consultId, dialogList: dialogs, aiReply: null };
  },

  /**
   * 结束问诊
   * @param {number} consultId
   * @param {number} userId
   * @param {Object} options - {illnessAnalysis, medicalPriority, recommendDepartment, nursingAdvice}
   * @returns {Object} 完整问诊记录
   */
  async endConsult(consultId, userId, options = {}) {
    // 1. 校验问诊记录存在且归属正确
    const consult = await consultDao.getRecordById(consultId);
    if (!consult) {
      throw new AppError('CONSULT_NOT_FOUND');
    }
    if (consult.user_id !== userId) {
      throw new AppError('FORBIDDEN');
    }
    if (consult.consult_status !== 0) {
      throw new AppError('CONSULT_ALREADY_END');
    }

    // 2. 如果没有传入分析结果，异步调用AI生成最终分析（不阻塞响应）
    let finalAnalysis = options;
    if (!options.illnessAnalysis) {
      // 先获取对话历史，用于异步AI调用
      const historyDialogs = await consultDao.getDialogsByConsult(consultId);
      const messages = historyDialogs
        .filter(d => d.speaker === 1)
        .map(d => ({ role: 'user', content: d.dialog_content }));
      messages.push({ role: 'user', content: '请根据以上所有信息，生成最终的病情分析、就医优先级、推荐科室和居家护理建议。' });

      // 先用占位内容结束问诊，立即返回响应
      finalAnalysis = {
        illnessAnalysis: 'AI正在生成病情分析，请稍后刷新页面查看...',
        medicalPriority: null,
        recommendDepartment: '',
        nursingAdvice: ''
      };

      // 获取就诊人的健康档案摘要，辅助AI结束诊断
      const healthProfile = await healthService.getHealthProfileSummary(consult.patient_id);
      if (healthProfile) {
        console.log('[consultService] 已获取健康档案摘要，长度:', healthProfile.length);
      }

      // 异步调用AI（不阻塞），完成后自动更新记录
      callClaude(messages, healthProfile, 180000)
        .then(async (aiResponse) => {
          try {
            await consultDao.endRecord(consultId, {
              illnessAnalysis: aiResponse.content || '',
              medicalPriority: aiResponse.medicalPriority || 3,
              recommendDepartment: aiResponse.recommendDepartment || '',
              nursingAdvice: aiResponse.nursingAdvice || ''
            });
            console.log('[consultService] 后台AI分析已更新:', consultId);
          } catch (err) {
            console.error('[consultService] 后台更新分析失败:', err.message);
          }
        })
        .catch(err => {
          console.error('[consultService] 后台AI调用失败:', err.message);
          // AI调用失败时更新为友好提示
          consultDao.endRecord(consultId, {
            illnessAnalysis: 'AI服务暂时繁忙，分析生成失败，请稍后重新查看或联系客服。',
            medicalPriority: 3,
            recommendDepartment: '',
            nursingAdvice: ''
          }).catch(e => console.error('[consultService] 失败回写也失败了:', e.message));
        });
    }

    // 3. 更新问诊记录为已完成（同步执行）
    await consultDao.endRecord(consultId, finalAnalysis);

    // 4. 返回完整记录
    const updatedConsult = await consultDao.getRecordById(consultId);
    const dialogs = await consultDao.getDialogsByConsult(consultId);

    return {
      consultId: updatedConsult.consult_id,
      userId: updatedConsult.user_id,
      patientId: updatedConsult.patient_id,
      symptom: updatedConsult.symptom,
      consultStatus: updatedConsult.consult_status,
      illnessAnalysis: updatedConsult.illness_analysis,
      medicalPriority: updatedConsult.medical_priority,
      recommendDepartment: updatedConsult.recommend_department,
      nursingAdvice: updatedConsult.nursing_advice,
      startTime: updatedConsult.start_time,
      endTime: updatedConsult.end_time,
      dialogList: dialogs
    };
  },

  /**
   * 查询问诊记录列表（带分页）
   */
  async getConsultList(userId, page = 1, pageSize = 20) {
    return consultDao.getRecordsByUser(userId, { page, pageSize });
  },

  /**
   * 查询单个问诊详情
   */
  async getConsultDetail(consultId, userId) {
    const consult = await consultDao.getRecordById(consultId);
    if (!consult) throw new AppError('CONSULT_NOT_FOUND');
    if (consult.user_id !== userId) throw new AppError('FORBIDDEN');

    const dialogs = await consultDao.getDialogsByConsult(consultId);
    return {
      consultId: consult.consult_id,
      userId: consult.user_id,
      patientId: consult.patient_id,
      symptom: consult.symptom,
      consultStatus: consult.consult_status,
      illnessAnalysis: consult.illness_analysis,
      medicalPriority: consult.medical_priority,
      recommendDepartment: consult.recommend_department,
      nursingAdvice: consult.nursing_advice,
      startTime: consult.start_time,
      endTime: consult.end_time,
      dialogList: dialogs
    };
  },

  /**
   * 删除问诊记录（逻辑删除）
   */
  async deleteConsult(consultId, userId) {
    const consult = await consultDao.getRecordById(consultId);
    if (!consult) throw new AppError('CONSULT_NOT_FOUND');
    if (consult.user_id !== userId) throw new AppError('FORBIDDEN');

    return consultDao.softDeleteRecord(consultId);
  }
};

module.exports = consultService;
