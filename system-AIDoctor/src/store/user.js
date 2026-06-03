// src/store/user.js — Pinia 用户状态管理（持久化存储）
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userId: null,
    roleId: null,
    username: '',
    realName: ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    roleName: (state) => {
      const map = { 1: '普通用户', 2: '家人用户', 3: '管理员' }
      return map[state.roleId] || '未知'
    },
    isAdmin: (state) => state.roleId === 3,
    isFamilyUser: (state) => state.roleId === 2
  },

  actions: {
    setUser(token, userInfo) {
      this.token = token
      this.userId = userInfo.userId
      this.roleId = userInfo.roleId
      this.username = userInfo.username
      this.realName = userInfo.realName
      localStorage.setItem('token', token)
    },

    logout() {
      this.token = ''
      this.userId = null
      this.roleId = null
      this.username = ''
      this.realName = ''
      localStorage.removeItem('token')
    }
  },

  // 持久化：刷新不丢失
  persist: {
    key: 'user-store',
    storage: localStorage,
    pick: ['token', 'userId', 'roleId', 'username', 'realName']
  }
})
