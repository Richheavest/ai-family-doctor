// service/triageService.js — 挂号分诊指导业务逻辑层
// 基于DeepSeek大模型的症状→科室推荐 + 医院查询 + 就诊指南
// 失败时静默降级到静态规则库
require('dotenv').config();
const AppError = require('../utils/appError');

// ==================== DeepSeek API 配置 ====================
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// ==================== 分诊规则库（~22条，覆盖常见症状） ====================
const TRIAGE_RULES = [
  {
    keywords: ['头痛', '头疼', '偏头痛', '头胀', '头昏'],
    department: '神经内科',
    priority: 2,
    priorityReason: '头痛可能由多种原因引起（紧张性头痛、偏头痛、高血压等），建议常规就诊排查',
    guide: '就诊前注意记录头痛发作时间、频率、诱因及伴随症状（如恶心、视力模糊等）。避免自行服用止痛药掩盖病情。如突发剧烈头痛伴呕吐，请立即前往急诊。'
  },
  {
    keywords: ['头晕', '眩晕', '天旋地转', '站不稳', '头重脚轻'],
    department: '神经内科',
    priority: 2,
    priorityReason: '头晕/眩晕原因复杂，可能涉及神经系统、耳部前庭或心血管问题',
    guide: '就诊前记录头晕发作频率、持续时间、诱发姿势。如伴随口齿不清、一侧肢体无力，请立即去急诊。空腹测量血压。'
  },
  {
    keywords: ['发烧', '发热', '高烧', '低烧', '体温', '发烫'],
    department: '发热门诊',
    priority: 2,
    priorityReason: '发热是机体对感染或炎症的反应，需明确病因后对因治疗',
    guide: '就诊前测量并记录体温变化曲线（至少早晚各一次）。多喝水，物理降温。体温≥39℃或持续超过3天请尽快就诊。儿童发热请前往儿科。'
  },
  {
    keywords: ['咳嗽', '咳痰', '干咳', '咳血', '痰多', '喉咙痒'],
    department: '呼吸内科',
    priority: 3,
    priorityReason: '咳嗽多为呼吸道感染或过敏引起，多数可居家观察，持续不缓解需就诊',
    guide: '记录咳嗽性质（干咳/有痰）、痰的颜色和量、是否伴有发热。多喝温水，保持室内湿度。咳嗽超过2周或痰中带血请及时就诊。'
  },
  {
    keywords: ['胸痛', '胸闷', '心口疼', '胸口闷', '气短', '呼吸困难', '喘不上气'],
    department: '心血管内科',
    priority: 1,
    priorityReason: '胸痛/胸闷可能提示心脏问题，需紧急排查心血管急症',
    guide: '如突发剧烈胸痛、伴出汗、恶心、放射至左臂或下颌，请立即拨打120或前往最近急诊。就诊时携带既往心电图、心脏超声等检查报告。'
  },
  {
    keywords: ['心悸', '心慌', '心跳快', '心跳乱', '心律不齐', '心跳过速'],
    department: '心血管内科',
    priority: 2,
    priorityReason: '心悸可能与心律失常、焦虑或甲状腺功能异常有关',
    guide: '记录心悸发作时间、持续时间、诱发因素（运动/情绪/饮酒等）。可先做24小时动态心电图检查。避免咖啡、浓茶等刺激性饮品。'
  },
  {
    keywords: ['血压高', '高血压', '血压偏高', '血压升高'],
    department: '心血管内科',
    priority: 2,
    priorityReason: '血压持续偏高需规范管理，控制不佳可引发心脑血管并发症',
    guide: '每天定时测量血压（建议早晚各一次），记录血压日志。低盐饮食（每日＜6g），规律服药，不可自行停药。收缩压≥180或舒张压≥110请立即就医。'
  },
  {
    keywords: ['腹痛', '胃痛', '肚子疼', '胃疼', '腹部不适', '胃胀', '反酸', '烧心'],
    department: '消化内科',
    priority: 2,
    priorityReason: '腹痛病因多样，需根据疼痛部位、性质综合判断',
    guide: '记录腹痛具体位置（上腹/下腹/左/右）、疼痛性质（钝痛/绞痛/刺痛）、与进食的关系。如突发剧烈腹痛、腹肌紧张，请立即去急诊（排除急腹症）。'
  },
  {
    keywords: ['腹泻', '拉肚子', '水样便', '呕吐', '恶心', '拉稀'],
    department: '消化内科',
    priority: 2,
    priorityReason: '腹泻/呕吐多由急性胃肠炎或食物不当引起，需注意防脱水',
    guide: '多补充水分和电解质（口服补液盐），清淡饮食。如腹泻超过3天、便中带血、伴高热或严重脱水，请及时就诊。'
  },
  {
    keywords: ['鼻塞', '流鼻涕', '打喷嚏', '流涕', '鼻痒', '鼻炎', '鼻窦炎'],
    department: '耳鼻喉科',
    priority: 3,
    priorityReason: '多为过敏性鼻炎或上呼吸道感染，通常可居家处理',
    guide: '过敏性鼻炎患者注意规避过敏原，可使用生理盐水洗鼻。如症状持续超过2周、伴面部疼痛或脓涕，建议就诊排除鼻窦炎。'
  },
  {
    keywords: ['耳痛', '耳鸣', '听力下降', '耳朵疼', '耳闷', '中耳炎'],
    department: '耳鼻喉科',
    priority: 2,
    priorityReason: '耳部症状可能为感染或听力损伤，需专业检查确诊',
    guide: '避免用棉签或异物掏耳。如突发听力下降，请72小时内尽快就诊（突发性耳聋治疗窗口期短）。'
  },
  {
    keywords: ['咽喉痛', '喉咙痛', '嗓子疼', '咽痛', '扁桃体', '声音嘶哑', '吞咽困难'],
    department: '耳鼻喉科',
    priority: 3,
    priorityReason: '多为咽炎或扁桃体炎，多数为病毒感染可自愈',
    guide: '多喝温水，温盐水漱口，避免辛辣刺激食物。如伴高热、吞咽困难、声音嘶哑超过2周，请及时就诊。'
  },
  {
    keywords: ['关节痛', '腰疼', '腰痛', '腿疼', '膝盖疼', '颈椎', '肩周', '骨折', '扭伤'],
    department: '骨科',
    priority: 2,
    priorityReason: '骨骼肌肉系统问题，需明确病因（劳损/退变/炎症/外伤）后针对性处理',
    guide: '记录疼痛部位、性质、活动受限程度。急性扭伤48小时内冰敷，48小时后热敷。如外伤后无法承重或畸形，请立即前往急诊拍X光片。'
  },
  {
    keywords: ['皮疹', '过敏', '痒', '荨麻疹', '湿疹', '红斑', '皮炎', '起疹子'],
    department: '皮肤科',
    priority: 2,
    priorityReason: '皮疹病因复杂（过敏/感染/自身免疫），需面诊后确诊',
    guide: '就诊前不要涂抹药膏以免影响医生判断。记录皮疹出现时间、部位、是否瘙痒。如皮疹迅速扩散伴呼吸困难，请立即去急诊（过敏性休克风险）。'
  },
  {
    keywords: ['视力模糊', '眼睛疼', '眼红', '眼干', '看不清', '飞蚊', '视力下降', '结膜炎'],
    department: '眼科',
    priority: 2,
    priorityReason: '眼部症状需专业设备检查，部分疾病（如青光眼急性发作）需紧急处理',
    guide: '如突发视力急剧下降、眼痛伴恶心呕吐（可能为急性青光眼），请立即去眼科急诊。日常注意用眼卫生，避免长时间屏幕作业。'
  },
  {
    keywords: ['牙痛', '牙疼', '牙龈', '口腔溃疡', '口疮', '牙齿', '牙龈出血', '口臭'],
    department: '口腔科',
    priority: 3,
    priorityReason: '多为龋齿、牙髓炎或口腔溃疡，常规就诊即可',
    guide: '牙痛时避免冷热刺激。口腔溃疡通常1-2周自愈，如超过3周不愈合请就诊排查。定期洗牙和口腔检查（每年1-2次）。'
  },
  {
    keywords: ['尿频', '尿急', '尿痛', '尿血', '小便疼', '排尿困难', '尿不尽'],
    department: '泌尿外科',
    priority: 2,
    priorityReason: '可能为尿路感染、结石或前列腺问题，需尿液检查确诊',
    guide: '就诊前憋尿以便做尿常规+B超检查。多喝水促进排尿。如无尿排出伴剧烈腰痛（可能肾结石嵌顿），请立即去急诊。'
  },
  {
    keywords: ['月经', '痛经', '妇科', '白带', '阴道', '外阴', '下腹坠胀', '经期'],
    department: '妇科',
    priority: 2,
    priorityReason: '妇科问题需专业检查（B超、分泌物等）明确诊断',
    guide: '就诊前避免阴道用药和冲洗（影响检查结果）。月经不调建议记录近3个月的周期、经量。如突发剧烈下腹痛，请立即去急诊排除宫外孕等急症。'
  },
  {
    keywords: ['儿童', '小孩', '宝宝', '婴儿', '幼儿', '小儿', '孩子'],
    department: '儿科',
    priority: 2,
    priorityReason: '儿童疾病进展快，需专科评估，不可简单按成人剂量自行用药',
    guide: '就诊时携带儿童预防接种本和既往病历。记录发热温度（建议用电子体温计）、饮食和大小便情况。儿童高热惊厥请立即就医。'
  },
  {
    keywords: ['失眠', '焦虑', '抑郁', '情绪低落', '睡不着', '多梦', '紧张', '心慌意乱', '压力大'],
    department: '心理科',
    priority: 2,
    priorityReason: '心理健康问题日益常见，及时干预效果良好',
    guide: '记录近期的睡眠情况、情绪变化规律。可先做心理自评量表（PHQ-9/GAD-7）作为参考。如出现自伤或自杀念头，请立即拨打心理援助热线。'
  },
  {
    keywords: ['血糖', '糖尿病', '血糖高', '血糖低', '多饮', '多尿', '消瘦', '口渴'],
    department: '内分泌科',
    priority: 2,
    priorityReason: '血糖异常需系统管理，控制不佳可导致多系统并发症',
    guide: '就诊前空腹8-12小时（可少量饮水），带好既往血糖监测记录和用药清单。糖尿病患者每3-6个月复查糖化血红蛋白。'
  },
  {
    keywords: ['外伤', '出血', '摔伤', '撞伤', '割伤', '昏迷', '抽搐', '中毒', '烧伤', '窒息'],
    department: '急诊科',
    priority: 1,
    priorityReason: '紧急情况，需立即就医处理',
    guide: '外伤出血先用干净纱布/毛巾压迫止血。疑似骨折勿随意移动伤肢。昏迷患者保持侧卧位防止窒息。请立即拨打120或前往最近医院急诊科。'
  }
];

// ==================== 科室就诊指南（每个科室的详细指导） ====================
const DEPARTMENT_GUIDES = {
  '神经内科': {
    commonChecks: '头颅CT/MRI、脑电图、TCD（经颅多普勒）、神经系统体格检查',
    prepTips: '1. 记录症状发作时间线\n2. 带既往影像资料（CT/MRI片）\n3. 列出正在服用的药物清单\n4. 有家属陪同更好（便于提供病史）',
    description: '诊治脑血管疾病、癫痫、帕金森、头痛、眩晕、周围神经病变等神经系统疾病'
  },
  '呼吸内科': {
    commonChecks: '胸部X光/CT、肺功能检查、血常规、痰培养、支气管镜',
    prepTips: '1. 就诊前勿吸烟或吸入刺激性气体\n2. 肺功能检查需配合深吸气、用力呼气\n3. 带既往胸片/CT片\n4. 记录咳嗽性质和痰的性状',
    description: '诊治感冒、肺炎、支气管炎、哮喘、慢阻肺（COPD）等呼吸系统疾病'
  },
  '发热门诊': {
    commonChecks: '血常规、C反应蛋白、流感/新冠抗原检测、胸部CT（必要时）',
    prepTips: '1. 佩戴好口罩\n2. 记录发热的温度和持续时间\n3. 告知近期旅行史和接触史\n4. 配合预检分诊进行传染病筛查',
    description: '筛查和诊治各类急性发热性疾病，是呼吸道传染病的前哨'
  },
  '心血管内科': {
    commonChecks: '心电图、心脏彩超、24小时动态心电图、运动平板试验、冠脉CTA/造影',
    prepTips: '1. 测量并记录就诊时血压\n2. 带既往心电图和心脏检查报告\n3. 列出服用的降压药/降脂药/抗凝药\n4. 穿宽松上衣便于检查',
    description: '诊治高血压、冠心病、心律失常、心力衰竭、高脂血症等心血管疾病'
  },
  '消化内科': {
    commonChecks: '胃镜、肠镜、腹部B超/CT、幽门螺杆菌检测、肝功能、便常规+潜血',
    prepTips: '1. 胃镜/肠镜需提前预约并按要求禁食禁水\n2. 记录腹痛位置、性质、与进食关系\n3. 便常规留取新鲜标本\n4. 如实告知饮酒史和饮食习惯',
    description: '诊治胃炎、消化性溃疡、肠炎、肝炎、胰腺炎、功能性胃肠病等消化系统疾病'
  },
  '耳鼻喉科': {
    commonChecks: '耳内镜、鼻内镜、喉镜、听力测试、声导抗检查',
    prepTips: '1. 耳部检查前勿掏耳\n2. 鼻部检查前勿用力擤鼻\n3. 喉镜检查前勿进食过饱\n4. 听力检查在安静环境中进行',
    description: '诊治中耳炎、鼻炎、鼻窦炎、咽喉炎、声带疾病、听力障碍等耳鼻咽喉疾病'
  },
  '骨科': {
    commonChecks: 'X光片、CT三维重建、MRI（软组织/椎间盘）、骨密度测定',
    prepTips: '1. 带既往影像资料\n2. 穿宽松衣物便于暴露检查部位\n3. 描述疼痛与活动的关系\n4. 告知外伤史和职业特点',
    description: '诊治骨折、关节损伤、颈椎病、腰椎间盘突出、关节炎、骨质疏松等骨骼肌肉系统疾病'
  },
  '皮肤科': {
    commonChecks: '皮肤镜、过敏原检测、真菌镜检、皮肤病理活检（必要时）',
    prepTips: '1. 就诊前勿在皮损处涂抹药膏或化妆品\n2. 拍下皮疹在不同阶段的变化照片\n3. 记录可能的过敏原（食物/药物/接触物）\n4. 告知近期用药史',
    description: '诊治湿疹、荨麻疹、痤疮、银屑病、真菌感染、过敏性疾病等皮肤疾病'
  },
  '眼科': {
    commonChecks: '视力检查、眼压测量、裂隙灯检查、眼底检查、OCT（光学相干断层扫描）',
    prepTips: '1. 如可能散瞳检查，请勿自驾前来\n2. 带正在使用的眼药水\n3. 隐形眼镜佩戴者提前摘镜\n4. 告诉医生是否有糖尿病/高血压等全身疾病',
    description: '诊治近视/远视、白内障、青光眼、眼底病变、结膜炎、干眼症等眼科疾病'
  },
  '口腔科': {
    commonChecks: '口腔全景X光片、牙髓活力测试、牙周探诊、CBCT（牙科锥形束CT）',
    prepTips: '1. 就诊前正常刷牙保持口腔清洁\n2. 如有牙痛，勿自行服用止痛药掩盖症状\n3. 告知全身疾病（如糖尿病/心脏病）\n4. 建议每年洁牙1-2次',
    description: '诊治龋齿（蛀牙）、牙髓炎、牙周炎、口腔溃疡、智齿问题等口腔疾病'
  },
  '泌尿外科': {
    commonChecks: '尿常规+尿沉渣、泌尿系B超/CT、肾功能、膀胱镜（必要时）、PSA（前列腺特异性抗原）',
    prepTips: '1. 憋尿做B超检查\n2. 留取中段尿做尿常规\n3. 告知排尿异常的具体症状和持续时间\n4. 记录每日饮水量和排尿次数',
    description: '诊治尿路感染、肾结石/输尿管结石、前列腺增生、泌尿系肿瘤等疾病'
  },
  '妇科': {
    commonChecks: '妇科B超（阴式/腹式）、白带常规、宫颈TCT/HPV筛查、性激素六项',
    prepTips: '1. 避开月经期（急诊除外）\n2. 检查前3天避免阴道用药和性生活\n3. 穿方便脱换的衣物\n4. 记录近3个月月经周期',
    description: '诊治月经不调、妇科炎症、子宫肌瘤、卵巢囊肿、更年期综合征等妇科疾病'
  },
  '儿科': {
    commonChecks: '血常规、CRP、病原体检测、生长发育评估、过敏原检测',
    prepTips: '1. 携带预防接种本\n2. 记录发热温度、持续时间\n3. 描述患儿精神状态、饮食、大小便\n4. 告知过敏史和既往病史',
    description: '诊治儿童呼吸道感染、消化不良、生长发育问题、儿童传染病、过敏性疾病等'
  },
  '心理科': {
    commonChecks: '心理量表评估（PHQ-9/GAD-7等）、临床访谈、认知功能评估',
    prepTips: '1. 梳理近期的情绪和睡眠变化\n2. 记录是否有影响情绪的生活事件\n3. 如实告知用药史和饮酒情况\n4. 首次就诊建议家属陪同',
    description: '诊治抑郁症、焦虑症、睡眠障碍、应激障碍、心身疾病等心理健康问题'
  },
  '内分泌科': {
    commonChecks: '空腹血糖+餐后血糖、糖化血红蛋白（HbA1c）、甲状腺功能、激素测定',
    prepTips: '1. 查空腹血糖需禁食8-12小时\n2. 带血糖监测记录本\n3. 列出正在服用的降糖药/胰岛素\n4. 告知是否有甲状腺疾病家族史',
    description: '诊治糖尿病、甲状腺疾病（甲亢/甲减）、肥胖、痛风、骨质疏松等代谢内分泌疾病'
  },
  '急诊科': {
    commonChecks: '快速血常规+生化+凝血、心电图、床旁B超、CT、血气分析',
    prepTips: '1. 优先携带身份证、医保卡\n2. 简要清晰地说明主要症状和发病时间\n3. 告知过敏史和正在服用的药物\n4. 如有既往病历请一并带来',
    description: '处理各类急危重症：急性心脑血管事件、严重创伤、中毒、急腹症、高热惊厥等'
  }
};

// ==================== 医院数据（~10家，覆盖不同等级和区域） ====================
const HOSPITALS = [
  {
    id: 1,
    name: '北京协和医院',
    level: '三甲',
    type: '综合医院',
    address: '北京市东城区东单帅府园1号',
    phone: '010-69156114',
    departments: ['神经内科', '呼吸内科', '心血管内科', '消化内科', '耳鼻喉科', '骨科', '皮肤科', '眼科', '口腔科', '泌尿外科', '妇科', '儿科', '内分泌科', '心理科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '挂号方式：「北京协和医院」APP预约（提前7天放号），急诊24小时开放'
  },
  {
    id: 2,
    name: '北京大学第一医院',
    level: '三甲',
    type: '综合医院',
    address: '北京市西城区西什库大街8号',
    phone: '010-83572211',
    departments: ['神经内科', '呼吸内科', '心血管内科', '消化内科', '耳鼻喉科', '骨科', '皮肤科', '眼科', '口腔科', '泌尿外科', '妇科', '儿科', '内分泌科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '挂号方式：微信公众号「北京大学第一医院」预约，门诊时间 8:00-17:00'
  },
  {
    id: 3,
    name: '北京安贞医院',
    level: '三甲',
    type: '专科医院（心血管）',
    address: '北京市朝阳区安贞路2号',
    phone: '010-64412431',
    departments: ['心血管内科', '神经内科', '呼吸内科', '消化内科', '内分泌科', '急诊科'],
    isEmergency: true,
    tips: '心血管疾病首选，心脏内外科全国领先。可通过「北京安贞医院」小程序预约挂号'
  },
  {
    id: 4,
    name: '北京天坛医院',
    level: '三甲',
    type: '专科医院（神经科学）',
    address: '北京市丰台区南四环西路119号',
    phone: '010-59976611',
    departments: ['神经内科', '心血管内科', '骨科', '眼科', '耳鼻喉科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '神经内科/神经外科全国领先，头痛、头晕、脑血管疾病首选。微信公众号预约'
  },
  {
    id: 5,
    name: '北京儿童医院',
    level: '三甲',
    type: '专科医院（儿科）',
    address: '北京市西城区南礼士路56号',
    phone: '010-59616161',
    departments: ['儿科', '皮肤科', '眼科', '口腔科', '耳鼻喉科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '0-18岁儿童专科医院，发热咳嗽腹泻等均可就诊。APP「北京儿童医院」预约，急诊24小时'
  },
  {
    id: 6,
    name: '北京友谊医院',
    level: '三甲',
    type: '综合医院',
    address: '北京市西城区永安路95号',
    phone: '010-63139999',
    departments: ['神经内科', '呼吸内科', '心血管内科', '消化内科', '骨科', '皮肤科', '眼科', '口腔科', '泌尿外科', '妇科', '内分泌科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '消化内科为国家重点专科，消化系统疾病首选。京医通/114平台预约挂号'
  },
  {
    id: 7,
    name: '北京积水潭医院',
    level: '三甲',
    type: '专科医院（骨科）',
    address: '北京市西城区新街口东街31号',
    phone: '010-58516688',
    departments: ['骨科', '泌尿外科', '神经内科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '骨科/烧伤科全国领先，骨折、关节损伤、运动损伤首选。微信公众号预约'
  },
  {
    id: 8,
    name: '朝阳区人民医院',
    level: '二甲',
    type: '综合医院',
    address: '北京市朝阳区朝阳门外东大桥',
    phone: '010-65012345',
    departments: ['呼吸内科', '消化内科', '心血管内科', '骨科', '妇科', '儿科', '皮肤科', '口腔科', '眼科', '耳鼻喉科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '常见病、多发病的首选就近医院，排队时间较短。电话或现场挂号均可'
  },
  {
    id: 9,
    name: '海淀医院',
    level: '二甲',
    type: '综合医院',
    address: '北京市海淀区中关村大街29号',
    phone: '010-82619999',
    departments: ['呼吸内科', '消化内科', '心血管内科', '神经内科', '骨科', '妇科', '口腔科', '眼科', '耳鼻喉科', '皮肤科', '急诊科', '发热门诊'],
    isEmergency: true,
    tips: '海淀区综合性二级甲等医院，支持京医通预约挂号，门诊 8:00-17:00'
  },
  {
    id: 10,
    name: '方庄社区卫生服务中心',
    level: '社区',
    type: '社区卫生服务中心',
    address: '北京市丰台区方庄芳群园三区1号',
    phone: '010-67631290',
    departments: ['发热门诊', '儿科', '妇科', '口腔科'],
    isEmergency: false,
    tips: '方便就近看诊、开药、打疫苗，适合慢性病复诊取药和轻微常见病。无急诊，急症请前往上级医院'
  }
];

// ==================== 所有科室汇总 ====================
const ALL_DEPARTMENTS = [...new Set(TRIAGE_RULES.map(r => r.department))].sort();

// ==================== DeepSeek System Prompt ====================
function buildSystemPrompt() {
  const deptList = ALL_DEPARTMENTS.map(dept => {
    const guide = DEPARTMENT_GUIDES[dept];
    const desc = guide ? guide.description : '暂无描述';
    return `- ${dept}：${desc}`;
  }).join('\n');

  return `你是医院智能分诊助手。根据患者症状推荐最合适的科室。

【可选科室】
${deptList}

【规则】
1. 分析症状：部位、持续时间、严重程度、伴随症状、诱因。
2. 推荐1-3个科室，按匹配度排序，第一个为最高置信度。
3. 每个推荐含：department(科室名)、confidence(0~1浮点数)、priority(1紧急/2常规/3居家)、priorityReason(推荐理由)、guide(就诊建议)、alternativeDepartments(备选科室字符串数组)。
4. 输出analysis(2-3句综合分析)、suggestedQuestions(2-3个追问字符串数组)。

【约束】
- 严禁确诊、开药或推荐治疗方案。
- 模糊描述推荐"普通内科"并引导补充细节。
- 急危重症(胸痛、呼吸困难、严重外伤、昏迷等)priority=1。
- 末尾含免责：本内容仅供健康参考，不构成诊疗建议，如有不适请及时就医。

【输出】纯JSON（不要markdown包裹）：
{"analysis":"...","recommendations":[{"department":"...","confidence":0.9,"priority":2,"priorityReason":"...","guide":"...","alternativeDepartments":["..."]}],"suggestedQuestions":["..."]}`;
}

// ==================== JSON 提取工具 ====================
function extractJson(text) {
  // 1. 直接解析
  try { return JSON.parse(text); } catch {}

  // 2. 提取 ```json ... ``` 代码块
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }

  // 3. 提取第一个 { 到最后一个 }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch {}
  }

  return null;
}

// ==================== DeepSeek API 调用 ====================
function callDeepSeekTriage(symptom) {
  const systemPrompt = buildSystemPrompt();

  return new Promise((resolve, reject) => {
    const https = require('https');
    const body = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: symptom }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    const url = new URL(DEEPSEEK_API_URL);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('DeepSeek速率限制(429)'));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`DeepSeek API返回错误: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.message?.content || '';
          resolve(extractJson(content));
        } catch (e) {
          reject(new Error('DeepSeek返回解析失败'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('DeepSeek请求超时'));
    });

    req.write(body);
    req.end();
  });
}

// ==================== 旧规则引擎（DeepSeek失败时的兜底） ====================
function keywordFallback(symptom) {
  const text = symptom.trim();
  const allMatches = [];

  for (const rule of TRIAGE_RULES) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) matchCount++;
    }
    if (matchCount > 0) allMatches.push({ rule, matchCount });
  }

  allMatches.sort((a, b) => b.matchCount - a.matchCount);
  const topMatches = allMatches.slice(0, 3);

  if (topMatches.length === 0) {
    return {
      symptom: text,
      analysis: '您描述的症状暂未匹配到明确的科室，建议前往综合医院由分诊台护士为您现场指导。',
      recommendations: [{
        department: '急诊科',
        confidence: 0.3,
        priority: 1,
        priorityReason: '症状描述模糊，无法精确定位科室，如情况紧急请立即就医',
        guide: '请前往医院后向分诊台护士说明症状，由专业人员为您分诊。建议携带身份证和医保卡。',
        alternativeDepartments: ['普通内科']
      }, {
        department: '普通内科',
        confidence: 0.2,
        priority: 2,
        priorityReason: '如症状较轻，可先挂普通内科做初步检查和诊断',
        guide: '普通内科可处理大多数常见症状的初步诊断，医生会根据检查结果转诊至专科。',
        alternativeDepartments: []
      }],
      suggestedQuestions: ['症状从什么时候开始的？', '是否有发热、乏力等伴随症状？', '既往是否有相关病史？']
    };
  }

  return {
    symptom: text,
    analysis: `根据您的描述，系统识别到以下关键症状特征，为您匹配了 ${topMatches.length} 个相关科室供参考。`,
    recommendations: topMatches.map(m => ({
      department: m.rule.department,
      confidence: Math.min(0.7, m.matchCount / 5),
      priority: m.rule.priority,
      priorityReason: m.rule.priorityReason,
      guide: m.rule.guide,
      alternativeDepartments: []
    })),
    suggestedQuestions: ['症状持续多久了？', '是否有其他伴随症状？']
  };
}

// ==================== 业务逻辑 ====================
const triageService = {
  /**
   * POST /api/triage/recommend — 症状→科室推荐（DeepSeek，失败时降级规则库）
   * @param {string} symptom - 用户输入的症状描述
   * @returns {Object} { symptom, analysis, recommendations[], suggestedQuestions[] }
   */
  async recommend(symptom) {
    if (!symptom || !symptom.trim()) {
      throw new AppError('TRIAGE_SYMPTOM_EMPTY');
    }

    const text = symptom.trim();

    // 尝试 DeepSeek 推理
    if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here') {
      try {
        const aiResult = await callDeepSeekTriage(text);
        if (aiResult && aiResult.recommendations?.length) {
          return {
            symptom: text,
            analysis: aiResult.analysis || '',
            recommendations: aiResult.recommendations.map(r => ({
              department: r.department || '未知科室',
              confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
              priority: [1, 2, 3].includes(r.priority) ? r.priority : 2,
              priorityReason: r.priorityReason || '',
              guide: r.guide || '',
              alternativeDepartments: Array.isArray(r.alternativeDepartments) ? r.alternativeDepartments : []
            })),
            suggestedQuestions: Array.isArray(aiResult.suggestedQuestions) ? aiResult.suggestedQuestions : []
          };
        }
      } catch (err) {
        if (err.message.includes('429') || err.message.includes('速率限制')) {
          console.warn('[DeepSeek] 速率限制，降级到规则引擎');
        } else if (err.message.includes('超时')) {
          console.warn('[DeepSeek] 请求超时(>10s)，降级到规则引擎');
        } else {
          console.warn('[DeepSeek] 调用失败，降级到规则引擎:', err.message);
        }
      }
    }

    // 降级：静态规则库
    return keywordFallback(text);
  },

  /**
   * GET /api/triage/hospitals — 医院列表（可选筛选）
   * @param {Object} filters - { keyword, department, level }
   * @returns {Array}
   */
  getHospitals(filters = {}) {
    const { keyword, department, level } = filters;
    let result = HOSPITALS;

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(h =>
        h.name.toLowerCase().includes(kw) ||
        h.address.toLowerCase().includes(kw)
      );
    }

    if (department) {
      result = result.filter(h => h.departments.includes(department));
    }

    if (level) {
      result = result.filter(h => h.level === level);
    }

    // 排序：三甲优先，然后按名称
    const levelOrder = { '三甲': 0, '三乙': 1, '二甲': 2, '二乙': 3, '社区': 4 };
    result.sort((a, b) => (levelOrder[a.level] ?? 9) - (levelOrder[b.level] ?? 9));

    return { list: result, total: result.length };
  },

  /**
   * GET /api/triage/guide/:dept — 科室就诊指南
   * @param {string} dept - 科室名称
   * @returns {Object} { department, guide, commonChecks, prepTips, ... }
   */
  getDepartmentGuide(dept) {
    const guide = DEPARTMENT_GUIDES[dept];
    if (!guide) {
      throw new AppError('TRIAGE_DEPT_NOT_FOUND');
    }

    // 从规则库中找到对应科室的分诊建议文本
    const rule = TRIAGE_RULES.find(r => r.department === dept);
    const triageGuide = rule ? rule.guide : '';

    return {
      department: dept,
      description: guide.description,
      commonChecks: guide.commonChecks,
      prepTips: guide.prepTips,
      triageGuide: triageGuide || '请参考医院分诊台的现场指导'
    };
  },

  /**
   * GET /api/triage/departments — 所有可推荐科室列表
   * @returns {Array<string>}
   */
  getAllDepartments() {
    return ALL_DEPARTMENTS;
  }
};

module.exports = triageService;
