<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <h2>个人中心</h2>
        <p>管理您的个人信息和旅行偏好</p>
      </div>

      <div class="profile-content">
        <el-row :gutter="20">
          <!-- 用户信息卡片 -->
          <el-col :span="8">
            <el-card class="user-card">
              <div class="user-avatar">
                <el-avatar :size="80" :src="userInfo.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <el-button class="avatar-upload" size="small" circle>
                  <el-icon><Camera /></el-icon>
                </el-button>
              </div>
              <div class="user-info">
                <h3>{{ userInfo.name || '未设置姓名' }}</h3>
                <p>{{ userInfo.email || '未设置邮箱' }}</p>
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ userStats.totalTrips }}</span>
                    <span class="stat-label">总行程</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ userStats.totalDays }}</span>
                    <span class="stat-label">旅行天数</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ userStats.visitedCities }}</span>
                    <span class="stat-label">访问城市</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 个人信息表单 -->
          <el-col :span="16">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>个人信息</span>
                  <el-button 
                    v-if="!isEditing" 
                    size="small" 
                    @click="startEdit"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <div v-else>
                    <el-button size="small" @click="cancelEdit">取消</el-button>
                    <el-button size="small" type="primary" @click="saveProfile">保存</el-button>
                  </div>
                </div>
              </template>
              
              <el-form :model="profileForm" label-width="100px" :disabled="!isEditing">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="姓名">
                      <el-input v-model="profileForm.name" placeholder="请输入姓名" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="邮箱">
                      <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="手机号">
                      <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="生日">
                      <el-date-picker 
                        v-model="profileForm.birthday" 
                        type="date" 
                        placeholder="请选择生日"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item label="所在城市">
                  <el-input v-model="profileForm.city" placeholder="请输入所在城市" />
                </el-form-item>
                
                <el-form-item label="个人简介">
                  <el-input 
                    v-model="profileForm.bio" 
                    type="textarea" 
                    :rows="3"
                    placeholder="介绍一下自己吧..."
                  />
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>

        <!-- 旅行偏好设置 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>旅行偏好</span>
              </template>
              
              <el-form :model="preferencesForm" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="住宿偏好">
                      <el-select v-model="preferencesForm.accommodation" style="width: 100%">
                        <el-option label="青年旅社" value="hostel" />
                        <el-option label="经济酒店" value="budget_hotel" />
                        <el-option label="商务酒店" value="business_hotel" />
                        <el-option label="豪华酒店" value="luxury_hotel" />
                        <el-option label="民宿/公寓" value="apartment" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="交通偏好">
                      <el-checkbox-group v-model="preferencesForm.transportation">
                        <el-checkbox label="飞机">飞机</el-checkbox>
                        <el-checkbox label="高铁">高铁</el-checkbox>
                        <el-checkbox label="汽车">汽车</el-checkbox>
                        <el-checkbox label="公共交通">公共交通</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="旅行类型">
                      <el-checkbox-group v-model="preferencesForm.travelTypes">
                        <el-checkbox label="文化历史">文化历史</el-checkbox>
                        <el-checkbox label="自然风光">自然风光</el-checkbox>
                        <el-checkbox label="美食体验">美食体验</el-checkbox>
                        <el-checkbox label="购物娱乐">购物娱乐</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item label="兴趣爱好">
                  <el-tag
                    v-for="tag in preferencesForm.interests"
                    :key="tag"
                    closable
                    @close="removeInterest(tag)"
                    style="margin-right: 10px; margin-bottom: 10px;"
                  >
                    {{ tag }}
                  </el-tag>
                  <el-input
                    v-if="inputVisible"
                    ref="inputRef"
                    v-model="inputValue"
                    size="small"
                    style="width: 100px;"
                    @keyup.enter="handleInputConfirm"
                    @blur="handleInputConfirm"
                  />
                  <el-button v-else size="small" @click="showInput">
                    <el-icon><Plus /></el-icon>
                    添加兴趣
                  </el-button>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="savePreferences">保存偏好设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>

        <!-- 旅行历史 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>旅行历史</span>
              </template>
              
              <el-timeline>
                <el-timeline-item
                  v-for="trip in travelHistory"
                  :key="trip.id"
                  :timestamp="trip.date"
                  placement="top"
                >
                  <el-card class="trip-card">
                    <div class="trip-info">
                      <h4>{{ trip.destination }}</h4>
                      <p>{{ trip.description }}</p>
                      <div class="trip-meta">
                        <el-tag size="small">{{ trip.duration }}天</el-tag>
                        <el-tag size="small" type="info">{{ trip.companions }}人</el-tag>
                      </div>
                    </div>
                    <div class="trip-actions">
                      <el-button size="small" @click="viewTripDetails(trip)">查看详情</el-button>
                      <el-button size="small" type="primary" @click="copyTrip(trip)">复制行程</el-button>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { User, Camera, Edit, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 响应式数据
const isEditing = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref(null)

const userInfo = ref({
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: ''
})

const userStats = ref({
  totalTrips: 12,
  totalDays: 85,
  visitedCities: 28
})

const profileForm = reactive({
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '138****8888',
  birthday: new Date('1990-01-01'),
  city: '北京',
  bio: '热爱旅行，喜欢探索世界各地的美食和文化。'
})

const preferencesForm = reactive({
  accommodation: 'business_hotel',
  transportation: ['飞机', '高铁'],
  travelTypes: ['文化历史', '美食体验'],
  interests: ['摄影', '美食', '历史', '建筑']
})

const travelHistory = ref([
  {
    id: 1,
    destination: '日本东京',
    description: '樱花季的东京之旅，体验了传统文化和现代都市的完美融合',
    date: '2024-03-15',
    duration: 7,
    companions: 2
  },
  {
    id: 2,
    destination: '泰国普吉岛',
    description: '海岛度假，享受阳光沙滩和美味海鲜',
    date: '2023-12-20',
    duration: 5,
    companions: 4
  },
  {
    id: 3,
    destination: '法国巴黎',
    description: '浪漫之都，参观了卢浮宫、埃菲尔铁塔等著名景点',
    date: '2023-09-10',
    duration: 8,
    companions: 2
  }
])

// 方法
const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  // 重置表单数据
  Object.assign(profileForm, {
    name: userInfo.value.name,
    email: userInfo.value.email,
    phone: '138****8888',
    birthday: new Date('1990-01-01'),
    city: '北京',
    bio: '热爱旅行，喜欢探索世界各地的美食和文化。'
  })
}

const saveProfile = () => {
  // 保存个人信息
  userInfo.value.name = profileForm.name
  userInfo.value.email = profileForm.email
  
  isEditing.value = false
  ElMessage.success('个人信息已保存')
}

const savePreferences = () => {
  // 保存偏好设置
  ElMessage.success('偏好设置已保存')
}

const removeInterest = (tag) => {
  const index = preferencesForm.interests.indexOf(tag)
  if (index > -1) {
    preferencesForm.interests.splice(index, 1)
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !preferencesForm.interests.includes(inputValue.value)) {
    preferencesForm.interests.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const viewTripDetails = (trip) => {
  ElMessage.info(`查看 ${trip.destination} 行程详情`)
}

const copyTrip = (trip) => {
  ElMessage.success(`已复制 ${trip.destination} 行程模板`)
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 30px;
}

.profile-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
}

.profile-header p {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.user-card {
  text-align: center;
  height: fit-content;
}

.user-avatar {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #409EFF;
  color: white;
  border: 2px solid white;
}

.user-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
}

.user-info p {
  margin: 0 0 20px 0;
  color: #909399;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-card {
  margin-bottom: 0;
}

.trip-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.trip-info {
  flex: 1;
}

.trip-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.trip-info p {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.trip-meta {
  display: flex;
  gap: 8px;
}

.trip-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 10px;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .trip-card :deep(.el-card__body) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .trip-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>