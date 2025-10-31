<template>
  <div class="plan-page">
    <div class="plan-container">
      <!-- 左侧输入面板 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2>AI 旅行规划师</h2>
          <p>告诉我您的旅行需求，我来为您规划完美行程</p>
        </div>

        <!-- Tab 切换 -->
        <el-tabs v-model="activeTab" class="plan-tabs">
          <!-- 生成计划 Tab -->
          <el-tab-pane label="生成计划" name="generate">
            <div class="generate-section">
              <!-- 文字输入 -->
              <div class="text-input">
                <div class="input-container">
                  <el-input
                    v-model="inputText"
                    type="textarea"
                    :rows="4"
                    placeholder="例如：我想去日本，5天，喜欢美食和动漫，带孩子"
                    class="input-textarea"
                  />
                  
                  <!-- 语音输入组件 -->
                  <div class="voice-input-container">
                    <VoiceInput 
                      @voiceInput="handleVoiceInput"
                    />
                  </div>
                </div>

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
                  <div class="option-group">
                    <span class="group-label">预算：</span>
                    <el-tag
                      v-for="budget in budgets"
                      :key="budget"
                      @click="addToInput(budget)"
                      class="option-tag budget-tag"
                    >
                      {{ budget }}
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
                {{ isPlanning ? "正在规划中..." : "生成旅行计划" }}
              </el-button>

              <!-- 本地临时历史记录 -->
              <div v-if="planHistory.length > 0" class="temp-history-section">
                <h4>本次会话生成的计划</h4>
                <div class="history-list">
                  <div
                    v-for="(plan, index) in planHistory"
                    :key="index"
                    class="history-item"
                    @click="loadPlan(plan)"
                  >
                    <div class="history-title">{{ plan.destination }}</div>
                    <div class="history-info">
                      {{ plan.days }}天
                    </div>
                    <el-tag size="small" type="warning">临时</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 计划历史 Tab -->
          <el-tab-pane label="计划历史" name="history">
            <div class="history-section">
              <div class="history-header">
                <h4>已保存的旅行计划</h4>
                <el-button
                  size="small"
                  @click="loadSavedHistory"
                  :loading="isLoading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>

              <div v-if="isLoading" class="loading-state">
                <el-skeleton :rows="3" animated />
              </div>

              <div v-else-if="savedHistory.length === 0" class="empty-history">
                <el-empty description="暂无保存的旅行计划" />
              </div>

              <div v-else class="saved-history-list">
                <div
                  v-for="plan in savedHistory"
                  :key="plan.id"
                  class="saved-history-item"
                  @click="loadPlanFromHistory(plan)"
                >
                  <div class="history-content">
                    <div class="history-title">{{ plan.title }}</div>
                    <div class="history-destination">
                      {{ plan.destination }}
                    </div>
                    <div class="history-info">
                      {{ plan.days }}天
                    </div>
                    <div class="history-date">
                      {{ formatDate(plan.created_at) }}
                    </div>
                  </div>
                  <div class="history-actions" @click.stop>
                    <el-button
                      size="small"
                      type="danger"
                      @click="deleteFromHistory(plan.id)"
                      :loading="isLoading"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
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
          height="100%"
          :markers="mapMarkers"
          :itinerary="currentPlan?.itinerary || []"
          :center="mapCenter"
          @marker-click="onMarkerClick"
          @map-ready="onMapReady"
        />

        <!-- 行程详情 -->
        <div 
          v-if="currentPlan" 
          class="plan-details"
          ref="planDetailsRef"
          :style="planDetailsStyle"
        >
          <!-- 缩放手柄容器 - 覆盖整个面板 -->
          <div class="resize-handles">
            <div class="resize-handle resize-handle-nw" @mousedown="startResize('nw', $event)"></div>
            <div class="resize-handle resize-handle-ne" @mousedown="startResize('ne', $event)"></div>
            <div class="resize-handle resize-handle-sw" @mousedown="startResize('sw', $event)"></div>
            <div class="resize-handle resize-handle-se" @mousedown="startResize('se', $event)"></div>
            <div class="resize-handle resize-handle-n" @mousedown="startResize('n', $event)"></div>
            <div class="resize-handle resize-handle-s" @mousedown="startResize('s', $event)"></div>
            <div class="resize-handle resize-handle-w" @mousedown="startResize('w', $event)"></div>
            <div class="resize-handle resize-handle-e" @mousedown="startResize('e', $event)"></div>
          </div>
          
          <div class="panel-header" @mousedown="startDrag">
            <div class="drag-indicator">
              <span>⋮⋮</span>
              <span>{{ currentPlan.destination }}行程</span>
            </div>
          </div>
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <!-- 预算概览 -->
                <div v-if="currentPlan && (currentPlan.budget || currentPlan.totalCost)" class="budget-overview">
                  <div class="budget-info">
                    <div class="budget-item">
                      <el-icon class="budget-icon"><Money /></el-icon>
                      <span class="budget-label">总预算:</span>
                      <span class="budget-value">¥{{ formatBudget(currentPlan.budget || currentPlan.totalCost) }}</span>
                    </div>
                    <div class="budget-item">
                      <el-icon class="budget-icon"><Calendar /></el-icon>
                      <span class="budget-label">日均:</span>
                      <span class="budget-value">¥{{ formatBudget((currentPlan.budget || currentPlan.totalCost) / (currentPlan.days || 1)) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="header-actions">
                  <el-tag v-if="isStreaming" type="info" effect="plain">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    正在生成...
                  </el-tag>
                  <el-button
                    size="small"
                    type="success"
                    @click="savePlanToHistory"
                    :disabled="isStreaming || isLoading"
                    :loading="isLoading"
                    v-if="currentPlan && !currentPlan.savedToHistory"
                  >
                    <el-icon><DocumentAdd /></el-icon>
                    保存到历史
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deletePlan"
                    :disabled="isStreaming || isLoading"
                    v-if="currentPlan"
                  >
                    <el-icon><Delete /></el-icon>
                    删除计划
                  </el-button>
                </div>
              </div>
            </template>
            <div class="plan-content">
              <!-- 流式内容显示 -->
              <div
                v-if="isStreaming && streamingContent"
                class="streaming-content"
              >
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
              <div
                v-else-if="
                  currentPlan.itinerary && currentPlan.itinerary.length > 0
                "
                class="itinerary-container"
              >
                <!-- 展示控制按钮 -->
                <div class="display-controls">
                  <el-button-group size="small">
                    <el-button 
                      :type="displayMode === 'compact' ? 'primary' : ''"
                      @click="displayMode = 'compact'"
                    >
                      简洁视图
                    </el-button>
                    <el-button 
                      :type="displayMode === 'detailed' ? 'primary' : ''"
                      @click="displayMode = 'detailed'"
                    >
                      详细视图
                    </el-button>
                  </el-button-group>
                  <el-button 
                    size="small" 
                    :icon="isExpanded ? 'ArrowUp' : 'ArrowDown'"
                    @click="toggleExpanded"
                  >
                    {{ isExpanded ? '收起' : '展开全部' }}
                  </el-button>
                </div>

                <div
                  v-for="(day, index) in currentPlan.itinerary"
                  :key="index"
                  class="day-item"
                >
                  <div class="day-header" @click="toggleDay(index)">
                    <div class="day-title-section">
                      <h4>第{{ index + 1 }}天</h4>
                      <!-- 每日预算信息 -->
                      <div v-if="currentPlan && (currentPlan.budget || currentPlan.totalCost)" class="day-budget">
                        <el-icon class="budget-icon-small"><Money /></el-icon>
                        <span class="daily-budget-text">
                          预算: ¥{{ formatBudget(getDailyBudget(index)) }}
                        </span>
                      </div>
                    </div>
                    <div class="day-summary">
                      <span v-if="day.activities" class="activity-count">
                        {{ day.activities.length }}个活动
                      </span>
                      <el-icon class="expand-icon" :class="{ 'expanded': expandedDays.includes(index) }">
                        <ArrowDown />
                      </el-icon>
                    </div>
                  </div>

                  <el-collapse-transition>
                    <div v-show="isExpanded || expandedDays.includes(index)" class="day-content">
                      <!-- 简洁视图 -->
                      <div v-if="displayMode === 'compact'" class="activities-compact">
                        <!-- 当日预算总览 -->
                        <div v-if="currentPlan && (currentPlan.budget || currentPlan.totalCost)" class="day-budget-summary">
                          <div class="budget-summary-item">
                            <el-icon class="budget-icon-compact"><Money /></el-icon>
                            <span class="budget-text">当日预算: ¥{{ formatBudget(getDailyBudget(index)) }}</span>
                          </div>
                        </div>
                        
                        <draggable
                          v-model="day.activities"
                          group="activities"
                          item-key="name"
                          class="draggable-list"
                          @change="onActivityDragChange"
                        >
                          <template #item="{ element: activity, index: actIndex }">
                            <div
                              class="activity-item-compact draggable-item"
                              :key="actIndex"
                              @click="onActivityClick(activity)"
                            >
                              <div class="drag-handle">⋮⋮</div>
                              <div class="activity-time">{{ activity.time }}</div>
                              <div class="activity-info">
                                <span class="activity-name">{{ activity.name }}</span>
                                <el-tag size="small" class="activity-type">{{ activity.type }}</el-tag>
                              </div>
                            </div>
                          </template>
                        </draggable>
                      </div>

                      <!-- 详细视图 -->
                      <div v-else class="activities-detailed">
                        <!-- 当日预算详细信息 -->
                        <div v-if="currentPlan && (currentPlan.budget || currentPlan.totalCost)" class="day-budget-detailed">
                          <h6 class="budget-section-title">
                            <el-icon><Money /></el-icon>
                            当日预算分配
                          </h6>
                          <div class="budget-breakdown">
                            <div class="budget-item">
                              <span class="budget-category">活动门票</span>
                              <span class="budget-amount">¥{{ formatBudget(getDailyBudget(index) * 0.4) }}</span>
                            </div>
                            <div class="budget-item">
                              <span class="budget-category">餐饮费用</span>
                              <span class="budget-amount">¥{{ formatBudget(getDailyBudget(index) * 0.35) }}</span>
                            </div>
                            <div class="budget-item">
                              <span class="budget-category">交通费用</span>
                              <span class="budget-amount">¥{{ formatBudget(getDailyBudget(index) * 0.15) }}</span>
                            </div>
                            <div class="budget-item">
                              <span class="budget-category">其他费用</span>
                              <span class="budget-amount">¥{{ formatBudget(getDailyBudget(index) * 0.1) }}</span>
                            </div>
                            <div class="budget-item budget-total">
                              <span class="budget-category">当日总计</span>
                              <span class="budget-amount">¥{{ formatBudget(getDailyBudget(index)) }}</span>
                            </div>
                          </div>
                        </div>
                        
                        <draggable
                          v-model="day.activities"
                          group="activities"
                          item-key="name"
                          class="draggable-list"
                          @change="onActivityDragChange"
                        >
                          <template #item="{ element: activity, index: actIndex }">
                            <div
                              class="activity-item-detailed draggable-item"
                              :key="actIndex"
                              @click="onActivityClick(activity)"
                            >
                              <div class="drag-handle">⋮⋮</div>
                              <div class="activity-content">
                                <div class="activity-header">
                                  <div class="activity-time-detailed">{{ activity.time }}</div>
                                  <div class="activity-main">
                                    <h5 class="activity-name-detailed">{{ activity.name }}</h5>
                                    <div class="activity-meta">
                                      <el-tag size="small" :type="getActivityTypeColor(activity.type)">
                                        {{ activity.type }}
                                      </el-tag>
                                      <span v-if="activity.duration" class="duration">
                                        <el-icon><Clock /></el-icon>
                                        {{ activity.duration }}
                                      </span>
                                      <!-- 活动预算信息 -->
                                      <span v-if="activity.cost || getEstimatedActivityCost(activity)" class="activity-cost">
                                        <el-icon><Money /></el-icon>
                                        ¥{{ activity.cost || getEstimatedActivityCost(activity) }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div v-if="activity.description" class="activity-description">
                                  {{ activity.description }}
                                </div>
                                
                                <div v-if="activity.location" class="activity-location">
                                  <el-icon><Location /></el-icon>
                                  {{ activity.location }}
                                </div>
                              </div>
                            </div>
                          </template>
                        </draggable>

                        <!-- 当日餐饮信息 -->
                        <div v-if="day.meals && day.meals.length > 0" class="day-meals">
                          <h6>餐饮安排</h6>
                          <div class="meals-list">
                            <div
                              v-for="(meal, mealIndex) in day.meals"
                              :key="mealIndex"
                              class="meal-item"
                            >
                              <div class="meal-info">
                                <el-tag size="small" type="success">{{ meal.type }}</el-tag>
                                <span class="meal-restaurant">{{ meal.restaurant }}</span>
                              </div>
                              <div v-if="meal.cost || getEstimatedMealCost(meal)" class="meal-cost">
                                <el-icon><Money /></el-icon>
                                <span>¥{{ meal.cost || getEstimatedMealCost(meal) }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- 当日住宿信息 -->
                        <div v-if="day.accommodation" class="day-accommodation">
                          <h6>住宿安排</h6>
                          <div class="accommodation-info">
                            <div class="accommodation-details">
                              <span class="hotel-name">{{ day.accommodation.name }}</span>
                              <el-tag size="small" type="info">{{ day.accommodation.type }}</el-tag>
                            </div>
                            <div v-if="day.accommodation.cost || getEstimatedAccommodationCost(day.accommodation)" class="accommodation-cost">
                              <el-icon><Money /></el-icon>
                              <span>¥{{ day.accommodation.cost || getEstimatedAccommodationCost(day.accommodation) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>

                <!-- 旅行贴士 -->
                <div v-if="currentPlan.tips && currentPlan.tips.length > 0" class="travel-tips">
                  <h5>
                    <el-icon><InfoFilled /></el-icon>
                    旅行贴士
                  </h5>
                  <ul class="tips-list">
                    <li v-for="(tip, tipIndex) in currentPlan.tips" :key="tipIndex">
                      {{ tip }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- 空状态或加载状态 -->
              <div v-else class="empty-content">
                <el-empty
                  :description="
                    isPlanning ? '正在生成旅行计划，请稍候...' : '暂无行程安排'
                  "
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTravelStore } from "@/stores/travel";
import { useUserStore } from '@/stores/user'
import MapComponent from "@/components/MapComponent.vue";
import VoiceInput from "@/components/VoiceInput.vue";
import draggable from 'vuedraggable';
import {
  MagicStick,
  Refresh,
  Loading,
  DocumentAdd,
  Delete,
  ArrowDown,
  ArrowUp,
  Clock,
  Money,
  Location,
  InfoFilled,
  User,
  Calendar,
} from "@element-plus/icons-vue";
import { generateTravelPlan } from "@/services/llm";

// 状态管理
const travelStore = useTravelStore();
const authStore = useUserStore();

// 响应式数据
const activeTab = ref("generate");
const inputText = ref("");
const isPlanning = ref(false);
const mapRef = ref(null);
const mapCenter = ref([116.397428, 39.90923]);

// 计划展示相关状态
const displayMode = ref('compact'); // 'compact' | 'detailed'
const isExpanded = ref(false); // 是否展开全部
const expandedDays = ref([]); // 展开的天数索引数组

// 面板拖拽和缩放相关状态
const planDetailsRef = ref(null);
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref('');
const dragStartPos = ref({ x: 0, y: 0 });
const panelPosition = ref({ x: 20, y: 80 });
const panelSize = ref({ width: 300, height: 600 });
const initialMousePos = ref({ x: 0, y: 0 });
const initialPanelPos = ref({ x: 0, y: 0 });
const initialPanelSize = ref({ width: 0, height: 0 });

// 快捷选项数据
const destinations = [
  "日本",
  "韩国",
  "泰国",
  "新加坡",
  "马来西亚",
  "越南",
  "法国",
  "意大利",
  "英国",
  "德国",
];
const days = ["3天", "5天", "7天", "10天", "15天"];
const budgets = ["预算1000元", "预算3000元", "预算5000元", "预算8000元", "预算10000元", "预算15000元"];
const preferences = [
  "美食",
  "购物",
  "文化",
  "自然",
  "历史",
  "艺术",
  "亲子",
  "情侣",
  "独行",
];

// 计算属性
const currentPlan = computed(() => travelStore.currentPlan);
const planHistory = computed(() => travelStore.planHistory);
const savedHistory = computed(() => travelStore.savedHistory);
const isLoading = computed(() => travelStore.isLoading);

// 面板样式计算属性
const planDetailsStyle = computed(() => ({
  position: 'absolute',
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${panelSize.value.width}px`,
  height: `${panelSize.value.height}px`,
  zIndex: 1000,
  cursor: isDragging.value ? 'grabbing' : 'default',
  userSelect: 'none'
}));

const mapMarkers = computed(() => {
  if (
    !currentPlan.value ||
    !currentPlan.value.itinerary ||
    !Array.isArray(currentPlan.value.itinerary)
  ) {
    console.log(
      "[Plan] mapMarkers: no itinerary in currentPlan",
      currentPlan.value?.title
    );
    return [];
  }

  const markers = currentPlan.value.itinerary.flatMap((day, dayIndex) => {
    if (!day || !day.activities || !Array.isArray(day.activities)) return [];

    return day.activities.map((activity, actIndex) => {
      // 验证坐标数据
      let coordinates = [116.397428, 39.90923]; // 默认坐标（北京）

      if (
        activity.coordinates &&
        Array.isArray(activity.coordinates) &&
        activity.coordinates.length >= 2
      ) {
        const [lng, lat] = activity.coordinates;
        // 检查坐标是否为有效数字
        if (
          typeof lng === "number" &&
          typeof lat === "number" &&
          !isNaN(lng) &&
          !isNaN(lat) &&
          lng >= -180 &&
          lng <= 180 &&
          lat >= -90 &&
          lat <= 90
        ) {
          coordinates = [lng, lat];
        } else {
          console.warn(
            "[Plan] invalid activity.coordinates:",
            activity.coordinates
          );
        }
      } else if (activity.coordinates) {
        console.warn(
          "[Plan] malformed activity.coordinates:",
          activity.coordinates
        );
      }

      return {
        position: coordinates,
        title: activity.name || "未知景点",
        content: `<div class="marker-info">${dayIndex + 1}-${
          actIndex + 1
        }</div>`,
      };
    });
  });
  console.log("[Plan] mapMarkers count:", markers.length);
  return markers;
});

// 处理语音输入
const handleVoiceInput = (voiceText) => {
  if (voiceText) {
    // 如果当前输入框有内容，在末尾添加语音输入
    if (inputText.value.trim()) {
      inputText.value += ' ' + voiceText;
    } else {
      inputText.value = voiceText;
    }
    ElMessage.success('语音输入已添加到文本框');
  }
};

// 添加到输入框
const addToInput = (text) => {
  if (inputText.value) {
    inputText.value += "，" + text;
  } else {
    inputText.value = text;
  }
};

// 流式响应状态
const streamingContent = ref("");
const isStreaming = ref(false);

// 生成旅行计划
const generatePlan = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning("请输入您的旅行需求");
    return;
  }

  isPlanning.value = true;

  try {
    // 创建临时计划
    const tempPlan = {
      id: Date.now().toString(),
      title: "正在生成旅行计划...",
      summary: "AI正在为您制定个性化的旅行计划，请稍候...",
      destination: "分析中...",
      days: 0,
      itinerary: [],
      tips: [],
      createdAt: new Date().toISOString(),
      input: inputText.value,
      isStreaming: true,
      streamingContent: "",
    };

    travelStore.setPlan(tempPlan);

    // 直接传递用户的原始输入给模型，让模型自行解析
    const planParams = {
      rawInput: inputText.value.trim()
    };

    console.log("[Plan] 生成计划参数:", planParams);

    let generatedPlan;
    try {
      generatedPlan = await generateTravelPlan(
        planParams,
        true,
        (chunk, fullContent) => {
          const updatedPlan = {
            ...tempPlan,
            streamingContent: fullContent,
          };
          travelStore.setPlan(updatedPlan);
        }
      );
    } catch (apiError) {
      console.warn("LLM API调用失败，使用备用方案:", apiError);
      generatedPlan = generateFallbackPlan(planParams);
    }

    // 添加额外信息
    const plan = {
      ...generatedPlan,
      id: tempPlan.id,
      createdAt: tempPlan.createdAt,
      input: inputText.value,
      isStreaming: false,
    };

    travelStore.setPlan(plan);

    // 更新地图中心
    if (
      plan.itinerary &&
      plan.itinerary.length > 0 &&
      plan.itinerary[0].activities.length > 0
    ) {
      const firstActivity = plan.itinerary[0].activities[0];
      if (
        firstActivity.coordinates &&
        Array.isArray(firstActivity.coordinates) &&
        firstActivity.coordinates.length >= 2
      ) {
        const [lng, lat] = firstActivity.coordinates;
        // 验证坐标有效性
        if (
          typeof lng === "number" &&
          typeof lat === "number" &&
          !isNaN(lng) &&
          !isNaN(lat) &&
          lng >= -180 &&
          lng <= 180 &&
          lat >= -90 &&
          lat <= 90
        ) {
          mapCenter.value = [lng, lat];
          console.log(
            "[Plan] set center from first activity:",
            mapCenter.value
          );
          if (mapRef.value) {
            mapRef.value.setCenter(mapCenter.value);
          }
        } else {
          console.warn(
            "[Plan] first activity center invalid:",
            firstActivity.coordinates
          );
        }
      }
    }

    ElMessage.success("旅行计划生成成功！");
  } catch (error) {
    console.error("生成计划失败:", error);
    ElMessage.error("生成计划失败，请重试");
  } finally {
    isPlanning.value = false;
    isStreaming.value = false;
    streamingContent.value = "";
    travelStore.setPlanning(false);
  }
};

// 备用计划生成
const generateFallbackPlan = (params) => {
  const lib = {
    // ... existing code ...
  };
  const key = Object.keys(lib).includes(params.destination)
    ? params.destination
    : "中国";
  const spots = lib[key].spots;
  const buildDay = (day, items) => ({
    day,
    activities: [
      {
        time: "09:00",
        name: items[0].name,
        type: "景点",
        coordinates: items[0].coordinates,
      },
      {
        time: "12:00",
        name: items[1].name,
        type: "美食",
        coordinates: items[1].coordinates,
      },
      {
        time: "15:00",
        name: items[2].name,
        type: "景点",
        coordinates: items[2].coordinates,
      },
    ],
  });
  const displayDest = params.destination || key;
  return {
    title: `${displayDest}${params.days}日游`,
    summary: "（备用方案）基于常见热门景点的简要行程",
    destination: displayDest,
    days: params.days,
    budget: params.budget,
    totalCost: params.budget,
    itinerary: [buildDay(1, spots.slice(0, 3)), buildDay(2, spots.slice(1, 4))],
  };
};

// 加载历史计划
const loadPlan = (plan) => {
  travelStore.setPlan(plan);
  inputText.value = `${plan.destination}，${plan.days}，预算${plan.budget}`;

  // 设置地图中心，带校验与格式兼容
  let center = [116.397428, 39.90923];
  if (
    plan.itinerary &&
    plan.itinerary.length > 0 &&
    plan.itinerary[0].activities &&
    plan.itinerary[0].activities.length > 0
  ) {
    const coord = plan.itinerary[0].activities[0].coordinates;
    if (coord) {
      let lng, lat;
      if (Array.isArray(coord) && coord.length >= 2) {
        lng = parseFloat(coord[0]);
        lat = parseFloat(coord[1]);
      } else if (
        typeof coord === "object" &&
        (coord.lng ?? coord.longitude) !== undefined &&
        (coord.lat ?? coord.latitude) !== undefined
      ) {
        lng = parseFloat(coord.lng ?? coord.longitude);
        lat = parseFloat(coord.lat ?? coord.latitude);
      } else if (typeof coord === "string") {
        const parts = coord.split(",");
        if (parts.length >= 2) {
          lng = parseFloat(parts[0].trim());
          lat = parseFloat(parts[1].trim());
        }
      }
      if (
        !isNaN(lng) &&
        !isNaN(lat) &&
        lng >= -180 &&
        lng <= 180 &&
        lat >= -90 &&
        lat <= 90
      ) {
        center = [lng, lat];
      } else {
        console.warn("历史计划中心坐标无效，使用默认中心:", coord);
      }
    }
  }
  mapCenter.value = center;
  console.log("[Plan] loadPlan set center:", mapCenter.value);
  if (mapRef.value) {
    mapRef.value.setCenter(center);
  }
};

// 保存计划到历史记录
const savePlanToHistory = async () => {
  if (!currentPlan.value) {
    ElMessage.warning("没有可保存的计划");
    return;
  }

  if (!authStore.user) {
    ElMessage.warning("请先登录");
    return;
  }

  try {
    await travelStore.savePlanToHistory(currentPlan.value);
    ElMessage.success("计划已保存到历史记录");

    // 标记当前计划已保存
    if (currentPlan.value) {
      currentPlan.value.savedToHistory = true;
    }

    // 切换到历史记录 tab
    activeTab.value = "history";

    // 刷新历史记录
    await loadSavedHistory();
  } catch (error) {
    console.error("保存计划失败:", error);
    ElMessage.error("保存失败，请重试");
  }
};

// 加载保存的历史记录
const loadSavedHistory = async () => {
  if (!authStore.user) {
    ElMessage.warning("请先登录");
    return;
  }

  try {
    await travelStore.loadSavedHistory();
  } catch (error) {
    console.error("加载历史记录失败:", error);
    ElMessage.error("加载历史记录失败");
  }
};

// 从历史记录加载计划
const loadPlanFromHistory = async (plan) => {
  try {
    await travelStore.loadPlanFromHistory(plan);
    ElMessage.success("已加载历史计划");

    // 切换到生成计划 tab
    activeTab.value = "generate";

    // 更新地图
    await nextTick();
    if (mapRef.value) {
      mapRef.value.updateMarkers(mapMarkers.value);
      if (mapCenter.value) {
        mapRef.value.setCenter(mapCenter.value);
      }
    }
  } catch (error) {
    console.error("加载计划失败:", error);
    ElMessage.error("加载计划失败");
  }
};

// 计划展示相关方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    // 展开全部时，清空单独展开的天数
    expandedDays.value = [];
  }
};

const toggleDay = (dayIndex) => {
  if (isExpanded.value) return; // 全部展开时不处理单独切换
  
  const index = expandedDays.value.indexOf(dayIndex);
  if (index > -1) {
    expandedDays.value.splice(index, 1);
  } else {
    expandedDays.value.push(dayIndex);
  }
};

const getActivityTypeColor = (type) => {
  const colorMap = {
    '景点': 'primary',
    '美食': 'success',
    '购物': 'warning',
    '交通': 'info',
    '住宿': 'danger',
    '娱乐': 'primary',
    '文化': 'success',
    '自然': 'warning'
  };
  return colorMap[type] || '';
};

// 拖拽相关方法
const onActivityDragChange = (evt) => {
  console.log('Activity drag change:', evt);
  // 可以在这里添加拖拽后的处理逻辑，比如保存到本地存储
  if (evt.moved || evt.added || evt.removed) {
    // 触发计划更新
    ElMessage.success('活动顺序已更新');
  }
};

// 活动点击事件处理
const onActivityClick = (activity) => {
  console.log('[Plan] 点击活动:', activity.name);
  
  if (!activity || !activity.coordinates) {
    ElMessage.warning('该活动没有位置信息，无法在地图上显示');
    return;
  }

  // 调用地图组件的跳转方法
  if (mapRef.value && mapRef.value.jumpToActivity) {
    mapRef.value.jumpToActivity(activity);
    ElMessage.success(`正在跳转到 ${activity.name}`);
  } else {
    console.warn('[Plan] 地图组件未准备就绪或方法不存在');
    ElMessage.warning('地图未准备就绪，请稍后再试');
  }
};

// 删除当前计划
const deletePlan = async () => {
  if (!currentPlan.value) {
    ElMessage.warning("没有可删除的计划");
    return;
  }

  try {
    await ElMessageBox.confirm("确定要删除当前的旅行计划吗？", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 清空当前计划
    travelStore.clearCurrentPlan();
    ElMessage.success("计划已删除");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除计划失败:", error);
      ElMessage.error("删除失败，请重试");
    }
  }
};

// 格式化预算显示
const formatBudget = (budget) => {
  if (!budget) return '0';
  const num = parseFloat(budget);
  if (isNaN(num)) return '0';
  
  // 如果是整数，不显示小数点
  if (num % 1 === 0) {
    return num.toLocaleString('zh-CN');
  }
  
  // 如果有小数，保留两位小数
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

// 计算每日预算
const getDailyBudget = (dayIndex) => {
  if (!currentPlan.value || (!currentPlan.value.budget && !currentPlan.value.totalCost)) {
    return 0;
  }
  
  const totalBudget = currentPlan.value.budget || currentPlan.value.totalCost;
  const totalDays = currentPlan.value.days || currentPlan.value.itinerary?.length || 1;
  
  return totalBudget / totalDays;
};

// 估算活动费用
const getEstimatedActivityCost = (activity) => {
  if (!activity || !activity.type) return 0;
  
  const costMap = {
    '景点': 80,
    '博物馆': 60,
    '公园': 20,
    '寺庙': 30,
    '购物': 200,
    '娱乐': 150,
    '体验': 120,
    '观光': 100,
    '文化': 70,
    '历史': 50,
    '自然': 40,
    '艺术': 90,
    '运动': 100,
    '休闲': 60
  };
  
  return costMap[activity.type] || 80;
};

// 估算餐饮费用
const getEstimatedMealCost = (meal) => {
  if (!meal || !meal.type) return 0;
  
  const costMap = {
    '早餐': 30,
    '午餐': 80,
    '晚餐': 120,
    '下午茶': 50,
    '夜宵': 60,
    '小食': 25,
    '饮品': 20
  };
  
  return costMap[meal.type] || 60;
};

// 估算住宿费用
const getEstimatedAccommodationCost = (accommodation) => {
  if (!accommodation || !accommodation.type) return 0;
  
  const costMap = {
    '酒店': 400,
    '民宿': 250,
    '青旅': 100,
    '度假村': 800,
    '客栈': 180,
    '公寓': 300,
    '别墅': 1000,
    '帐篷': 80
  };
  
  return costMap[accommodation.type] || 300;
};

// 删除历史记录中的计划
const deleteFromHistory = async (planId) => {
  try {
    await ElMessageBox.confirm("确定要删除这个旅行计划吗？", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });

    await travelStore.deleteFromHistory(planId);
    ElMessage.success("计划已删除");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除计划失败:", error);
      ElMessage.error("删除失败，请重试");
    }
  }
};

// 拖拽和缩放相关方法
const startDrag = (e) => {
  e.preventDefault();
  isDragging.value = true;
  initialMousePos.value = { x: e.clientX, y: e.clientY };
  initialPanelPos.value = { ...panelPosition.value };
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  
  const deltaX = e.clientX - initialMousePos.value.x;
  const deltaY = e.clientY - initialMousePos.value.y;
  
  panelPosition.value = {
    x: Math.max(0, Math.min(window.innerWidth - panelSize.value.width, initialPanelPos.value.x + deltaX)),
    y: Math.max(0, Math.min(window.innerHeight - panelSize.value.height, initialPanelPos.value.y + deltaY))
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const startResize = (direction, e) => {
  e.preventDefault();
  e.stopPropagation();
  
  isResizing.value = true;
  resizeDirection.value = direction;
  initialMousePos.value = { x: e.clientX, y: e.clientY };
  initialPanelPos.value = { ...panelPosition.value };
  initialPanelSize.value = { ...panelSize.value };
  
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
};

const onResize = (e) => {
  if (!isResizing.value) return;
  
  const deltaX = e.clientX - initialMousePos.value.x;
  const deltaY = e.clientY - initialMousePos.value.y;
  
  const minWidth = 250;
  const minHeight = 300;
  const maxWidth = window.innerWidth - panelPosition.value.x;
  const maxHeight = window.innerHeight - panelPosition.value.y;
  
  switch (resizeDirection.value) {
    case 'se': // 右下角
      panelSize.value.width = Math.max(minWidth, Math.min(maxWidth, initialPanelSize.value.width + deltaX));
      panelSize.value.height = Math.max(minHeight, Math.min(maxHeight, initialPanelSize.value.height + deltaY));
      break;
    case 'sw': // 左下角
      const newWidth = initialPanelSize.value.width - deltaX;
      if (newWidth >= minWidth) {
        panelSize.value.width = newWidth;
        panelPosition.value.x = initialPanelPos.value.x + deltaX;
      }
      panelSize.value.height = Math.max(minHeight, Math.min(maxHeight, initialPanelSize.value.height + deltaY));
      break;
    case 'ne': // 右上角
      panelSize.value.width = Math.max(minWidth, Math.min(maxWidth, initialPanelSize.value.width + deltaX));
      const newHeight = initialPanelSize.value.height - deltaY;
      if (newHeight >= minHeight) {
        panelSize.value.height = newHeight;
        panelPosition.value.y = initialPanelPos.value.y + deltaY;
      }
      break;
    case 'nw': // 左上角
      const newWidthNW = initialPanelSize.value.width - deltaX;
      const newHeightNW = initialPanelSize.value.height - deltaY;
      if (newWidthNW >= minWidth) {
        panelSize.value.width = newWidthNW;
        panelPosition.value.x = initialPanelPos.value.x + deltaX;
      }
      if (newHeightNW >= minHeight) {
        panelSize.value.height = newHeightNW;
        panelPosition.value.y = initialPanelPos.value.y + deltaY;
      }
      break;
    case 'n': // 上边
      const newHeightN = initialPanelSize.value.height - deltaY;
      if (newHeightN >= minHeight) {
        panelSize.value.height = newHeightN;
        panelPosition.value.y = initialPanelPos.value.y + deltaY;
      }
      break;
    case 's': // 下边
      panelSize.value.height = Math.max(minHeight, Math.min(maxHeight, initialPanelSize.value.height + deltaY));
      break;
    case 'w': // 左边
      const newWidthW = initialPanelSize.value.width - deltaX;
      if (newWidthW >= minWidth) {
        panelSize.value.width = newWidthW;
        panelPosition.value.x = initialPanelPos.value.x + deltaX;
      }
      break;
    case 'e': // 右边
      panelSize.value.width = Math.max(minWidth, Math.min(maxWidth, initialPanelSize.value.width + deltaX));
      break;
  }
};

const stopResize = () => {
  isResizing.value = false;
  resizeDirection.value = '';
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 重置地图
const resetMap = () => {
  mapCenter.value = [116.397428, 39.90923];
  console.log("[Plan] resetMap center:", mapCenter.value);
  if (mapRef.value) {
    mapRef.value.setCenter(mapCenter.value);
    mapRef.value.setZoom(10);
  }
};

// 地图事件处理
const onMarkerClick = (markerData, index) => {
  ElMessage.info(`点击了：${markerData.title}`);
};

const onMapReady = (map) => {
  console.log("地图加载完成", map);
};

// 生命周期
onMounted(async () => {
  // 如果用户已登录，加载历史记录
  if (authStore.user) {
    await loadSavedHistory();
  }
});

// 监听用户登录状态变化
watch(
  () => authStore.user,
  async (newUser) => {
    if (newUser) {
      await loadSavedHistory();
    } else {
      // 用户登出时清空历史记录
      travelStore.savedHistory = [];
    }
  }
);

onUnmounted(() => {
  // 清理地图资源
  if (mapRef.value) {
    mapRef.value = null;
  }
});
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

.text-input {
  margin-bottom: 20px;
}

.input-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-input-container {
  display: flex;
  justify-content: flex-end;
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

.budget-tag {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  border: none;
}

.budget-tag:hover {
  background: linear-gradient(135deg, #5daf34 0%, #7bc143 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
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
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: white;
  overflow: hidden;
  resize: none;
}

.panel-header {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  padding: 8px 12px;
  cursor: grab;
  user-select: none;
  position: relative;
}

.panel-header:active {
  cursor: grabbing;
}

.drag-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
}

.drag-indicator span:first-child {
  font-size: 12px;
  opacity: 0.8;
}

/* 缩放手柄样式 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.resize-handle {
  position: absolute;
  pointer-events: all;
  background: rgba(64, 158, 255, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.6);
  transition: all 0.2s ease;
}

.resize-handle:hover {
  background: rgba(64, 158, 255, 0.5);
  border-color: #409eff;
}

/* 角落手柄 */
.resize-handle-nw {
  top: -5px;
  left: -5px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
  border-radius: 2px 0 2px 0;
}

.resize-handle-ne {
  top: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  cursor: ne-resize;
  border-radius: 0 2px 0 2px;
}

.resize-handle-sw {
  bottom: -5px;
  left: -5px;
  width: 12px;
  height: 12px;
  cursor: sw-resize;
  border-radius: 0 2px 0 2px;
}

.resize-handle-se {
  bottom: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  cursor: se-resize;
  border-radius: 2px 0 2px 0;
}

/* 边缘手柄 - 扩展到整个面板边缘 */
.resize-handle-n {
  top: -4px;
  left: 12px;
  right: 12px;
  height: 8px;
  cursor: n-resize;
  border-radius: 0 0 4px 4px;
}

.resize-handle-s {
  bottom: -4px;
  left: 12px;
  right: 12px;
  height: 8px;
  cursor: s-resize;
  border-radius: 4px 4px 0 0;
}

.resize-handle-w {
  left: -4px;
  top: 12px;
  bottom: 12px;
  width: 8px;
  cursor: w-resize;
  border-radius: 0 4px 4px 0;
}

.resize-handle-e {
  right: -4px;
  top: 12px;
  bottom: 12px;
  width: 8px;
  cursor: e-resize;
  border-radius: 4px 0 0 4px;
}

.detail-card {
  box-shadow: none;
  border: none;
  height: calc(100% - 40px);
  overflow: visible;
}

.detail-card .el-card__body {
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-content {
  max-height: none; /* 移除高度限制 */
  overflow-y: visible; /* 允许内容完全显示 */
}

/* 新增的计划展示样式 */
.itinerary-container {
  padding: 10px 0;
}

.display-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.day-header:hover {
  background: #e0f2fe;
}

.day-summary {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.activity-count, .daily-cost {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.day-content {
  padding: 0 12px 20px;
}

/* 简洁视图样式 */
.activities-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.activity-time {
  font-weight: 600;
  color: #409eff;
  min-width: 60px;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.activity-name {
  font-weight: 500;
}

/* 详细视图样式 */
.activities-detailed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item-detailed {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.activity-header {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.activity-time-detailed {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
  min-width: 80px;
}

.activity-main {
  flex: 1;
}

.activity-name-detailed {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.activity-description {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #666;
  line-height: 1.6;
}

.activity-location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
}

/* 餐饮和住宿信息样式 */
.day-meals, .day-accommodation {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
}

.day-meals h6, .day-accommodation h6 {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 14px;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meal-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meal-restaurant {
  flex: 1;
  font-weight: 500;
}

.accommodation-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hotel-name {
  flex: 1;
  font-weight: 500;
}

/* 旅行贴士样式 */
.travel-tips {
  margin-top: 24px;
  padding: 16px;
  background: #fff7e6;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
}

.travel-tips h5 {
  margin: 0 0 12px 0;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #666;
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

/* 预算概览样式 */
.budget-overview {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.budget-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.budget-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.budget-icon {
  color: #409eff;
  font-size: 16px;
}

.budget-label {
  color: #666;
  font-weight: 500;
}

.budget-value {
  color: #333;
  font-weight: 600;
  font-size: 15px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 每日预算样式 */
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.day-header:hover {
  background: #e9ecef;
}

.day-title-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-title-section h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.day-budget {
  display: flex;
  align-items: center;
  gap: 4px;
}

.budget-icon-small {
  color: #67c23a;
  font-size: 14px;
}

.daily-budget-text {
  color: #67c23a;
  font-size: 13px;
  font-weight: 500;
}

.day-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-count {
  color: #666;
  font-size: 14px;
}

.expand-icon {
  color: #999;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
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

  /* 移动端计划展示优化 */
  .display-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .day-header {
    padding: 10px;
  }

  .day-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .activity-item-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .activity-time {
    min-width: auto;
  }

  .activity-header {
    flex-direction: column;
    gap: 8px;
  }

  .activity-time-detailed {
    min-width: auto;
    font-size: 14px;
  }

  .activity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .accommodation-info, .meal-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .plan-content {
    padding: 10px;
  }
}

.marker-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.marker-info p {
  margin: 0;
  font-size: 12px;
  color: #606266;
}

.plan-tabs {
  margin-bottom: 20px;
}

.generate-section,
.history-section {
  padding: 10px 0;
}

.temp-history-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.temp-history-section h4 {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h4 {
  margin: 0;
  color: #303133;
}

.loading-state {
  padding: 20px;
}

.empty-history {
  padding: 40px 20px;
  text-align: center;
}

.saved-history-list {
  max-height: 400px;
  overflow-y: auto;
}

.saved-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.saved-history-item:hover {
  background: #e3f2fd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-content {
  flex: 1;
}

.history-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.history-destination {
  color: #606266;
  font-size: 14px;
  margin-bottom: 5px;
}

.history-info {
  color: #909399;
  font-size: 12px;
  margin-bottom: 5px;
}

.history-date {
  color: #c0c4cc;
  font-size: 11px;
}

.history-actions {
  margin-left: 15px;
}

.plan-actions {
  margin-top: 10px;
}

.voice-text {
  margin-top: 10px;
}

.history-content {
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
  max-height: none; /* 移除高度限制 */
  overflow-y: visible; /* 允许内容完全显示 */
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

/* 预算显示样式 */
/* 简洁视图预算样式 */
.day-budget-summary {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.budget-summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.budget-icon-compact {
  color: white;
  font-size: 16px;
}

.budget-text {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

/* 详细视图预算样式 */
.day-budget-detailed {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.budget-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.budget-section-title .el-icon {
  color: #67c23a;
  font-size: 18px;
}

.budget-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.budget-item.budget-total {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
  font-weight: 600;
  border: none;
  margin-top: 4px;
}

.budget-category {
  font-size: 14px;
  color: #666;
}

.budget-item.budget-total .budget-category {
  color: white;
}

.budget-amount {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.budget-item.budget-total .budget-amount {
  color: white;
}

/* 活动预算样式 */
.activity-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 12px;
  font-weight: 500;
}

.activity-cost .el-icon {
  font-size: 12px;
}

/* 餐饮预算样式 */
.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.meal-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meal-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 13px;
  font-weight: 500;
}

.meal-cost .el-icon {
  font-size: 13px;
}

/* 住宿预算样式 */
.accommodation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.accommodation-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.accommodation-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 14px;
  font-weight: 600;
}

.accommodation-cost .el-icon {
  font-size: 14px;
}

/* 预算样式响应式设计 */
@media (max-width: 768px) {
  .budget-breakdown {
    gap: 6px;
  }
  
  .budget-item {
    padding: 6px 10px;
  }
  
  .budget-category,
  .budget-amount {
    font-size: 13px;
  }
  
  .day-budget-summary {
    padding: 10px 12px;
  }
  
  .budget-text {
    font-size: 13px;
  }
}
</style>
