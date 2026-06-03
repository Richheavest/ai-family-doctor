<template>
  <div class="home-layout">
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
        <!-- 仪表盘 -->
        <div v-if="activeMenu === 'dashboard'" class="page-card">
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

        <!-- 用户管理 -->
        <div v-else-if="activeMenu === 'users'" class="page-card">
          <h3>👥 用户管理</h3>
          <el-table :data="userList" stripe style="margin-top:16px">
            <el-table-column prop="username" label="账号" />
            <el-table-column prop="real_name" label="姓名" />
            <el-table-column prop="role_id" label="角色">
              <template #default="{ row }">
                <el-tag :type="row.role_id === 3 ? 'danger' : row.role_id === 2 ? 'warning' : 'success'">
                  {{ roleMap[row.role_id] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '正常' : '冻结' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default>
                <el-button size="small">详情</el-button>
                <el-button size="small" type="danger">冻结</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 问诊管理 -->
        <div v-else-if="activeMenu === 'consults'" class="page-card">
          <h3>💬 问诊记录管理</h3>
          <el-empty description="问诊管理功能开发中..." />
        </div>

        <!-- 系统配置 -->
        <div v-else-if="activeMenu === 'config'" class="page-card">
          <h3>🔧 系统配置</h3>
          <el-empty description="系统配置功能开发中..." />
        </div>

        <!-- 日志审计 -->
        <div v-else-if="activeMenu === 'logs'" class="page-card">
          <h3>📝 操作日志审计</h3>
          <el-empty description="日志审计功能开发中..." />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Monitor, User, ChatDotRound, Setting, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

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

const currentTitle = computed(() => {
  const item = menuItems.find(m => m.key === activeMenu.value)
  return item ? item.label : '系统概览'
})

const roleMap = { 1: '普通用户', 2: '家人用户', 3: '管理员' }

const adminStats = [
  { key: 'users', label: '用户总数', value: '4' },
  { key: 'consults', label: '问诊总数', value: '5' },
  { key: 'today', label: '今日问诊', value: '1' },
  { key: 'online', label: '当前在线', value: '1' }
]

// 模拟用户列表
const userList = [
  { username: 'zhangsan', real_name: '张三', role_id: 1, status: 1 },
  { username: 'lisi', real_name: '李四', role_id: 1, status: 1 },
  { username: 'wangwu', real_name: '王五', role_id: 2, status: 1 },
  { username: 'admin', real_name: '系统管理员', role_id: 3, status: 1 }
]

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
