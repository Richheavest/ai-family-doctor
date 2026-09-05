<template>
  <div class="home-layout">
    <!-- 侧边栏 -->
    <aside class="home-sidebar">
      <div class="sidebar-logo">🏥 AI家庭医生</div>
      <nav class="sidebar-menu">
        <a
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeMenu === item.key }"
          @click="activeMenu = item.key"
        >
          <el-icon style="margin-right:8px;vertical-align:middle">
            <component :is="item.icon" />
          </el-icon>
          {{ item.label }}
        </a>
      </nav>
    </aside>

    <!-- 主区域 -->
    <div class="home-main">
      <header class="home-header">
        <span class="header-title">{{ currentTitle }}</span>
        <div class="header-user">
          <el-tag type="success" style="margin-right:12px">普通用户</el-tag>
          <span style="margin-right:12px">{{ userStore.realName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </header>

      <main class="home-content">
        <!-- 仪表盘 -->
        <div v-if="activeMenu === 'dashboard'" class="dashboard">
          <el-row :gutter="20">
            <el-col v-for="card in statCards" :key="card.key" :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.label }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-card style="margin-top:20px">
            <template #header>快捷操作</template>
            <el-space wrap>
              <el-button type="primary" @click="activeMenu = 'consult'">🚀 发起AI问诊</el-button>
              <el-button type="success" @click="activeMenu = 'health'">📋 健康档案</el-button>
              <el-button type="warning" @click="activeMenu = 'family'">👨‍👩‍👧‍👦 家庭管理</el-button>
              <el-button @click="activeMenu = 'triage'">🏥 挂号分诊</el-button>
            </el-space>
          </el-card>
        </div>

        <!-- AI问诊 -->
        <div v-else-if="activeMenu === 'consult'" class="page-card consult-page">
          <!-- 问诊列表视图 -->
          <div v-if="!currentConsultId" class="consult-list-view">
            <div class="consult-list-header">
              <h3>🤖 AI智能问诊</h3>
              <el-button type="primary" @click="showNewConsult = true">
                <el-icon style="margin-right:4px"><Plus /></el-icon>发起新问诊
              </el-button>
            </div>
            <p style="color:#909399;margin:8px 0 16px">
              选择历史问诊继续对话，或发起新的AI问诊。本分析仅供参考，不构成诊疗建议。
            </p>

            <!-- 新问诊输入区 -->
            <el-card v-if="showNewConsult" class="new-consult-card" shadow="never">
              <template #header>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span>描述您的症状</span>
                  <el-button text @click="showNewConsult = false">取消</el-button>
                </div>
              </template>
              <el-input
                v-model="symptomInput"
                type="textarea"
                :rows="4"
                placeholder="请详细描述：哪里不舒服？从什么时候开始？有什么诱因？..."
              />
              <div style="margin-top:12px;text-align:right">
                <el-button @click="showNewConsult = false">取消</el-button>
                <el-button type="primary" :loading="consultLoading" @click="startConsult">
                  开始问诊
                </el-button>
              </div>
            </el-card>

            <!-- 历史问诊列表 -->
            <el-table :data="consultList" stripe style="width:100%" v-loading="listLoading">
              <el-table-column prop="consult_id" label="问诊ID" width="80" />
              <el-table-column prop="symptom" label="症状描述" min-width="200" show-overflow-tooltip />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.consult_status === 0 ? 'success' : 'info'" size="small">
                    {{ row.consult_status === 0 ? '进行中' : '已完成' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="start_time" label="开始时间" width="170" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="enterConsult(row)">
                    {{ row.consult_status === 0 ? '继续问诊' : '查看详情' }}
                  </el-button>
                  <el-button
                    v-if="row.consult_status === 0"
                    type="warning"
                    link
                    size="small"
                    @click="handleEndConsult(row.consult_id)"
                  >结束问诊</el-button>
                  <el-button type="danger" link size="small" @click="handleDeleteConsult(row.consult_id)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top:16px;text-align:right">
              <el-pagination
                v-model:current-page="listPage"
                :page-size="10"
                :total="listTotal"
                layout="total, prev, pager, next"
                @current-change="loadConsultList"
              />
            </div>
          </div>

          <!-- 对话视图 -->
          <div v-else class="consult-chat-view">
            <div class="chat-header">
              <el-button text @click="exitConsult">
                <el-icon><ArrowLeft /></el-icon> 返回列表
              </el-button>
              <span class="chat-title">问诊 #{{ currentConsultId }}</span>
              <el-tag v-if="consultStatus === 0" type="success" size="small">进行中</el-tag>
              <el-tag v-else type="info" size="small">已完成</el-tag>
              <div style="flex:1" />
              <el-button
                v-if="consultStatus === 0"
                type="warning"
                size="small"
                @click="handleEndConsult(currentConsultId)"
              >结束问诊</el-button>
            </div>

            <!-- 对话气泡区 -->
            <div class="chat-messages" ref="chatMessagesRef">
              <div
                v-for="(msg, i) in dialogs"
                :key="i"
                class="chat-bubble-row"
                :class="msg.speaker === 1 ? 'row-user' : 'row-ai'"
              >
                <div class="bubble-avatar">{{ msg.speaker === 1 ? '😊' : '🤖' }}</div>
                <div class="bubble-body" :class="msg.speaker === 1 ? 'user-bubble' : 'ai-bubble'">
                  <div class="bubble-content" v-html="formatContent(msg.dialog_content)"></div>
                  <div class="bubble-time">{{ msg.speak_time }}</div>
                </div>
              </div>
              <!-- AI正在输入 -->
              <div v-if="aiTyping" class="chat-bubble-row row-ai">
                <div class="bubble-avatar">🤖</div>
                <div class="bubble-body ai-bubble">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区 -->
            <div v-if="consultStatus === 0" class="chat-input-area">
              <el-input
                v-model="dialogInput"
                type="textarea"
                :rows="2"
                placeholder="请输入您的回复..."
                resize="none"
                @keydown.enter.exact.prevent="sendDialog"
              />
              <el-button
                type="primary"
                :loading="sendLoading"
                :disabled="!dialogInput.trim()"
                @click="sendDialog"
                class="send-btn"
              >
                发送
              </el-button>
            </div>

            <!-- 已结束提示 -->
            <div v-else class="chat-ended-tip">
              <el-divider>问诊已结束</el-divider>
              <div v-if="consultAnalysis.illnessAnalysis" class="analysis-result">
                <el-descriptions title="📋 问诊分析结果" :column="1" border>
                  <el-descriptions-item label="病情分析">
                    {{ consultAnalysis.illnessAnalysis }}
                  </el-descriptions-item>
                  <el-descriptions-item label="就医优先级">
                    <el-tag :type="priorityTagType(consultAnalysis.medicalPriority)">
                      {{ priorityLabel(consultAnalysis.medicalPriority) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="推荐科室">
                    {{ consultAnalysis.recommendDepartment || '—' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="居家护理建议">
                    {{ consultAnalysis.nursingAdvice || '—' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康档案 -->
        <div v-else-if="activeMenu === 'health'" class="page-card">
          <HealthRecord />
        </div>

        <!-- 家庭管理 -->
        <div v-else-if="activeMenu === 'family'" class="page-card">
          <FamilyPage />
        </div>

        <!-- 挂号分诊 -->
        <div v-else-if="activeMenu === 'triage'" class="page-card">
          <TriagePage />
        </div>

        <!-- 个人中心 -->
        <div v-else-if="activeMenu === 'profile'" class="page-card">
          <h3>👤 个人中心</h3>

          <!-- 基本信息 -->
          <el-descriptions :column="2" border style="margin-top:16px">
            <el-descriptions-item label="真实姓名">{{ userStore.realName }}</el-descriptions-item>
            <el-descriptions-item label="登录账号">{{ userStore.username }}</el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag type="success">普通用户</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ userStore.userId }}</el-descriptions-item>
          </el-descriptions>

          <!-- 修改个人信息 -->
          <el-divider />
          <h4>修改个人信息</h4>
          <el-form :model="profileForm" label-width="80px" style="max-width:400px;margin-top:12px">
            <el-form-item label="真实姓名">
              <el-input v-model="profileForm.realName" placeholder="请输入新的真实姓名" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 修改密码 -->
          <el-divider />
          <h4>修改密码</h4>
          <el-form :model="pwdForm" label-width="80px" style="max-width:400px;margin-top:12px">
            <el-form-item label="旧密码">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="输入旧密码" />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="字母+数字，≥8位" />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" :loading="pwdLoading" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 注销账号 -->
          <el-divider />
          <h4 style="color:#f56c6c">危险操作</h4>
          <p style="color:#909399;font-size:13px;margin:8px 0">注销后账号将被冻结，无法登录。如需恢复请联系管理员。</p>
          <el-button type="danger" @click="handleDeactivate">注销账号</el-button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor, ChatDotRound, Document, UserFilled, Guide, Setting,
  Plus, ArrowLeft
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  startConsultAPI,
  sendDialogAPI,
  endConsultAPI,
  getConsultListAPI,
  getConsultDetailAPI,
  deleteConsultAPI
} from '@/api/consult'
import { updateProfileAPI, changePasswordAPI, deactivateAccountAPI } from '@/api/user'
import FamilyPage from '@/views/FamilyPage.vue'
import TriagePage from '@/views/TriagePage.vue'
import HealthRecord from '@/views/HealthRecord.vue'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('dashboard')

const menuItems = [
  { key: 'dashboard', label: '工作台', icon: Monitor },
  { key: 'consult', label: 'AI问诊', icon: ChatDotRound },
  { key: 'health', label: '健康档案', icon: Document },
  { key: 'family', label: '家庭管理', icon: UserFilled },
  { key: 'triage', label: '挂号分诊', icon: Guide },
  { key: 'profile', label: '个人中心', icon: Setting }
]

const currentTitle = computed(() => {
  const item = menuItems.find(m => m.key === activeMenu.value)
  return item ? item.label : '工作台'
})

const statCards = [
  { key: 'consult', label: '问诊次数', value: '0' },
  { key: 'family', label: '家庭成员', value: '2' },
  { key: 'record', label: '健康记录', value: '5' },
  { key: 'alert', label: '异常提醒', value: '0' }
]

// 加载统计数据
async function loadStats() {
  try {
    // 这里需要添加获取问诊次数的API调用
    // 暂时从列表中获取总数
    const data = await getConsultListAPI(1, 100)
    statCards[0].value = (data.total || 0).toString()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// ==================== AI问诊相关 ====================
const showNewConsult = ref(false)
const symptomInput = ref('')
const consultLoading = ref(false)

// 监听symptomInput的变化
watch(symptomInput, (val) => {
  console.log('[symptomInput] 值变化:', val, '类型:', typeof val)
})

// 对话视图
const currentConsultId = ref(null)
const consultStatus = ref(null)
const dialogs = ref([])
const dialogInput = ref('')
const sendLoading = ref(false)
const aiTyping = ref(false)
const chatMessagesRef = ref(null)

// 问诊分析结果（已结束时展示）
const consultAnalysis = ref({})

// 问诊列表
const consultList = ref([])
const listLoading = ref(false)
const listPage = ref(1)
const listTotal = ref(0)

// 切换到问诊菜单时自动加载列表
watch(activeMenu, (val) => {
  if (val === 'consult') {
    currentConsultId.value = null
    // 短暂延迟确保 DOM 更新后再加载
    setTimeout(() => {
      loadConsultList()
    }, 100)
  }
})

// 组件挂载时加载统计数据
onMounted(() => {
  loadStats()
})

// 加载问诊列表
async function loadConsultList() {
  listLoading.value = true
  try {
    console.log('开始加载问诊列表，页码:', listPage.value)
    const data = await getConsultListAPI(listPage.value, 10)
    console.log('问诊列表数据:', data)
    consultList.value = data.list || []
    listTotal.value = data.total || 0
    console.log('问诊列表加载完成，共', consultList.value.length, '条记录')
  } catch (error) {
    console.error('加载问诊列表失败:', error)
    ElMessage.error('加载问诊列表失败')
  } finally {
    listLoading.value = false
  }
}

// 发起新问诊
  async function startConsult() {
    const symptom = symptomInput.value?.toString().trim()
    console.log('[startConsult] symptomInput.value:', symptomInput.value, '类型:', typeof symptomInput.value)
    console.log('[startConsult] 处理后的symptom:', symptom, '类型:', typeof symptom)
    
    if (!symptom) {
      ElMessage.warning('请输入症状描述')
      return
    }
    consultLoading.value = true
    try {
      console.log('[startConsult] 调用API，参数:', { userId: userStore.userId, patientId: userStore.userId, symptom })
      // API 函数签名：startConsultAPI(patientId, symptom)
      const data = await startConsultAPI(userStore.userId, symptom)
      console.log('[startConsult] API返回:', data)
      currentConsultId.value = data.consultId
      consultStatus.value = 0
      dialogs.value = data.dialogList || []
      consultAnalysis.value = data.analysis || {}
      symptomInput.value = ''
      showNewConsult.value = false
      ElMessage.success('问诊发起成功')
      scrollToBottom()
    } catch { /* 拦截器处理 */ }
    consultLoading.value = false
  }

// 进入问诊（继续/查看）
async function enterConsult(row) {
  try {
    const data = await getConsultDetailAPI(row.consult_id)
    currentConsultId.value = data.consultId
    consultStatus.value = data.consultStatus
    dialogs.value = data.dialogList || []
    consultAnalysis.value = {
      illnessAnalysis: data.illnessAnalysis,
      medicalPriority: data.medicalPriority,
      recommendDepartment: data.recommendDepartment,
      nursingAdvice: data.nursingAdvice
    }
    scrollToBottom()
  } catch { /* 拦截器处理 */ }
}

// 退出对话回到列表
function exitConsult() {
  currentConsultId.value = null
  consultStatus.value = null
  dialogs.value = []
  dialogInput.value = ''
  loadConsultList()
}

// 发送对话（多轮）
async function sendDialog() {
  if (!dialogInput.value.trim() || sendLoading.value) return
  const content = dialogInput.value.trim()
  dialogInput.value = ''
  sendLoading.value = true
  aiTyping.value = true

  // 先在界面添加用户消息
  dialogs.value.push({
    speaker: 1,
    dialog_content: content,
    speak_time: new Date().toLocaleString()
  })
  scrollToBottom()

  try {
    const data = await sendDialogAPI(currentConsultId.value, 1, content)
    dialogs.value = data.dialogList || []
    if (data.aiReply) {
      consultAnalysis.value = data.aiReply
    }
    scrollToBottom()
  } catch {
    // 失败时移除用户消息
    dialogs.value.pop()
  }
  aiTyping.value = false
  sendLoading.value = false
}

// 结束问诊
async function handleEndConsult(consultId) {
  try {
    await ElMessageBox.confirm('确定要结束本次问诊吗？结束后AI将生成最终分析报告。', '结束问诊', {
      confirmButtonText: '确定结束',
      cancelButtonText: '继续问诊',
      type: 'warning'
    })
  } catch { return }

  try {
    const data = await endConsultAPI(consultId)
    if (currentConsultId.value === consultId) {
      consultStatus.value = 1
      dialogs.value = data.dialogList || []
      consultAnalysis.value = {
        illnessAnalysis: data.illnessAnalysis,
        medicalPriority: data.medicalPriority,
        recommendDepartment: data.recommendDepartment,
        nursingAdvice: data.nursingAdvice
      }
    }
    ElMessage.success('问诊已结束，可查看分析报告')
  } catch { /* 拦截器处理 */ }
}

// 删除问诊
async function handleDeleteConsult(consultId) {
  try {
    await ElMessageBox.confirm('确定要删除该问诊记录吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'danger'
    })
  } catch { return }

  try {
    await deleteConsultAPI(consultId)
    ElMessage.success('问诊记录已删除')
    if (currentConsultId.value === consultId) {
      exitConsult()
    } else {
      loadConsultList()
    }
  } catch { /* 拦截器处理 */ }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// 格式化内容（换行转<br>）
function formatContent(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\n/g, '<br>')
    .replace(/\r\n/g, '<br>')
}

// 优先级标签
function priorityLabel(val) {
  const map = { 1: '紧急就医', 2: '常规就诊', 3: '居家观察' }
  return map[val] || '—'
}
function priorityTagType(val) {
  const map = { 1: 'danger', 2: 'warning', 3: 'success' }
  return map[val] || 'info'
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// ========== 个人中心 ==========
const profileForm = reactive({ realName: userStore.realName })
const profileLoading = ref(false)

const handleUpdateProfile = async () => {
  if (!profileForm.realName.trim()) {
    ElMessage.warning('姓名不能为空')
    return
  }
  profileLoading.value = true
  try {
    await updateProfileAPI({ realName: profileForm.realName.trim() })
    userStore.realName = profileForm.realName.trim()
    ElMessage.success('个人信息修改成功')
  } catch { /* 拦截器处理 */ }
  finally { profileLoading.value = false }
}

const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)

const handleChangePassword = async () => {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    ElMessage.warning('请填写完整密码信息')
    return
  }
  if (pwdForm.newPassword.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(pwdForm.newPassword)) {
    ElMessage.warning('新密码需包含字母+数字，长度≥8位')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  pwdLoading.value = true
  try {
    await changePasswordAPI(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('密码修改成功，下次登录请使用新密码')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch { /* 拦截器处理 */ }
  finally { pwdLoading.value = false }
}

const handleDeactivate = () => {
  ElMessageBox.prompt('请输入登录密码确认注销', '注销账号', {
    confirmButtonText: '确认注销',
    cancelButtonText: '取消',
    type: 'warning',
    inputType: 'password',
    inputValidator: (val) => val ? true : '密码不能为空'
  }).then(async ({ value }) => {
    try {
      await deactivateAccountAPI(value)
      ElMessage.success('账号已注销')
      userStore.logout()
      router.push('/login')
    } catch { /* 拦截器处理 */ }
  }).catch(() => { /* 用户取消 */ })
}
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.header-user {
  display: flex;
  align-items: center;
}

/* ===== 问诊页面 ===== */
.consult-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}
.consult-list-view {
  flex: 1;
  overflow-y: auto;
}
.consult-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.consult-list-header h3 {
  margin: 0;
}
.new-consult-card {
  margin-bottom: 20px;
  border: 1px dashed #409eff;
}

/* ===== 对话视图 ===== */
.consult-chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}
.chat-title {
  font-weight: bold;
  font-size: 15px;
}

/* 对话消息区 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}
.chat-bubble-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 10px;
}
.row-user {
  flex-direction: row-reverse;
}
.bubble-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: #f0f2f5;
}
.bubble-body {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.7;
  font-size: 14px;
  position: relative;
}
.user-bubble {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-top-right-radius: 4px;
}
.ai-bubble {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-top-left-radius: 4px;
}
.bubble-content {
  word-break: break-word;
}
.bubble-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
  text-align: right;
}

/* AI输入动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: typing 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 输入区 */
.chat-input-area {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  align-items: flex-end;
}
.chat-input-area .el-textarea {
  flex: 1;
}
.send-btn {
  height: 56px;
}

/* 已结束提示 */
.chat-ended-tip {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
.analysis-result {
  margin-top: 8px;
}
</style>
