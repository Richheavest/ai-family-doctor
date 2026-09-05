// utils/claudeApi.js — DeepSeek大模型API调用工具类
// 用于AI问诊模块请求大模型生成问诊回复
require('dotenv').config();

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// AI角色系统提示词（严格遵循需求规格说明书设计）
const SYSTEM_PROMPT = `【角色设定】
你是一款AI家庭医生助手，仅能为用户提供健康咨询、病情可能性分析、就医指导和健康科普服务，严禁替代执业医师进行疾病确诊、开具处方、推荐治疗方案、推荐处方药。

【核心规则】
1. 必须采用引导式问诊，用户输入症状后，主动追问关键信息，包括发病时间、诱因、伴随症状、既往病史、过敏史等核心内容。
2. 每次只询问一个问题，用户回答了之后再问下一个问题。
3. 询问轮次不易过多，每论询问都要先给出可能的病情判断然后再继续询问，直至获取足够信息便给出最终判断（总轮次最好不超过10轮）。
4. 仅可输出病情可能性分析，不得给出确诊结论，不得夸大病情。
5. 严禁输出任何治疗方案、用药建议，仅可给出通用的居家护理建议、就医建议和健康科普。
6. 如果用户不是在问诊，而是咨询某些医学、健康相关的问题，则不需要进行追问，可以直接给出科普类的回答，但仍应当询问用户是否有相关病情。

【输出规范】
1. 语言通俗易懂，符合医学规范，不得使用违规、夸大、虚假的表述。
2. 输出JSON格式：{"phase":"追问/分析","content":"回复内容","medicalPriority":null或(1紧急就医/2常规就诊/3居家观察),"recommendDepartment":"推荐科室或null","nursingAdvice":"居家护理建议或null"}
3. 所有回答的结尾，必须包含固定免责声明。`;

/**
 * 清理AI返回的文本，去掉markdown代码块标记
 * @param {string} text - AI原始返回文本
 * @returns {string} 清理后的文本
 */
function cleanAIResponse(text) {
  let cleaned = text.trim();
  // 去掉开头的 ```json 或 ``` 标记
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/i, '');
  // 去掉结尾的 ``` 标记
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  return cleaned.trim();
}

/**
 * 从AI返回文本中提取JSON对象（支持JSON后带额外文本，如免责声明）
 * @param {string} text - 清理后的AI返回文本
 * @returns {{json: Object|null, extraText: string}}
 */
function extractJSON(text) {
  // 找到第一个 {
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    return { json: null, extraText: text };
  }

  // 用括号匹配找到对应的 }
  let depth = 0;
  let jsonEnd = -1;
  let inString = false;
  let escape = false;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        jsonEnd = i;
        break;
      }
    }
  }

  if (jsonEnd === -1) {
    return { json: null, extraText: text };
  }

  const jsonStr = text.substring(firstBrace, jsonEnd + 1);
  const extraText = text.substring(jsonEnd + 1).trim();

  try {
    return { json: JSON.parse(jsonStr), extraText };
  } catch {
    return { json: null, extraText: text };
  }
}

/**
 * 调用DeepSeek API（多轮对话模式）
 * @param {Array} messages - 对话历史 [{role:'user'|'assistant', content:'...'}]
 * @param {string} healthProfile - 用户健康档案摘要（可选）
 * @param {number} timeoutMs - 超时时间（毫秒），默认60000（60秒）
 * @returns {Promise<Object>} AI回复
 */
async function callClaude(messages, healthProfile = '', timeoutMs = 60000) {
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
    // API Key未配置时返回模拟回复（开发调试用）
    console.warn('[DeepSeek] API Key未配置，使用模拟回复');
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
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log('[DeepSeek] 开始调用API，消息数量:', messageList.length);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: messageList.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: 0.7,
        max_tokens: 2048
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] API返回错误状态:', response.status, errorText);
      throw new Error(`DeepSeek API返回错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('[DeepSeek] API调用成功，返回内容长度:', data.choices?.[0]?.message?.content?.length || 0);
    const aiRawContent = data.choices?.[0]?.message?.content || '';

    // 清理markdown代码块标记后提取JSON
    const cleanedContent = cleanAIResponse(aiRawContent);
    const { json: parsed, extraText } = extractJSON(cleanedContent);

    if (parsed) {
      // JSON解析成功，content取JSON中的字段，额外的免责声明文本拼接到末尾
      let content = parsed.content || '';
      if (extraText) {
        content += '\n\n' + extraText;
      }
      return {
        phase: parsed.phase || '分析',
        content,
        medicalPriority: parsed.medicalPriority || null,
        recommendDepartment: parsed.recommendDepartment || null,
        nursingAdvice: parsed.nursingAdvice || null
      };
    } else {
      // 无法提取JSON，直接用清理后的文本作为content
      return {
        phase: '分析',
        content: cleanedContent,
        medicalPriority: null,
        recommendDepartment: null,
        nursingAdvice: null
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[DeepSeek] API调用超时');
      throw new Error('AI服务响应超时，请稍后重试');
    }
    console.error('[DeepSeek] API调用失败:', error.message, error.stack);
    throw new Error(`AI服务繁忙: ${error.message}`);
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