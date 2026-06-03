<template>
  <div class="home-layout">
    <!-- 侧边栏 -->
    <aside class="home-sidebar">
      <div class="sidebar-logo">⚙️ 管理后台</div>
      <nav class="sidebar-menu">
        <a v-for="item in menuItems" :key="item.key" class="menu-item"
           :class="{ active: activeMenu === item.key }"
           @click="activeMenu = item.key">
          <el-icon style="margin-right:8px;vertical-align:middle">
            <component :is="item.icon" />
          </el-icon>
          {{ item.label }}
        </a>
      </nav>
    </aside>

    <div class="home-main">
      <header class="home-header">
        <span class="header-title">{{ currentTitle }}</span>
        <div class="header-user">
          <el-tag type="danger">管理员</el-tag>
          <span style="margin:0 12px">{{ userStore.realName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <main class="home-content">
        <!-- ==================== 仪表盘 ==================== -->
        <div v-if="activeMenu === 'dashboard'">
          <h3>📊 系统概览</h3>
          <el-row :gutter="20" style="margin-top:16px">
            <el-col v-for="card in adminStats" :key="card.key" :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.label }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- ==================== 用户管理（核心） ==================== -->
        <div v-else-if="activeMenu === 'users'">
          <!-- 搜索栏 -->
          <div class="page-card" style="margin-bottom:12px">
            <el-form :inline="true">
              <el-form-item>
                <el-input v-model="searchKeyword" placeholder="搜索账号/姓名" clearable
                          style="width:220px" @keyup.enter="loadUserList" />
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchRoleId" placeholder="角色筛选" clearable style="width:140px"
                           @change="loadUserList">
                  <el-option label="普通用户" :value="1" />
                  <el-option label="家人用户" :value="2" />
                  <el-option label="管理员" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchStatus" placeholder="状态筛选" clearable style="width:120px"
                           @change="loadUserList">
                  <el-option label="正常" :value="1" />
                  <el-option label="冻结" :value="0" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadUserList">搜索</el-button>
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 用户表格 -->
          <div class="page-card">
            <el-table :data="userList" stripe v-loading="userLoading" style="width:100%">
              <el-table-column prop="user_id" label="ID" width="70" />
              <el-table-column prop="username" label="账号" width="140" />
              <el-table-column prop="real_name" label="姓名" width="100" />
              <el-table-column label="角色" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.role_id === 3 ? 'danger' : row.role_id === 2 ? 'warning' : 'success'">
                    {{ roleMap[row.role_id] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ row.status === 1 ? '正常' : '冻结' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="register_time" label="注册时间" width="170">
                <template #default="{ row }">
                  {{ fmt(row.register_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="last_login_time" label="最后登录" width="170">
                <template #default="{ row }">
                  {{ fmt(row.last_login_time) || '从未登录' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="280" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="openDetail(row)">详情</el-button>
                  <el-button v-if="row.status === 1" size="small" type="warning"
                             @click="toggleStatus(row)">冻结</el-button>
                  <el-button v-else size="small" type="success"
                             @click="toggleStatus(row)">解冻</el-button>
                  <el-dropdown style="margin-left:4px" @command="(cmd) => handleRoleCmd(row, cmd)">
                    <el-button size="small">角色 ▾</el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="1">设为普通用户</el-dropdown-item>
                        <el-dropdown-item command="2">设为家人用户</el-dropdown-item>
                        <el-dropdown-item command="3">设为管理员</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button size="small" @click="openResetPwd(row)">重置密码</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              style="margin-top:16px;justify-content:flex-end"
              @current-change="loadUserList"
            />
          </div>
        </div>

        <!-- 其他菜单占位 -->
        <div v-else class="page-card">
          <el-empty :description="currentTitle + '功能开发中...'" />
        </div>
      </main>
    </div>

    <!-- ==================== 用户详情弹窗 ==================== -->
    <el-dialog v-model="detailVisible" title="用户详情" width="500px">
      <el-descriptions v-if="detailUser" :column="2" border>
        <el-descriptions-item label="用户ID">{{ detailUser.userId }}</el-descriptions-item>
        <el-descriptions-item label="登录账号">{{ detailUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detailUser.realName }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailUser.idCard || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="detailUser.roleId===3?'danger':detailUser.roleId===2?'warning':'success'">
            {{ roleMap[detailUser.roleId] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailUser.status===1?'success':'danger'">
            {{ detailUser.status === 1 ? '正常' : '冻结' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ fmt(detailUser.registerTime) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ fmt(detailUser.lastLoginTime) || '从未登录' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录IP">{{ detailUser.lastLoginIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="家庭成员">{{ detailUser.stats?.familyCount ?? 0 }}人</el-descriptions-item>
        <el-descriptions-item label="问诊次数">{{ detailUser.stats?.consultCount ?? 0 }}次</el-descriptions-item>
        <el-descriptions-item label="体征记录">{{ detailUser.stats?.signCount ?? 0 }}条</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- ==================== 重置密码弹窗 ==================== -->
    <el-dialog v-model="pwdVisible" title="重置密码" width="380px">
      <el-form>
        <el-form-item label="目标用户">
          <el-tag>{{ pwdTarget?.real_name }} ({{ pwdTarget?.username }})</el-tag>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPwd" type="password" show-password
                    placeholder="字母+数字，≥8位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="handleResetPwd">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, User, ChatDotRound, Setting, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getUserListAPI, getUserDetailAPI, updateUserStatusAPI, updateUserRoleAPI, resetUserPasswordAPI, getStatisticsAPI } from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('dashboard')

const menuItems = [
  { key: 'dashboard', label: '系统概览', icon: Monitor },
  { key: 'users', label: '用户管理', icon: User },
  { key: 'consults', label: '问诊管理', icon: ChatDotRound },
  { key: 'config', label: '系统配置', icon: Setting },
  { key: 'logs', label: '日志审计', icon: Document }
]

const currentTitle = computed(() => menuItems.find(m => m.key === activeMenu.value)?.label || '')
const roleMap = { 1: '普通用户', 2: '家人用户', 3: '管理员' }
const fmt = (t) => t ? new Date(t).toLocaleString('zh-CN') : ''

// ========== 仪表盘 ==========
const adminStats = ref([
  { key: 'users', label: '用户总数', value: 0 },
  { key: 'consults', label: '问诊总数', value: 0 },
  { key: 'admins', label: '管理员数', value: 0 },
  { key: 'frozen', label: '冻结用户', value: 0 }
])

const loadStats = async () => {
  try {
    const data = await getStatisticsAPI()
    adminStats.value[0].value = data.userCount ?? 0
    adminStats.value[1].value = data.consultCount ?? 0
    adminStats.value[2].value = data.adminCount ?? 0
    adminStats.value[3].value = data.frozenCount ?? 0
  } catch { /* */ }
}

// ========== 用户管理 ==========
const userList = ref([])
const userLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')
const searchRoleId = ref(null)
const searchStatus = ref(null)

const loadUserList = async () => {
  userLoading.value = true
  try {
    const data = await getUserListAPI({
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      roleId: searchRoleId.value,
      status: searchStatus.value
    })
    userList.value = data.list
    total.value = data.total
  } catch { userList.value = [] }
  finally { userLoading.value = false }
}

const resetSearch = () => {
  searchKeyword.value = ''
  searchRoleId.value = null
  searchStatus.value = null
  page.value = 1
  loadUserList()
}

// ========== 冻结/解冻 ==========
const toggleStatus = async (row) => {
  const action = row.status === 1 ? '冻结' : '解冻'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.real_name}」吗？`, `${action}确认`, { type: 'warning' })
  } catch { return }
  try {
    await updateUserStatusAPI(row.user_id, row.status === 1 ? 0 : 1)
    ElMessage.success(`${action}成功`)
    loadUserList()
  } catch { /* */ }
}

// ========== 修改角色 ==========
const handleRoleCmd = async (row, roleId) => {
  if (roleId === row.role_id) { ElMessage.info('角色未变更'); return }
  try {
    await ElMessageBox.confirm(
      `确定将「${row.real_name}」的角色改为「${roleMap[roleId]}」吗？`,
      '修改角色', { type: 'warning' })
  } catch { return }
  try {
    await updateUserRoleAPI(row.user_id, roleId)
    ElMessage.success('角色修改成功')
    loadUserList()
  } catch { /* */ }
}

// ========== 用户详情 ==========
const detailVisible = ref(false)
const detailUser = ref(null)

const openDetail = async (row) => {
  try {
    detailUser.value = await getUserDetailAPI(row.user_id)
    detailVisible.value = true
  } catch { /* */ }
}

// ========== 重置密码 ==========
const pwdVisible = ref(false)
const pwdTarget = ref(null)
const newPwd = ref('')
const pwdLoading = ref(false)

const openResetPwd = (row) => {
  pwdTarget.value = row
  newPwd.value = 'Aa123456'
  pwdVisible.value = true
}

const handleResetPwd = async () => {
  if (!newPwd.value || newPwd.value.length < 8) {
    ElMessage.warning('密码长度不少于8位，需包含字母+数字')
    return
  }
  pwdLoading.value = true
  try {
    await resetUserPasswordAPI(pwdTarget.value.user_id, newPwd.value)
    ElMessage.success(`${pwdTarget.value.real_name} 的密码已重置为 ${newPwd.value}`)
    pwdVisible.value = false
  } catch { /* */ }
  finally { pwdLoading.value = false }
}

// ========== 初始化 ==========
onMounted(() => {
  loadStats()
  loadUserList()
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-value { font-size: 32px; font-weight: bold; color: #e6a23c; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.header-title { font-size: 16px; font-weight: bold; }
.header-user { display: flex; align-items: center; }
</style>
