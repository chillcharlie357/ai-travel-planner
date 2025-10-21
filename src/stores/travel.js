import { defineStore } from 'pinia'
import { ref } from 'vue'
import { travelPlanService } from '@/services/supabase'
import { useUserStore } from '@/stores/user'

export const useTravelStore = defineStore('travel', () => {
  const currentPlan = ref(null)
  const planHistory = ref([]) // 本地临时存储的计划
  const savedHistory = ref([]) // 从 Supabase 加载的已保存历史记录
  const isPlanning = ref(false)
  const isLoading = ref(false)
  
  // 设置当前计划（临时存储，不自动保存到历史记录）
  const setPlan = (plan) => {
    currentPlan.value = plan
    // 只添加到本地临时历史，不保存到 Supabase
    if (plan && !planHistory.value.find(p => p.id === plan.id)) {
      planHistory.value.unshift(plan)
    }
  }
  
  // 保存计划到 Supabase 历史记录
  const savePlanToHistory = async (plan) => {
    try {
      const userStore = useUserStore()
      if (!userStore.user) {
        throw new Error('用户未登录')
      }

      isLoading.value = true
      
      // 准备保存到 Supabase 的数据
      const planData = {
        user_id: userStore.user.id,
        title: plan.title || `${plan.destination}${plan.days}日游`,
        destination: plan.destination || '未知目的地',
        summary: plan.summary || '',
        days: plan.days || 1,
        people: plan.people || 1,
        preferences: plan.preferences || '',
        start_date: plan.startDate || null,
        plan_data: {
          itinerary: plan.itinerary || [],
          createdAt: plan.createdAt || new Date().toISOString(),
          input: plan.input || ''
        }
      }

      const savedPlan = await travelPlanService.createPlan(planData)
      
      // 添加到已保存历史记录
      savedHistory.value.unshift(savedPlan)
      
      return savedPlan
    } catch (error) {
      console.error('保存计划失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // 加载用户的历史记录
  const loadSavedHistory = async () => {
    try {
      const userStore = useUserStore()
      if (!userStore.user) {
        savedHistory.value = []
        return
      }

      isLoading.value = true
      const plans = await travelPlanService.getUserPlans(userStore.user.id)
      savedHistory.value = plans
    } catch (error) {
      console.error('加载历史记录失败:', error)
      savedHistory.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // 删除历史记录
  const deleteFromHistory = async (planId) => {
    try {
      isLoading.value = true
      await travelPlanService.deletePlan(planId)
      
      // 从本地状态中移除
      savedHistory.value = savedHistory.value.filter(plan => plan.id !== planId)
    } catch (error) {
      console.error('删除计划失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // 从历史记录加载计划
  const loadPlanFromHistory = (plan) => {
    // 转换 Supabase 数据格式为应用内格式
    const loadedPlan = {
      id: plan.id,
      title: plan.title,
      destination: plan.destination,
      summary: plan.summary,
      days: plan.days,
      people: plan.people,
      preferences: plan.preferences,
      startDate: plan.start_date,
      itinerary: plan.plan_data?.itinerary || [],
      createdAt: plan.created_at,
      input: plan.plan_data?.input || ''
    }
    
    currentPlan.value = loadedPlan
  }
  
  const setPlanning = (status) => {
    isPlanning.value = status
  }
  
  const clearCurrentPlan = () => {
    currentPlan.value = null
  }
  
  // 清空本地临时历史记录
  const clearLocalHistory = () => {
    planHistory.value = []
  }
  
  return {
    currentPlan,
    planHistory,
    savedHistory,
    isPlanning,
    isLoading,
    setPlan,
    savePlanToHistory,
    loadSavedHistory,
    deleteFromHistory,
    loadPlanFromHistory,
    setPlanning,
    clearCurrentPlan,
    clearLocalHistory
  }
})