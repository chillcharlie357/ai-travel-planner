<template>
  <div class="voice-input">
    <!-- 语音输入按钮 -->
    <el-button
      :type="isListening ? 'danger' : 'primary'"
      :icon="isListening ? 'Microphone' : 'Microphone'"
      circle
      size="large"
      @click="toggleListening"
      :loading="isInitializing"
      class="voice-button"
    >
    </el-button>
    
    <!-- 语音状态提示 -->
    <div class="voice-status" v-if="isListening || transcript">
      <div class="status-indicator">
        <div class="pulse-ring" v-if="isListening"></div>
        <el-icon class="microphone-icon" :class="{ active: isListening }">
          <Microphone />
        </el-icon>
      </div>
      
      <div class="voice-text">
        <div v-if="isListening" class="listening-text">
          正在聆听...
        </div>
        <div v-if="transcript" class="transcript">
          {{ transcript }}
        </div>
      </div>
      
      <!-- 手动停止按钮 -->
      <div class="stop-button" v-if="isListening">
        <el-button
          type="danger"
          size="small"
          @click="stopListening"
          :icon="'Close'"
          circle
          class="stop-btn"
        >
        </el-button>
      </div>
    </div>

    <!-- 语音提示 -->
    <div class="voice-tips" v-if="showTips">
      <el-card shadow="hover" class="tips-card">
        <template #header>
          <div class="tips-header">
            <el-icon><InfoFilled /></el-icon>
            <span>语音输入提示</span>
          </div>
        </template>
        <div class="tips-content">
          <p>您可以说：</p>
          <ul>
            <li>"我想去北京旅游3天"</li>
            <li>"计划一个上海5日游"</li>
            <li>"去杭州3天，喜欢美食"</li>
            <li>"我们4个人想去成都5天"</li>
            <li>"我想春天去日本7天"</li>
            <li>"安排杭州周末游"</li>
            <li>"清空输入" - 清除当前内容</li>
          </ul>
          <p class="tips-note">💡 支持自然语言描述，说出您的旅行想法即可</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, InfoFilled, Close } from '@element-plus/icons-vue'
import annyang from 'annyang'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'voiceInput'])

// 响应式数据
const isListening = ref(false)
const isInitializing = ref(false)
const transcript = ref('')
const showTips = ref(false)

// 语音识别初始化
const initSpeechRecognition = () => {
  if (!annyang) {
    ElMessage.error('您的浏览器不支持语音识别功能')
    return false
  }

  // 定义语音命令
  const commands = {
    // 旅行计划相关命令
    '我想去 *destination 旅游 *days 天': handleTravelCommand,
    '我想去 *destination *days 日游': handleTravelCommand,
    '计划一个 *destination *days 天的旅行': handleTravelCommand,
    '计划一个 *destination *days 日游': handleTravelCommand,
    '安排 *destination *days 天游': handleTravelCommand,
    '安排 *destination 周末游': (destination) => handleTravelCommand(destination, '2'),
    '去 *destination 玩 *days 天': handleTravelCommand,
    
    // 带偏好的旅行命令
    '我想去 *destination *days 天，喜欢 *preference': handleTravelWithPreference,
    '计划 *destination *days 天游，偏好 *preference': handleTravelWithPreference,
    '去 *destination *days 天，我喜欢 *preference': handleTravelWithPreference,
    
    // 预算相关命令（虽然移除了预算功能，但保留语音识别能力）
    '我想去 *destination *days 天，预算 *budget 元': handleTravelWithBudget,
    
    // 人数相关命令
    '我们 *people 个人想去 *destination *days 天': handleTravelWithPeople,
    '*people 人去 *destination *days 天': handleTravelWithPeople,
    
    // 季节/时间相关命令
    '我想 *season 去 *destination *days 天': handleTravelWithSeason,
    '*season 去 *destination 玩 *days 天': handleTravelWithSeason,
    
    // 通用语音输入
    '*text': handleGeneralInput,
    
    // 控制命令
    '清空输入': clearInput,
    '清除内容': clearInput,
    '删除': clearInput,
    '重新开始': clearInput
  }

  // 添加命令到annyang
  annyang.addCommands(commands)

  // 设置语言为中文
  annyang.setLanguage('zh-CN')

  // 监听语音识别事件
  annyang.addCallback('start', () => {
    isListening.value = true
    transcript.value = ''
  })

  annyang.addCallback('end', () => {
    isListening.value = false
  })

  // 注释掉result回调，避免与命令处理重复
  // annyang.addCallback('result', (phrases) => {
  //   if (phrases && phrases.length > 0) {
  //     transcript.value = phrases[0]
  //   }
  // })

  annyang.addCallback('error', (error) => {
    console.error('语音识别错误:', error)
    isListening.value = false
    isInitializing.value = false
    
    // 根据不同的错误类型给出相应的提示
    if (error.error === 'no-speech') {
      ElMessage.warning('没有检测到语音，请重试')
    } else if (error.error === 'not-allowed') {
      ElMessage.error('请允许麦克风权限以使用语音功能')
    } else if (error.error === 'aborted') {
      // 用户主动停止或快速切换，不显示错误信息
      console.log('语音识别被用户中止')
    } else if (error.error === 'network') {
      ElMessage.error('网络连接问题，请检查网络后重试')
    } else {
      ElMessage.error('语音识别出错，请重试')
    }
  })

  return true
}

// 处理旅行命令
const handleTravelCommand = (destination, days) => {
  const travelText = `我想去${destination}旅游${days}天`
  updateInput(travelText)
  ElMessage.success(`已识别：${travelText}`)
}

// 处理带偏好的旅行命令
const handleTravelWithPreference = (destination, days, preference) => {
  const travelText = `我想去${destination}旅游${days}天，喜欢${preference}`
  updateInput(travelText)
  ElMessage.success(`已识别：${travelText}`)
}

// 处理带预算的旅行命令
const handleTravelWithBudget = (destination, days, budget) => {
  const travelText = `我想去${destination}旅游${days}天，预算${budget}元`
  updateInput(travelText)
  ElMessage.success(`已识别：${travelText}`)
}

// 处理带人数的旅行命令
const handleTravelWithPeople = (people, destination, days) => {
  const travelText = `我们${people}个人想去${destination}旅游${days}天`
  updateInput(travelText)
  ElMessage.success(`已识别：${travelText}`)
}

// 处理带季节的旅行命令
const handleTravelWithSeason = (season, destination, days) => {
  const travelText = `我想${season}去${destination}旅游${days}天`
  updateInput(travelText)
  ElMessage.success(`已识别：${travelText}`)
}

// 处理通用输入
const handleGeneralInput = (text) => {
  if (text && text.trim()) {
    updateInput(text)
    ElMessage.success('语音输入完成')
  }
}

// 清空输入
const clearInput = () => {
  updateInput('')
  ElMessage.success('已清空输入')
}

// 更新输入内容
const updateInput = (text) => {
  emit('update:modelValue', text)
  emit('voiceInput', text)
  transcript.value = text
}

// 切换语音监听状态
const toggleListening = async () => {
  if (!annyang) {
    ElMessage.error('语音识别功能不可用')
    return
  }

  if (isListening.value) {
    // 停止监听
    annyang.abort()
    isListening.value = false
    isInitializing.value = false
  } else {
    // 开始监听
    try {
      isInitializing.value = true
      
      // 检查麦克风权限
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' })
        if (permission.state === 'denied') {
          ElMessage.error('麦克风权限被拒绝，请在浏览器设置中允许麦克风权限')
          isInitializing.value = false
          return
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100)) // 短暂延迟以显示加载状态
      annyang.start()
      showTips.value = true
      setTimeout(() => {
        showTips.value = false
      }, 5000) // 5秒后隐藏提示
    } catch (error) {
      console.error('启动语音识别失败:', error)
      ElMessage.error('启动语音识别失败')
      isInitializing.value = false
    }
  }
}

// 手动停止语音识别
const stopListening = () => {
  if (annyang && isListening.value) {
    annyang.abort()
    isListening.value = false
    isInitializing.value = false
    ElMessage.success('已停止语音识别')
  }
}

// 生命周期
onMounted(() => {
  initSpeechRecognition()
})

onUnmounted(() => {
  if (annyang && isListening.value) {
    annyang.abort()
    isListening.value = false
    isInitializing.value = false
  }
})
</script>

<style scoped>
.voice-input {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.voice-button {
  width: 60px;
  height: 60px;
  font-size: 24px;
  transition: all 0.3s ease;
}

.voice-button:hover {
  transform: scale(1.05);
}

.voice-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  min-width: 200px;
}

.status-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid #409eff;
  border-radius: 50%;
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.microphone-icon {
  font-size: 24px;
  color: #409eff;
  z-index: 1;
}

.microphone-icon.active {
  color: #f56c6c;
}

.voice-text {
  text-align: left;
  flex: 1;
}

.listening-text {
  color: #409eff;
  font-weight: 500;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

.transcript {
  color: #303133;
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

.voice-tips {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 16px;
  z-index: 1000;
}

.tips-card {
  width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 500;
}

.tips-content {
  font-size: 14px;
  color: #606266;
}

.tips-content p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.tips-content ul {
  margin: 0;
  padding-left: 16px;
}

.tips-content li {
  margin-bottom: 4px;
  color: #909399;
}

.tips-note {
  margin-top: 12px !important;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  color: #409eff !important;
  font-size: 13px;
  border-left: 3px solid #409eff;
}

/* 停止按钮样式 */
.stop-button {
  margin-left: 16px;
}

.stop-btn {
  width: 32px;
  height: 32px;
  border: none;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transition: all 0.3s ease;
}

.stop-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}
</style>