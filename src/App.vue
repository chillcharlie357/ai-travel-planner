<template>
  <div id="app">
    <el-container class="app-container">
      <el-header v-if="!isAuthPage" class="app-header">
        <div class="header-content">
          <div class="logo">
            <el-icon><Location /></el-icon>
            <span>AI旅行规划师</span>
          </div>
          
          <div class="header-nav">
            <el-menu
              v-if="userStore.isAuthenticated"
              mode="horizontal"
              :default-active="$route.path"
              class="header-menu"
              router
            >
              <el-menu-item index="/">首页</el-menu-item>
              <el-menu-item index="/plan">规划行程</el-menu-item>
              <el-menu-item index="/profile">个人中心</el-menu-item>
            </el-menu>
            
            <div class="user-actions">
              <el-dropdown v-if="userStore.isAuthenticated" @command="handleUserAction">
                <span class="user-info">
                  <el-avatar :size="32" :src="userStore.user?.avatar_url">
                    {{ userStore.user?.name?.charAt(0) || 'U' }}
                  </el-avatar>
                  <span class="username">{{ userStore.user?.name || '用户' }}</span>
                  <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              
              <el-button v-else type="primary" @click="$router.push('/auth')">
                登录 / 注册
              </el-button>
            </div>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main" :class="{ 'no-header': isAuthPage }">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { authService } from '@/services/supabase'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 计算是否为认证页面
const isAuthPage = computed(() => route.path === '/auth')

// 处理用户操作
const handleUserAction = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await authService.signOut()
        userStore.clearUser()
        ElMessage.success('已退出登录')
        router.push('/')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('退出登录失败')
        }
      }
      break
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.logo .el-icon {
  margin-right: 8px;
  font-size: 24px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-menu {
  border-bottom: none;
}

.user-actions {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.app-main {
  padding: 0;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.app-main.no-header {
  height: 100vh;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .header-nav {
    gap: 15px;
  }
  
  .header-menu .el-menu-item {
    padding: 0 10px;
    font-size: 14px;
  }
  
  .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 10px;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .logo .el-icon {
    font-size: 20px;
  }
  
  .header-nav {
    gap: 10px;
  }
  
  .header-menu .el-menu-item {
    padding: 0 8px;
    font-size: 13px;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  height: 100vh;
}
</style>
