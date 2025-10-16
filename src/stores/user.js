import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  const setUser = (userData) => {
    user.value = userData
  }
  
  const clearUser = () => {
    user.value = null
  }
  
  // 兼容旧的方法名
  const logout = () => {
    clearUser()
  }
  
  return {
    user,
    isAuthenticated,
    setUser,
    clearUser,
    logout
  }
})