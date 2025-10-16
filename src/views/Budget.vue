<template>
  <div class="budget-page">
    <div class="budget-container">
      <div class="budget-header">
        <h2>预算管理</h2>
        <p>智能分析您的旅行费用，合理规划每一笔支出</p>
      </div>

      <div class="budget-content">
        <!-- 预算概览 -->
        <div class="budget-overview">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon total">
                    <el-icon><Money /></el-icon>
                  </div>
                  <div class="card-info">
                    <div class="card-value">¥{{ totalBudget.toLocaleString() }}</div>
                    <div class="card-label">总预算</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon spent">
                    <el-icon><ShoppingCart /></el-icon>
                  </div>
                  <div class="card-info">
                    <div class="card-value">¥{{ spentAmount.toLocaleString() }}</div>
                    <div class="card-label">已花费</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon remaining">
                    <el-icon><Wallet /></el-icon>
                  </div>
                  <div class="card-info">
                    <div class="card-value">¥{{ remainingBudget.toLocaleString() }}</div>
                    <div class="card-label">剩余预算</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="overview-card">
                <div class="card-content">
                  <div class="card-icon percentage" :class="{ warning: budgetUsagePercentage > 80 }">
                    <el-icon><PieChart /></el-icon>
                  </div>
                  <div class="card-info">
                    <div class="card-value">{{ budgetUsagePercentage }}%</div>
                    <div class="card-label">使用率</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 预算分配 -->
        <div class="budget-allocation">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>预算分配</span>
                    <el-button size="small" @click="showAllocationDialog = true">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                </template>
                <div class="allocation-chart">
                  <div class="chart-container">
                    <canvas ref="allocationChart" width="300" height="300"></canvas>
                  </div>
                  <div class="allocation-legend">
                    <div
                      v-for="(item, index) in budgetCategories"
                      :key="item.name"
                      class="legend-item"
                    >
                      <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
                      <span class="legend-name">{{ item.name }}</span>
                      <span class="legend-value">¥{{ item.amount.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>支出趋势</span>
                </template>
                <div class="expense-trend">
                  <canvas ref="trendChart" width="400" height="300"></canvas>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 智能分析 -->
        <div class="expense-analysis">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>智能费用分析</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="analyzeExpenses"
                  :loading="isAnalyzing"
                >
                  <el-icon><PieChart /></el-icon>
                  {{ isAnalyzing ? '分析中...' : '开始分析' }}
                </el-button>
              </div>
            </template>
            <div v-if="analysisResult" class="analysis-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="analysis-section">
                    <h4>支出模式分析</h4>
                    <p>{{ analysisResult.spendingPattern }}</p>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="analysis-section">
                    <h4>预算建议</h4>
                    <ul>
                      <li v-for="suggestion in analysisResult.suggestions" :key="suggestion">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20" style="margin-top: 20px;">
                <el-col :span="24">
                  <div class="analysis-section">
                    <h4>优化建议</h4>
                    <el-alert
                      v-for="(tip, index) in analysisResult.optimizationTips"
                      :key="index"
                      :title="tip"
                      type="info"
                      :closable="false"
                      style="margin-bottom: 10px;"
                    />
                  </div>
                </el-col>
              </el-row>
            </div>
            <div v-else class="no-analysis">
              <el-empty description="点击上方按钮开始智能分析您的旅行费用" />
            </div>
          </el-card>
        </div>

        <!-- 支出记录 -->
        <div class="expense-records">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>支出记录</span>
                <el-button type="primary" size="small" @click="showExpenseDialog = true">
                  <el-icon><Plus /></el-icon>
                  添加支出
                </el-button>
              </div>
            </template>
            <el-table :data="expenses" style="width: 100%">
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="category" label="类别" width="100">
                <template #default="scope">
                  <el-tag :type="getCategoryTagType(scope.row.category)">
                    {{ scope.row.category }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="amount" label="金额" width="120">
                <template #default="scope">
                  <span class="expense-amount">¥{{ scope.row.amount.toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button size="small" @click="editExpense(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteExpense(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 预算分配对话框 -->
    <el-dialog v-model="showAllocationDialog" title="编辑预算分配" width="500px">
      <el-form :model="allocationForm" label-width="80px">
        <el-form-item label="总预算">
          <el-input-number v-model="allocationForm.total" :min="0" :step="100" />
        </el-form-item>
        <el-form-item
          v-for="category in allocationForm.categories"
          :key="category.name"
          :label="category.name"
        >
          <el-input-number v-model="category.amount" :min="0" :step="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAllocationDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAllocation">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加支出对话框 -->
    <el-dialog v-model="showExpenseDialog" title="添加支出" width="400px">
      <el-form :model="expenseForm" label-width="80px">
        <el-form-item label="日期" required>
          <el-date-picker v-model="expenseForm.date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-select v-model="expenseForm.category" style="width: 100%">
            <el-option
              v-for="category in budgetCategories"
              :key="category.name"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" required>
          <el-input v-model="expenseForm.description" />
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number v-model="expenseForm.amount" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="addExpense">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { analyzeTravelCost } from '@/services/llm'
import { Money, ShoppingCart, Wallet, PieChart, Edit, Plus } from '@element-plus/icons-vue'

// 响应式数据
const totalBudget = ref(10000)
const showAllocationDialog = ref(false)
const showExpenseDialog = ref(false)

const budgetCategories = ref([
  { name: '交通', amount: 3000, color: '#409EFF' },
  { name: '住宿', amount: 2500, color: '#67C23A' },
  { name: '餐饮', amount: 2000, color: '#E6A23C' },
  { name: '景点', amount: 1500, color: '#F56C6C' },
  { name: '购物', amount: 1000, color: '#909399' }
])

const expenses = ref([
  { date: '2024-01-15', category: '交通', description: '机票预订', amount: 2800 },
  { date: '2024-01-16', category: '住宿', description: '酒店预订', amount: 1200 },
  { date: '2024-01-17', category: '餐饮', description: '晚餐', amount: 280 },
  { date: '2024-01-18', category: '景点', description: '门票', amount: 150 }
])

const allocationForm = ref({
  total: 10000,
  categories: [...budgetCategories.value]
})

const expenseForm = ref({
  date: new Date(),
  category: '',
  description: '',
  amount: 0
})

// 计算属性
const spentAmount = computed(() => {
  return expenses.value.reduce((total, expense) => total + expense.amount, 0)
})

const remainingBudget = computed(() => {
  return totalBudget.value - spentAmount.value
})

const budgetUsagePercentage = computed(() => {
  return Math.round((spentAmount.value / totalBudget.value) * 100)
})

// 图表引用
const allocationChart = ref(null)
const trendChart = ref(null)

// 方法
const getCategoryTagType = (category) => {
  const typeMap = {
    '交通': 'primary',
    '住宿': 'success',
    '餐饮': 'warning',
    '景点': 'danger',
    '购物': 'info'
  }
  return typeMap[category] || 'default'
}

const drawAllocationChart = () => {
  if (!allocationChart.value) return
  
  const ctx = allocationChart.value.getContext('2d')
  const centerX = 150
  const centerY = 150
  const radius = 100
  
  let currentAngle = 0
  const total = budgetCategories.value.reduce((sum, item) => sum + item.amount, 0)
  
  // 清空画布
  ctx.clearRect(0, 0, 300, 300)
  
  budgetCategories.value.forEach(item => {
    const sliceAngle = (item.amount / total) * 2 * Math.PI
    
    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()
    
    currentAngle += sliceAngle
  })
  
  // 绘制中心圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI)
  ctx.fillStyle = '#fff'
  ctx.fill()
  
  // 绘制中心文字
  ctx.fillStyle = '#303133'
  ctx.font = '16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('总预算', centerX, centerY - 5)
  ctx.fillText(`¥${totalBudget.value.toLocaleString()}`, centerX, centerY + 15)
}

const drawTrendChart = () => {
  if (!trendChart.value) return
  
  const ctx = trendChart.value.getContext('2d')
  const width = 400
  const height = 300
  const padding = 40
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 模拟数据
  const data = [0, 500, 1200, 2800, 4000, 4430]
  const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']
  
  const maxValue = Math.max(...data)
  const stepX = (width - 2 * padding) / (data.length - 1)
  const stepY = (height - 2 * padding) / maxValue
  
  // 绘制网格线
  ctx.strokeStyle = '#e4e7ed'
  ctx.lineWidth = 1
  
  // 垂直网格线
  for (let i = 0; i < data.length; i++) {
    const x = padding + i * stepX
    ctx.beginPath()
    ctx.moveTo(x, padding)
    ctx.lineTo(x, height - padding)
    ctx.stroke()
  }
  
  // 水平网格线
  for (let i = 0; i <= 5; i++) {
    const y = padding + i * (height - 2 * padding) / 5
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }
  
  // 绘制折线
  ctx.strokeStyle = '#409EFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  
  data.forEach((value, index) => {
    const x = padding + index * stepX
    const y = height - padding - value * stepY
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // 绘制数据点
  ctx.fillStyle = '#409EFF'
  data.forEach((value, index) => {
    const x = padding + index * stepX
    const y = height - padding - value * stepY
    
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  // 绘制标签
  ctx.fillStyle = '#606266'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  
  labels.forEach((label, index) => {
    const x = padding + index * stepX
    ctx.fillText(label, x, height - 10)
  })
}

const saveAllocation = () => {
  totalBudget.value = allocationForm.value.total
  budgetCategories.value = [...allocationForm.value.categories]
  showAllocationDialog.value = false
  
  nextTick(() => {
    drawAllocationChart()
  })
  
  ElMessage.success('预算分配已保存')
}

const addExpense = () => {
  if (!expenseForm.value.category || !expenseForm.value.description || !expenseForm.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  expenses.value.unshift({
    date: expenseForm.value.date.toISOString().split('T')[0],
    category: expenseForm.value.category,
    description: expenseForm.value.description,
    amount: expenseForm.value.amount
  })
  
  // 重置表单
  expenseForm.value = {
    date: new Date(),
    category: '',
    description: '',
    amount: 0
  }
  
  showExpenseDialog.value = false
  ElMessage.success('支出记录已添加')
  
  nextTick(() => {
    drawTrendChart()
  })
}

const editExpense = (expense) => {
  ElMessage.info('编辑功能开发中')
}

const deleteExpense = (index) => {
  expenses.value.splice(index, 1)
  ElMessage.success('支出记录已删除')
  
  nextTick(() => {
    drawTrendChart()
  })
}

onMounted(() => {
  nextTick(() => {
    drawAllocationChart()
    drawTrendChart()
  })
})

// 智能分析相关
const isAnalyzing = ref(false)
const analysisResult = ref(null)

// 智能费用分析
const analyzeExpenses = async () => {
  if (expenses.value.length === 0) {
    ElMessage.warning('暂无费用记录，无法进行分析')
    return
  }
  
  isAnalyzing.value = true
  
  try {
    const analysisData = {
      totalBudget: totalBudget.value,
      spentAmount: spentAmount.value,
      expenses: expenses.value,
      categories: budgetCategories.value
    }
    
    const result = await analyzeTravelCost(analysisData)
    analysisResult.value = result
    
    ElMessage.success('费用分析完成')
  } catch (error) {
    console.error('费用分析失败:', error)
    ElMessage.error('费用分析失败，请重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 预算优化建议
const getBudgetSuggestions = () => {
  const suggestions = []
  
  // 检查预算使用率
  if (budgetUsagePercentage.value > 80) {
    suggestions.push({
      type: 'warning',
      message: '预算使用率较高，建议控制后续支出'
    })
  }
  
  // 检查各类别支出
  budgetCategories.value.forEach(category => {
    const categoryExpenses = expenses.value
      .filter(expense => expense.category === category.name)
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const usageRate = (categoryExpenses / category.amount) * 100
    
    if (usageRate > 90) {
      suggestions.push({
        type: 'danger',
        message: `${category.name}类别预算即将超支，已使用${usageRate.toFixed(1)}%`
      })
    } else if (usageRate < 30) {
      suggestions.push({
        type: 'info',
        message: `${category.name}类别预算使用较少，可适当增加相关支出`
      })
    }
  })
  
  return suggestions
}
</script>

<style scoped>
.budget-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.budget-container {
  max-width: 1200px;
  margin: 0 auto;
}

.budget-header {
  margin-bottom: 30px;
}

.budget-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
}

.budget-header p {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.budget-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.budget-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 20px;
}

.card-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.spent {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.remaining {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.percentage {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-icon.percentage.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

.budget-allocation {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.allocation-chart {
  display: flex;
  align-items: center;
  gap: 30px;
}

.chart-container {
  flex-shrink: 0;
}

.allocation-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 10px;
}

.legend-name {
  flex: 1;
  color: #303133;
}

.legend-value {
  font-weight: bold;
  color: #409EFF;
}

.expense-trend {
  text-align: center;
}

.expense-records {
  margin-bottom: 20px;
}

.expense-amount {
  font-weight: bold;
  color: #F56C6C;
}

.expense-analysis {
  margin-bottom: 20px;
}

.analysis-content {
  padding: 20px 0;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-section h4 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 16px;
}

.analysis-section p {
  line-height: 1.6;
  color: #606266;
}

.analysis-section ul {
  margin: 0;
  padding-left: 20px;
}

.analysis-section li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.5;
}

.no-analysis {
  padding: 40px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .budget-page {
    padding: 10px;
  }
  
  .allocation-chart {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-container {
    margin-bottom: 20px;
  }
}
</style>