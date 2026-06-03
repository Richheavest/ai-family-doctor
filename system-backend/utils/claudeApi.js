// utils/claudeApi.js — Claude大模型API调用工具类
// 用于AI问诊模块请求大模型生成问诊回复
require('dotenv').config();

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

// AI角色系统提示词（严格遵循需求规格说明书设计）
const SYSTEM_PROMPT = `【角色设定】
你是一款AI家庭医生助手，仅能为用户提供健康咨询、病情可能性分析、就医指导和健康科普服务，严禁替代执业医师进行疾病确诊、开具处方、推荐治疗方案、推荐处方药。

【核心规则】
1. 必须采用引导式问诊，用户输入症状后，主动追问关键信息，包括发病时间、诱因、伴随症状、既往病史、过敏史等核心内容。
2. 关键信息不足时，严禁做出任何疾病诊断，仅可继续引导用户补充信息，不得编造内容。
3. 仅可输出病情可能性分析，不得给出确诊结论，不得夸大病情。
4. 严禁输出任何治疗方案、用药建议，仅可给出通用的居家护理建议和健康科普。

【输出规范】
1. 语言通俗易懂，符合医学规范，不得使用违规、夸大、虚假的表述。
2. 输出JSON格式：{"phase":"追问/分析","content":"回复内容","medicalPriority":null或(1紧急就医/2常规就诊/3居家观察),"recommendDepartment":"推荐科室或null","nursingAdvice":"居家护理建议或null"}
3. 所有回答的结尾，必须包含固定免责声明。`;

/**
 * 调用Claude API（多轮对话模式）
 * @param {Array} messages - 对话历史 [{role:'user'|'assistant', content:'...'}]
 * @param {string} healthProfile - 用户健康档案摘要（可选）
 * @returns {Promise<Object>} AI回复
 */
async function callClaude(messages, healthProfile = '') {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'your_claude_api_key_here') {
    // API Key未配置时返回模拟回复（开发调试用）
    console.warn('[Claude] API Key未配置，使用模拟回复');
    return mockResponse(messages);
  }

  // 构建消息列表
  const messageList = [
    { role: 'user', content: SYSTEM_PROMPT }
  ];

  // 如果有健康档案，追加到上下文
  if (healthProfile) {
    messageList.push({
      role: 'user',
      content: `【用户健康档案】\n${healthProfile}`
    });
  }

  // 追加历史对话
  messages.forEach(msg => {
    messageList.push({ role: msg.role, content: msg.content });
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Claude API返回错误: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.content?.[0]?.text || '';

    // 尝试解析AI返回的JSON
    try {
      return JSON.parse(aiContent);
    } catch {
      // 如果AI返回的不是JSON，包装成标准格式
      return {
        phase: '分析',
        content: aiContent,
        medicalPriority: null,
        recommendDepartment: null,
        nursingAdvice: null
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Claude] API调用超时');
      throw new Error('AI服务响应超时，请稍后重试');
    }
    console.error('[Claude] API调用失败:', error.message);
    throw new Error('AI服务繁忙，请稍后重试');
  }
}

/**
 * 模拟回复（开发阶段API Key未配置时使用）
 */
function mockResponse(messages) {
  const lastMsg = messages[messages.length - 1];
  const lastContent = lastMsg?.content || '';

  // 首次问诊
  if (messages.length <= 1) {
    return {
      phase: '追问',
      content: `感谢您的描述。根据您提到的"${lastContent.slice(0, 30)}..."症状，我需要了解更多信息来做出更精准的分析。请问：\n\n1. 这些症状从什么时候开始出现的？\n2. 是否有发烧、乏力等伴随症状？\n3. 既往是否有相关的病史或过敏史？\n\n请补充以上信息，以便我为您提供更准确的分析。\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。`,
      medicalPriority: null,
      recommendDepartment: null,
      nursingAdvice: null
    };
  }

  // 多轮追问后
  if (messages.length >= 2) {
    return {
      phase: '分析',
      content: `根据您补充的信息，以下是初步分析：\n\n您描述的症状可能与常见呼吸道感染或上呼吸道过敏有关。冬季是呼吸道疾病的高发期，建议关注体温变化。\n\n请注意：这仅是可能性分析，并非确诊结论。`,
      medicalPriority: 3,
      recommendDepartment: '普通内科 / 呼吸内科',
      nursingAdvice: '1. 注意保暖，多喝温水\n2. 保持室内通风\n3. 清淡饮食，避免辛辣刺激\n4. 若症状持续超过3天不缓解，建议前往医院就诊\n\n⚠️ 本内容仅供健康参考，不构成诊疗建议，不能替代执业医师的面对面诊断，如有不适请及时前往正规医疗机构就诊。'
    };
  }

  return {
    phase: '分析',
    content: '请描述您目前的主要症状。',
    medicalPriority: null,
    recommendDepartment: null,
    nursingAdvice: null
  };
}

module.exports = { callClaude };
