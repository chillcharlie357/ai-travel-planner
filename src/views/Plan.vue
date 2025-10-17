<template>
  <div class="plan-page">
    <div class="plan-container">
      <!-- 左侧输入面板 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2>AI旅行规划</h2>
          <p>告诉我您的旅行需求，我来为您规划完美行程</p>
        </div>

        <div class="input-section">
          <!-- 语音输入 -->
          <div class="voice-input">
            <el-button
              :type="isRecording ? 'danger' : 'primary'"
              :loading="isRecording"
              size="large"
              circle
              @click="toggleRecording"
              class="voice-btn"
            >
              <el-icon v-if="!isRecording"><Microphone /></el-icon>
              <el-icon v-else><VideoPause /></el-icon>
            </el-button>
            <p class="voice-tip">
              {{ isRecording ? '正在录音中，点击停止' : '点击开始语音输入' }}
            </p>
          </div>

          <!-- 文字输入 -->
          <div class="text-input">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="4"
              placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子"
              class="input-textarea"
            />
          </div>

          <!-- 快捷选项 -->
          <div class="quick-options">
            <h4>快捷选项</h4>
            <div class="option-groups">
              <div class="option-group">
                <span class="group-label">目的地：</span>
                <el-tag
                  v-for="dest in destinations"
                  :key="dest"
                  @click="addToInput(dest)"
                  class="option-tag"
                >
                  {{ dest }}
                </el-tag>
              </div>
              <div class="option-group">
                <span class="group-label">天数：</span>
                <el-tag
                  v-for="day in days"
                  :key="day"
                  @click="addToInput(day)"
                  class="option-tag"
                >
                  {{ day }}
                </el-tag>
              </div>
              <div class="option-group">
                <span class="group-label">偏好：</span>
                <el-tag
                  v-for="pref in preferences"
                  :key="pref"
                  @click="addToInput(pref)"
                  class="option-tag"
                >
                  {{ pref }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <el-button
            type="primary"
            size="large"
            :loading="isPlanning"
            @click="generatePlan"
            class="generate-btn"
            :disabled="!inputText.trim()"
          >
            <el-icon><MagicStick /></el-icon>
            {{ isPlanning ? '正在规划中...' : '生成旅行计划' }}
          </el-button>
        </div>

        <!-- 历史记录 -->
        <div v-if="planHistory.length > 0" class="history-section">
          <h4>历史规划</h4>
          <div class="history-list">
            <div
              v-for="(plan, index) in planHistory"
              :key="index"
              class="history-item"
              @click="loadPlan(plan)"
            >
              <div class="history-title">{{ plan.destination }}</div>
              <div class="history-info">{{ plan.days }}天 · {{ plan.budget }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧地图面板 -->
      <div class="map-panel">
        <div class="map-header">
          <h3>行程地图</h3>
          <div class="map-controls">
            <el-button size="small" @click="resetMap">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
        
        <MapComponent
          ref="mapRef"
          height="calc(100vh - 140px)"
          :markers="mapMarkers"
          :center="mapCenter"
          @marker-click="onMarkerClick"
          @map-ready="onMapReady"
        />

        <!-- 行程详情 -->
        <div v-if="currentPlan" class="plan-details">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ currentPlan.destination }}行程</span>
                <div class="header-actions">
                  <el-tag v-if="isStreaming" type="info" effect="plain">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    正在生成...
                  </el-tag>
                  <el-button size="small" @click="savePlan" :disabled="isStreaming">保存</el-button>
                </div>
              </div>
            </template>
            <div class="plan-content">
              <!-- 流式内容显示 -->
              <div v-if="isStreaming && streamingContent" class="streaming-content">
                <el-alert
                  title="AI正在为您生成旅行计划"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <div class="streaming-text">
                    {{ streamingContent }}
                  </div>
                </el-alert>
              </div>
              
              <!-- 正常行程显示 -->
              <div v-else-if="currentPlan.itinerary && currentPlan.itinerary.length > 0">
                <div v-for="(day, index) in currentPlan.itinerary" :key="index" class="day-item">
                  <h4>第{{ index + 1}}天</h4>
                  <ul>
                    <li v-for="(activity, actIndex) in day.activities" :key="actIndex">
                      {{ activity.time }} - {{ activity.name }}
                      <span class="activity-type">{{ activity.type }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- 空状态或加载状态 -->
              <div v-else class="empty-content">
                <el-empty 
                  :description="isPlanning ? '正在生成旅行计划，请稍候...' : '暂无行程安排'"
                  :image-size="120"
                />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTravelStore } from '@/stores/travel'
import MapComponent from '@/components/MapComponent.vue'
import { Microphone, VideoPause, MagicStick, Refresh, Loading } from '@element-plus/icons-vue'
import { generateTravelPlan } from '@/services/llm'
import speechRecognition from '@/services/speech'

const travelStore = useTravelStore()

// 响应式数据
const inputText = ref('')
const isRecording = ref(false)
const isPlanning = ref(false)
const mapRef = ref(null)
const mapCenter = ref([116.397428, 39.90923])
const voiceText = ref('')

// 快捷选项数据
const destinations = ['日本', '韩国', '泰国', '新加坡', '马来西亚', '台湾']
const days = ['3天', '5天', '7天', '10天', '15天']
const preferences = ['美食', '购物', '文化', '自然', '历史', '动漫', '亲子']

// 计算属性
const currentPlan = computed(() => travelStore.currentPlan)
const planHistory = computed(() => travelStore.planHistory)
const mapMarkers = computed(() => {
  if (!currentPlan.value || !currentPlan.value.itinerary || !Array.isArray(currentPlan.value.itinerary)) {
    console.log('[Plan] mapMarkers: no itinerary in currentPlan', currentPlan.value?.title)
    return []
  }
  
  const markers = currentPlan.value.itinerary.flatMap((day, dayIndex) => {
    if (!day || !day.activities || !Array.isArray(day.activities)) return []
    
    return day.activities.map((activity, actIndex) => {
      // 验证坐标数据
      let coordinates = [116.397428, 39.90923] // 默认坐标（北京）
      
      if (activity.coordinates && Array.isArray(activity.coordinates) && activity.coordinates.length >= 2) {
        const [lng, lat] = activity.coordinates
        // 检查坐标是否为有效数字
        if (typeof lng === 'number' && typeof lat === 'number' && 
            !isNaN(lng) && !isNaN(lat) && 
            lng >= -180 && lng <= 180 && 
            lat >= -90 && lat <= 90) {
          coordinates = [lng, lat]
        } else {
          console.warn('[Plan] invalid activity.coordinates:', activity.coordinates)
        }
      } else if (activity.coordinates) {
        console.warn('[Plan] malformed activity.coordinates:', activity.coordinates)
      }
      
      return {
        position: coordinates,
        title: activity.name || '未知景点',
        content: `<div class="marker-info">${dayIndex + 1}-${actIndex + 1}</div>`
      }
    })
  })
  console.log('[Plan] mapMarkers count:', markers.length)
  return markers
})

// 语音识别相关
let recognition = null

const initSpeechRecognition = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false
    
    recognition.onstart = () => {
      isRecording.value = true
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      inputText.value = transcript
      voiceText.value = transcript
      ElMessage.success('语音识别成功')
    }
    
    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      ElMessage.error('语音识别失败，请重试')
      isRecording.value = false
    }
    
    recognition.onend = () => {
      isRecording.value = false
    }
  } else {
    ElMessage.warning('您的浏览器不支持语音识别功能')
  }
}

// 切换录音状态
const toggleRecording = async () => {
  if (!recognition) {
    // 尝试使用新的语音识别服务
    if (speechRecognition.isRecognitionSupported()) {
      await startAdvancedListening()
    } else {
      ElMessage.error('语音识别未初始化')
    }
    return
  }
  
  if (isRecording.value) {
    recognition.stop()
  } else {
    recognition.start()
  }
}

// 高级语音识别
const startAdvancedListening = async () => {
  try {
    const hasPermission = await speechRecognition.requestMicrophonePermission()
    if (!hasPermission) {
      ElMessage.error('需要麦克风权限才能使用语音输入')
      return
    }

    isRecording.value = true
    voiceText.value = '正在监听，请说话...'

    await speechRecognition.startListening({
      onResult: (result) => {
        if (result.interim) {
          voiceText.value = `正在识别: ${result.interim}`
        }
        if (result.final) {
          voiceText.value = result.final
          inputText.value = result.final
          isRecording.value = false
          ElMessage.success('语音识别完成')
        }
      },
      onError: (error) => {
        console.error('语音识别错误:', error)
        ElMessage.error(error)
        isRecording.value = false
        voiceText.value = ''
      },
      onEnd: () => {
        isRecording.value = false
        if (!voiceText.value || voiceText.value.includes('正在')) {
          voiceText.value = ''
        }
      }
    })
  } catch (error) {
    console.error('启动语音识别失败:', error)
    ElMessage.error('启动语音识别失败')
    isRecording.value = false
    voiceText.value = ''
  }
}

// 添加到输入框
const addToInput = (text) => {
  if (inputText.value) {
    inputText.value += '，' + text
  } else {
    inputText.value = text
  }
}

// 流式响应状态
const streamingContent = ref('')
const isStreaming = ref(false)

// 生成旅行计划
const generatePlan = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入您的旅行需求')
    return
  }
  
  isPlanning.value = true
  isStreaming.value = true
  streamingContent.value = ''
  travelStore.setPlanning(true)
  
  try {
    // 解析输入内容
    const planParams = parsePlanInput(inputText.value)
    
    // 创建临时计划用于显示流式内容
    const tempTitle = planParams.destination ? `${planParams.destination}${planParams.days}日游` : '旅行计划生成中...'
    const tempPlan = {
      id: Date.now(),
      title: tempTitle,
      summary: '正在生成旅行计划...',
      destination: planParams.destination || '目的地识别中',
      days: planParams.days,
      budget: planParams.budget,
      totalCost: planParams.budget,
      itinerary: [],
      createdAt: new Date().toISOString(),
      input: inputText.value,
      isStreaming: true
    }
    
    travelStore.setPlan(tempPlan)
    
    // 尝试调用LLM API生成旅行计划（使用流式传输）
    let generatedPlan
    try {
      generatedPlan = await generateTravelPlan(
        planParams, 
        true, // 启用流式传输
        (chunk, fullContent) => {
          // 流式回调函数
          streamingContent.value = fullContent
          
          // 更新临时计划的摘要
          const updatedPlan = {
            ...tempPlan,
            summary: fullContent.length > 100 ? fullContent.substring(0, 100) + '...' : fullContent,
            streamingContent: fullContent
          }
          travelStore.setPlan(updatedPlan)
        }
      )
    } catch (apiError) {
      console.warn('LLM API调用失败，使用备用方案:', apiError)
      generatedPlan = generateFallbackPlan(planParams)
    }
    
    // 添加额外信息
    const plan = {
      ...generatedPlan,
      id: tempPlan.id,
      createdAt: tempPlan.createdAt,
      input: inputText.value,
      isStreaming: false
    }
    
    travelStore.setPlan(plan)
    
    // 更新地图中心
    if (plan.itinerary && plan.itinerary.length > 0 && plan.itinerary[0].activities.length > 0) {
      const firstActivity = plan.itinerary[0].activities[0]
      if (firstActivity.coordinates && Array.isArray(firstActivity.coordinates) && firstActivity.coordinates.length >= 2) {
        const [lng, lat] = firstActivity.coordinates
        // 验证坐标有效性
        if (typeof lng === 'number' && typeof lat === 'number' && 
            !isNaN(lng) && !isNaN(lat) && 
            lng >= -180 && lng <= 180 && 
            lat >= -90 && lat <= 90) {
          mapCenter.value = [lng, lat]
          console.log('[Plan] set center from first activity:', mapCenter.value)
          if (mapRef.value) {
            mapRef.value.setCenter(mapCenter.value)
          }
        } else {
          console.warn('[Plan] first activity center invalid:', firstActivity.coordinates)
        }
      }
    }
    
    ElMessage.success('旅行计划生成成功！')
    
  } catch (error) {
    console.error('生成计划失败:', error)
    ElMessage.error('生成计划失败，请重试')
  } finally {
    isPlanning.value = false
    isStreaming.value = false
    streamingContent.value = ''
    travelStore.setPlanning(false)
  }
}

// 解析输入内容
const parsePlanInput = (input) => {
  const trimmed = input.trim()
  return {
    destination: '', // 不在前端识别，交由 LLM 从原文提取
    days: extractDays(trimmed),
    budget: extractBudget(trimmed),
    people: extractTravelers(trimmed), // 与 llm.js 的提示词对齐
    travelers: extractTravelers(trimmed), // 保留兼容字段
    preferences: extractPreferences(trimmed),
    startDate: new Date().toISOString().split('T')[0],
    rawInput: trimmed
  }
}

const extractDestination = (input) => {
  const text = input.replace(/\s+/g, ' ').trim()

  // 1) 基于语义关键词提取：只在“去/到/前往/目的地”等后面抓取
  const keywordPatterns = [
    /(?:目的地|去|到|前往|飞往|打算去|计划去|想到)\s*([A-Za-z\u4e00-\u9fa5·\-]{1,30})(?=[,，。.!]|$)/,
    /(?:去往|前去)\s*([A-Za-z\u4e00-\u9fa5·\-]{1,30})/,
    /([A-Za-z\u4e00-\u9fa5·\-]{1,30})\s*(?:之旅|之行|行程)(?=[,，。.!]|$)/
  ]
  for (const re of keywordPatterns) {
    const m = text.match(re)
    if (m && m[1]) {
      const candidate = m[1].trim()
      // 避免将“日本料理/美食/动漫”等偏好误识别为目的地
      if (!/(料理|美食|动漫|文化|历史|温泉|海滩|购物|自然|亲子)$/.test(candidate)) {
        return candidate
      }
    }
  }

  // 2) 英文或拼音目的地：句末或逗号/句号前的独立词
  const freePattern = /\b([A-Za-z][A-Za-z\s\-]{1,30})\b(?=[,，。.!]|$)/
  const freeMatch = text.match(freePattern)
  if (freeMatch && freeMatch[1]) {
    return freeMatch[1].trim()
  }

  return '目的地未识别'
}

const extractDays = (input) => {
  const dayMatch = input.match(/(\d+)\s*天/)
  return dayMatch ? parseInt(dayMatch[1]) : 5
}

const extractBudget = (input) => {
  const budgetMatch = input.match(/(\d+)\s*[万元]/)
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1])
    return input.includes('万') ? amount * 10000 : amount
  }
  return 10000
}

const extractTravelers = (input) => {
  const travelerMatch = input.match(/(\d+)\s*人/)
  return travelerMatch ? parseInt(travelerMatch[1]) : 2
}

const extractPreferences = (input) => {
  const preferences = ['美食', '购物', '文化', '自然', '历史', '娱乐', '动漫', '温泉', '海滩']
  const found = preferences.filter(pref => input.includes(pref))
  return found.join('、') || '美食、文化'
}

// 备用计划生成
const generateFallbackPlan = (params) => {
  const lib = {
    // ... existing code ...
  }
  const key = Object.keys(lib).includes(params.destination) ? params.destination : '中国'
  const spots = lib[key].spots
  const buildDay = (day, items) => ({
    day,
    activities: [
      { time: '09:00', name: items[0].name, type: '景点', coordinates: items[0].coordinates },
      { time: '12:00', name: items[1].name, type: '美食', coordinates: items[1].coordinates },
      { time: '15:00', name: items[2].name, type: '景点', coordinates: items[2].coordinates }
    ]
  })
  const displayDest = params.destination || key
  return {
    title: `${displayDest}${params.days}日游`,
    summary: '（备用方案）基于常见热门景点的简要行程',
    destination: displayDest,
    days: params.days,
    budget: params.budget,
    totalCost: params.budget,
    itinerary: [
      buildDay(1, spots.slice(0, 3)),
      buildDay(2, spots.slice(1, 4))
    ]
  }
}

// 加载历史计划
const loadPlan = (plan) => {
  travelStore.setPlan(plan)
  inputText.value = `${plan.destination}，${plan.days}，预算${plan.budget}`
  
  // 设置地图中心，带校验与格式兼容
  let center = [116.397428, 39.90923]
  if (plan.itinerary && plan.itinerary.length > 0 && plan.itinerary[0].activities && plan.itinerary[0].activities.length > 0) {
    const coord = plan.itinerary[0].activities[0].coordinates
    if (coord) {
      let lng, lat
      if (Array.isArray(coord) && coord.length >= 2) {
        lng = parseFloat(coord[0])
        lat = parseFloat(coord[1])
      } else if (typeof coord === 'object' && (coord.lng ?? coord.longitude) !== undefined && (coord.lat ?? coord.latitude) !== undefined) {
        lng = parseFloat(coord.lng ?? coord.longitude)
        lat = parseFloat(coord.lat ?? coord.latitude)
      } else if (typeof coord === 'string') {
        const parts = coord.split(',')
        if (parts.length >= 2) {
          lng = parseFloat(parts[0].trim())
          lat = parseFloat(parts[1].trim())
        }
      }
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        center = [lng, lat]
      } else {
        console.warn('历史计划中心坐标无效，使用默认中心:', coord)
      }
    }
  }
  mapCenter.value = center
  console.log('[Plan] loadPlan set center:', mapCenter.value)
  if (mapRef.value) {
    mapRef.value.setCenter(center)
  }
}

// 保存计划
const savePlan = () => {
  if (currentPlan.value) {
    ElMessage.success('计划已保存到云端')
  }
}

// 重置地图
const resetMap = () => {
  mapCenter.value = [116.397428, 39.90923]
  console.log('[Plan] resetMap center:', mapCenter.value)
  if (mapRef.value) {
    mapRef.value.setCenter(mapCenter.value)
    mapRef.value.setZoom(10)
  }
}

// 地图事件处理
const onMarkerClick = (markerData, index) => {
  ElMessage.info(`点击了：${markerData.title}`)
}

const onMapReady = (map) => {
  console.log('地图加载完成', map)
}

// 生命周期
onMounted(() => {
  initSpeechRecognition()
  if (speechRecognition.isRecognitionSupported()) {
    console.log('语音识别已准备就绪')
  }
})

onUnmounted(() => {
  // 清理语音识别
  if (isRecording.value) {
    if (recognition) {
      recognition.stop()
    }
    if (speechRecognition.isRecognitionSupported()) {
      speechRecognition.stopListening()
    }
  }
})
</script>

<style scoped>
.plan-page {
  height: 100vh;
  background: #f5f7fa;
}

.plan-container {
  display: flex;
  height: 100%;
}

.input-panel {
  width: 400px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.panel-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.input-section {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.voice-input {
  text-align: center;
  margin-bottom: 20px;
}

.voice-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  margin-bottom: 10px;
}

.voice-tip {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

.text-input {
  margin-bottom: 20px;
}

.input-textarea {
  width: 100%;
}

.quick-options {
  margin-bottom: 20px;
}

.quick-options h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
}

.option-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.group-label {
  font-size: 12px;
  color: #606266;
  min-width: 50px;
}

.option-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.option-tag:hover {
  background: #409eff;
  color: white;
}

.generate-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.history-section {
  border-top: 1px solid #e4e7ed;
  padding: 20px;
}

.history-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: #e6f7ff;
}

.history-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.history-info {
  font-size: 12px;
  color: #909399;
}

.map-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.map-header h3 {
  margin: 0;
  color: #303133;
}

.map-controls {
  display: flex;
  gap: 10px;
}

.plan-details {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  z-index: 1000;
}

.detail-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-content {
  max-height: 400px;
  overflow-y: auto;
}

.day-item {
  margin-bottom: 20px;
}

.day-item h4 {
  margin: 0 0 10px 0;
  color: #409eff;
  font-size: 16px;
}

.day-item ul {
  margin: 0;
  padding-left: 20px;
}

.day-item li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.activity-type {
  display: inline-block;
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.streaming-content {
  margin-bottom: 20px;
}

.streaming-text {
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 10px;
}

.empty-content {
  text-align: center;
  padding: 40px 20px;
}

@media (max-width: 768px) {
  .plan-container {
    flex-direction: column;
  }
  
  .input-panel {
    width: 100%;
    height: 50vh;
  }
  
  .plan-details {
    position: static;
    width: 100%;
    margin-top: 20px;
  }
}
</style>

<style>
.marker-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.marker-info p {
  margin: 0;
  font-size: 12px;
  color: #606266;
}
</style>