<template>
  <div class="home-layout">
    <aside class="home-sidebar">
      <div class="sidebar-logo">🏥 AI家庭医生</div>
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
          <el-tag type="warning" style="margin-right:12px">家人用户</el-tag>
          <span style="margin-right:12px">{{ userStore.realName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <main class="home-content">
        <div v-if="activeMenu === 'dashboard'" class="page-card">
          <h3>📊 我的健康</h3>
          <el-row :gutter="20" style="margin-top:16px">
            <el-col v-for="card in statCards" :key="card.key" :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.label }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-else-if="activeMenu === 'health'" class="page-card">
          <h3>📋 我的健康档案（只读）</h3>
          <el-empty description="健康档案功能开发中..." />
        </div>

        <div v-else-if="activeMenu === 'consult'" class="page-card">
          <h3>💬 我的问诊记录</h3>
          <el-empty description="问诊记录功能开发中..." />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Monitor, Document, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('dashboard')

const menuItems = [
  { key: 'dashboard', label: '工作台', icon: Monitor },
  { key: 'health', label: '健康档案', icon: Document },
  { key: 'consult', label: '问诊记录', icon: ChatDotRound }
]

const currentTitle = computed(() => {
  const item = menuItems.find(m => m.key === activeMenu.value)
  return item ? item.label : '工作台'
})

const statCards = [
  { key: 'consult', label: '被代问诊次数', value: '1' },
  { key: 'record', label: '健康记录', value: '3' },
  { key: 'alert', label: '体征数据', value: '2' },
  { key: 'status', label: '状态', value: '正常' }
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
