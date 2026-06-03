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
        <div v-else-if="activeMenu === 'consult'" class="page-card">
          <h3>🤖 AI智能问诊</h3>
          <p style="color:#909399;margin:8px 0 16px">
            请描述您的症状，AI将为您进行引导式问诊。本分析仅供参考，不构成诊疗建议。
          </p>
          <!-- 症状输入区 -->
          <el-input
            v-model="symptomInput"
            type="textarea"
            :rows="4"
            placeholder="请详细描述：哪里不舒服？从什么时候开始？有什么诱因？..."
          />
          <el-button type="primary" style="margin-top:12px" @click="startConsult">
            发起问诊
          </el-button>

          <!-- 对话区 -->
          <div v-if="dialogs.length" class="consult-dialog-box">
            <div
              v-for="(msg, i) in dialogs"
              :key="i"
              class="dialog-bubble"
              :class="msg.speaker === 1 ? 'user-bubble' : 'ai-bubble'"
            >
              <strong>{{ msg.speaker === 1 ? '我' : '🤖 AI医生' }}：</strong>
              {{ msg.dialog_content }}
            </div>
          </div>
        </div>

        <!-- 健康档案 -->
        <div v-else-if="activeMenu === 'health'" class="page-card">
          <h3>📋 健康档案</h3>
          <el-empty description="健康档案功能开发中..." />
        </div>

        <!-- 家庭管理 -->
        <div v-else-if="activeMenu === 'family'" class="page-card">
          <FamilyPage />
        </div>

        <!-- 挂号分诊 -->
        <div v-else-if="activeMenu === 'triage'" class="page-card">
          <h3>🏥 挂号分诊指导</h3>
          <el-empty description="挂号分诊功能开发中..." />
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Monitor, ChatDotRound, Document, UserFilled, Guide, Setting
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { startConsultAPI } from '@/api/consult'
import { updateProfileAPI, changePasswordAPI, deactivateAccountAPI } from '@/api/user'
import FamilyPage from '@/views/FamilyPage.vue'

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
  { key: 'consult', label: '问诊次数', value: '3' },
  { key: 'family', label: '家庭成员', value: '2' },
  { key: 'record', label: '健康记录', value: '5' },
  { key: 'alert', label: '异常提醒', value: '0' }
]

// AI问诊
const symptomInput = ref('')
const dialogs = ref([])

const startConsult = async () => {
  if (!symptomInput.value.trim()) {
    ElMessage.warning('请输入症状描述')
    return
  }
  try {
    const data = await startConsultAPI(userStore.userId, symptomInput.value)
    dialogs.value = data.dialogList || []
    symptomInput.value = ''
    ElMessage.success('问诊发起成功')
  } catch { /* 拦截器处理 */ }
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
.consult-dialog-box {
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}
.dialog-bubble {
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 8px;
  line-height: 1.6;
}
.user-bubble {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}
.ai-bubble {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
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
</style>
