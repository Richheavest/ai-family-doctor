// src/router/index.js — 路由配置
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录 - AI家庭医生' }
  },
  {
    path: '/home/user',
    name: 'UserHome',
    component: () => import('@/views/UserHome.vue'),
    meta: { title: '用户主页', role: [1] }
  },
  {
    path: '/home/family',
    name: 'FamilyHome',
    component: () => import('@/views/FamilyHome.vue'),
    meta: { title: '家庭主页', role: [2] }
  },
  {
    path: '/home/admin',
    name: 'AdminHome',
    component: () => import('@/views/AdminHome.vue'),
    meta: { title: '管理后台', role: [3] }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ========== 路由守卫：未登录跳登录，角色不对跳对应主页 ==========
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'AI家庭医生问诊系统'

  const userStore = useUserStore()

  // 访问登录页：已登录则跳到对应主页
  if (to.path === '/login') {
    if (userStore.isLoggedIn) {
      const homeMap = { 1: '/home/user', 2: '/home/family', 3: '/home/admin' }
      return next(homeMap[userStore.roleId] || '/login')
    }
    return next()
  }

  // 访问其他页面：未登录跳登录
  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  // 角色权限检查
  const allowedRoles = to.meta.role
  if (allowedRoles && !allowedRoles.includes(userStore.roleId)) {
    const homeMap = { 1: '/home/user', 2: '/home/family', 3: '/home/admin' }
    return next(homeMap[userStore.roleId] || '/login')
  }

  next()
})

export default router
