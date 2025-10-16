import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTravelStore = defineStore('travel', () => {
  const currentPlan = ref(null)
  const planHistory = ref([])
  const isPlanning = ref(false)
  
  const setPlan = (plan) => {
    currentPlan.value = plan
    if (plan) {
      planHistory.value.unshift(plan)
    }
  }
  
  const setPlanning = (status) => {
    isPlanning.value = status
  }
  
  const clearCurrentPlan = () => {
    currentPlan.value = null
  }
  
  return {
    currentPlan,
    planHistory,
    isPlanning,
    setPlan,
    setPlanning,
    clearCurrentPlan
  }
})