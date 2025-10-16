<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <el-icon><Location /></el-icon>
            <span>AI旅行规划师</span>
          </div>
          <h2>{{ isLogin ? '登录' : '注册' }}</h2>
          <p>{{ isLogin ? '欢迎回来，开始您的旅行规划' : '创建账户，开启智能旅行体验' }}</p>
        </div>

        <div class="auth-form">
          <el-form 
            :model="authForm" 
            :rules="authRules" 
            ref="authFormRef"
            label-position="top"
            size="large"
          >
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="authForm.email" 
                type="email"
                placeholder="请输入邮箱地址"
                prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="authForm.password" 
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item 
              v-if="!isLogin" 
              label="确认密码" 
              prop="confirmPassword"
            >
              <el-input 
                v-model="authForm.confirmPassword" 
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item v-if="!isLogin" label="姓名" prop="name">
              <el-input 
                v-model="authForm.name" 
                placeholder="请输入您的姓名"
                prefix-icon="User"
              />
            </el-form-item>

            <div class="auth-actions">
              <el-button 
                type="primary" 
                size="large"
                :loading="loading"
                @click="handleAuth"
                style="width: 100%"
              >
                {{ loading ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册') }}
              </el-button>
            </div>

            <div class="auth-footer">
              <el-button 
                type="text" 
                @click="toggleAuthMode"
                style="width: 100%"
              >
                {{ isLogin ? '没有账户？立即注册' : '已有账户？立即登录' }}
              </el-button>
              
              <el-button 
                v-if="isLogin"
                type="text" 
                @click="showResetDialog = true"
                style="margin-top: 10px; width: 100%"
              >
                忘记密码？
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog 
      v-model="showResetDialog" 
      title="重置密码" 
      width="400px"
    >
      <el-form :model="resetPasswordForm" label-width="80px">
        <el-form-item label="邮箱">
          <el-input 
            v-model="resetPasswordForm.email" 
            type="email"
            placeholder="请输入注册邮箱"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleResetPassword"
          :loading="resetLoading"
        >
          发送重置邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { authService } from '@/services/supabase'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const isLogin = ref(true)
const loading = ref(false)
const resetLoading = ref(false)
const showResetDialog = ref(false)
const authFormRef = ref(null)

const authForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
})

const resetPasswordForm = reactive({
  email: ''
})

// 表单验证规则
const authRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== authForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2位', trigger: 'blur' }
  ]
}

// 方法
const toggleAuthMode = () => {
  isLogin.value = !isLogin.value
  clearAuthForm()
}

const clearAuthForm = () => {
  authForm.email = ''
  authForm.password = ''
  authForm.confirmPassword = ''
  authForm.name = ''
  authFormRef.value?.clearValidate()
}

const handleAuth = async () => {
  try {
    const valid = await authFormRef.value.validate()
    if (!valid) return

    loading.value = true

    if (isLogin.value) {
      // 登录
      const { user } = await authService.signIn(authForm.email, authForm.password)
      userStore.setUser(user)
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      // 注册
      const { user } = await authService.signUp(
        authForm.email, 
        authForm.password,
        { name: authForm.name }
      )
      
      if (user) {
        ElMessage.success('注册成功，请查看邮箱验证链接')
        isLogin.value = true
        clearAuthForm()
      }
    }
  } catch (error) {
    ElMessage.error(error.message || (isLogin.value ? '登录失败' : '注册失败'))
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetPasswordForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }

  try {
    resetLoading.value = true
    await authService.resetPassword(resetPasswordForm.email)
    ElMessage.success('重置邮件已发送，请查看邮箱')
    showResetDialog.value = false
    resetPasswordForm.email = ''
  } catch (error) {
    ElMessage.error(error.message || '发送重置邮件失败')
  } finally {
    resetLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 20px;
}

.logo .el-icon {
  margin-right: 8px;
  font-size: 28px;
}

.auth-header h2 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 28px;
}

.auth-header p {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.auth-form {
  margin-bottom: 20px;
}

.auth-actions {
  margin: 30px 0 20px;
}

.auth-footer {
  text-align: center;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-input__inner) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-header h2 {
    font-size: 24px;
  }
}
</style>