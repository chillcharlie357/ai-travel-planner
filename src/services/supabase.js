import { createClient } from '@supabase/supabase-js'
import { config } from '@/config'

// 创建Supabase客户端
const supabase = createClient(config.supabase.url, config.supabase.anonKey)

/**
 * 用户认证服务
 */
export const authService = {
  /**
   * 用户注册
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @param {Object} metadata - 用户元数据
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('用户注册失败:', error)
      throw new Error(error.message || '注册失败')
    }
  },

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('用户登录失败:', error)
      throw new Error(error.message || '登录失败')
    }
  },

  /**
   * 用户登出
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('用户登出失败:', error)
      throw new Error(error.message || '登出失败')
    }
  },

  /**
   * 获取当前用户
   * @returns {Object|null} 用户对象或null
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      // 在开发环境中，如果没有有效的Supabase配置，返回null而不是抛出错误
      if (error.message?.includes('Auth session missing') || error.message?.includes('Invalid supabaseUrl')) {
        return null
      }
      console.error('获取当前用户失败:', error)
      return null
    }
  },

  /**
   * 重置密码
   * @param {string} email - 邮箱
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      console.error('重置密码失败:', error)
      throw new Error(error.message || '重置密码失败')
    }
  },

  /**
   * 监听认证状态变化
   * @param {Function} callback - 回调函数
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

/**
 * 用户资料服务
 */
export const profileService = {
  /**
   * 获取用户资料
   * @param {string} userId - 用户ID
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw new Error(error.message || '获取用户资料失败')
    }
  },

  /**
   * 更新用户资料
   * @param {string} userId - 用户ID
   * @param {Object} profile - 用户资料
   */
  async updateProfile(userId, profile) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profile,
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('更新用户资料失败:', error)
      throw new Error(error.message || '更新用户资料失败')
    }
  },

  /**
   * 上传头像
   * @param {string} userId - 用户ID
   * @param {File} file - 头像文件
   */
  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('上传头像失败:', error)
      throw new Error(error.message || '上传头像失败')
    }
  }
}

/**
 * 旅行计划服务
 */
export const travelPlanService = {
  /**
   * 创建旅行计划
   * @param {Object} plan - 旅行计划
   */
  async createPlan(plan) {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .insert({
          ...plan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('创建旅行计划失败:', error)
      throw new Error(error.message || '创建旅行计划失败')
    }
  },

  /**
   * 获取用户的旅行计划列表
   * @param {string} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserPlans(userId, options = {}) {
    try {
      let query = supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取旅行计划列表失败:', error)
      throw new Error(error.message || '获取旅行计划列表失败')
    }
  },

  /**
   * 获取旅行计划详情
   * @param {string} planId - 计划ID
   */
  async getPlan(planId) {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取旅行计划详情失败:', error)
      throw new Error(error.message || '获取旅行计划详情失败')
    }
  },

  /**
   * 更新旅行计划
   * @param {string} planId - 计划ID
   * @param {Object} updates - 更新内容
   */
  async updatePlan(planId, updates) {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('更新旅行计划失败:', error)
      throw new Error(error.message || '更新旅行计划失败')
    }
  },

  /**
   * 删除旅行计划
   * @param {string} planId - 计划ID
   */
  async deletePlan(planId) {
    try {
      const { error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
    } catch (error) {
      console.error('删除旅行计划失败:', error)
      throw new Error(error.message || '删除旅行计划失败')
    }
  },

  /**
   * 分享旅行计划
   * @param {string} planId - 计划ID
   * @param {boolean} isPublic - 是否公开
   */
  async sharePlan(planId, isPublic = true) {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .update({
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('分享旅行计划失败:', error)
      throw new Error(error.message || '分享旅行计划失败')
    }
  }
}

/**
 * 收藏服务
 */
export const favoriteService = {
  /**
   * 添加收藏
   * @param {string} userId - 用户ID
   * @param {string} itemId - 项目ID
   * @param {string} itemType - 项目类型 (plan, place, etc.)
   */
  async addFavorite(userId, itemId, itemType) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('添加收藏失败:', error)
      throw new Error(error.message || '添加收藏失败')
    }
  },

  /**
   * 移除收藏
   * @param {string} userId - 用户ID
   * @param {string} itemId - 项目ID
   * @param {string} itemType - 项目类型
   */
  async removeFavorite(userId, itemId, itemType) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)

      if (error) throw error
    } catch (error) {
      console.error('移除收藏失败:', error)
      throw new Error(error.message || '移除收藏失败')
    }
  },

  /**
   * 获取用户收藏列表
   * @param {string} userId - 用户ID
   * @param {string} itemType - 项目类型
   */
  async getUserFavorites(userId, itemType = null) {
    try {
      let query = supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (itemType) {
        query = query.eq('item_type', itemType)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      throw new Error(error.message || '获取收藏列表失败')
    }
  }
}

/**
 * 实时订阅服务
 */
export const realtimeService = {
  /**
   * 订阅旅行计划变化
   * @param {string} planId - 计划ID
   * @param {Function} callback - 回调函数
   */
  subscribeToPlan(planId, callback) {
    return supabase
      .channel(`travel_plan_${planId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'travel_plans',
        filter: `id=eq.${planId}`
      }, callback)
      .subscribe()
  },

  /**
   * 取消订阅
   * @param {Object} subscription - 订阅对象
   */
  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}

export { supabase }
export default supabase