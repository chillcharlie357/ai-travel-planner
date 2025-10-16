import axios from 'axios'
import { config } from '@/config'

// 创建LLM API客户端
const llmClient = axios.create({
  baseURL: config.llm.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.llm.apiKey}`
  }
})

// 请求拦截器
llmClient.interceptors.request.use(
  (config) => {
    console.log('LLM API Request:', config.url)
    return config
  },
  (error) => {
    console.error('LLM API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
llmClient.interceptors.response.use(
  (response) => {
    console.log('LLM API Response:', response.status)
    return response
  },
  (error) => {
    console.error('LLM API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * 生成旅行计划
 * @param {Object} params - 旅行参数
 * @param {string} params.destination - 目的地
 * @param {number} params.days - 天数
 * @param {number} params.budget - 预算
 * @param {number} params.travelers - 旅行人数
 * @param {string} params.preferences - 旅行偏好
 * @param {string} params.startDate - 开始日期
 * @returns {Promise<Object>} 旅行计划
 */
export const generateTravelPlan = async (params) => {
  try {
    const prompt = createTravelPlanPrompt(params)
    
    const response = await llmClient.post('/chat/completions', {
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的旅行规划师，能够根据用户需求生成详细的旅行计划。请以JSON格式返回结构化的旅行计划。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.data.choices[0].message.content
    return parseTravelPlanResponse(content)
  } catch (error) {
    console.error('生成旅行计划失败:', error)
    throw new Error('生成旅行计划失败，请稍后重试')
  }
}

/**
 * 分析旅行费用
 * @param {Object} travelPlan - 旅行计划
 * @returns {Promise<Object>} 费用分析结果
 */
export const analyzeTravelCost = async (travelPlan) => {
  try {
    const prompt = createCostAnalysisPrompt(travelPlan)
    
    const response = await llmClient.post('/chat/completions', {
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: '你是一个旅行费用分析专家，能够详细分析旅行计划的各项费用。请以JSON格式返回结构化的费用分析。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const content = response.data.choices[0].message.content
    return parseCostAnalysisResponse(content)
  } catch (error) {
    console.error('分析旅行费用失败:', error)
    throw new Error('分析旅行费用失败，请稍后重试')
  }
}

/**
 * 优化旅行路线
 * @param {Object} params - 优化参数
 * @param {Array} params.destinations - 目的地列表
 * @param {string} params.startLocation - 起始位置
 * @param {string} params.transportation - 交通方式
 * @returns {Promise<Object>} 优化后的路线
 */
export const optimizeRoute = async (params) => {
  try {
    const prompt = createRouteOptimizationPrompt(params)
    
    const response = await llmClient.post('/chat/completions', {
      model: config.llm.model,
      messages: [
        {
          role: 'system',
          content: '你是一个路线优化专家，能够根据地理位置和交通方式优化旅行路线。请以JSON格式返回优化后的路线。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const content = response.data.choices[0].message.content
    return parseRouteOptimizationResponse(content)
  } catch (error) {
    console.error('优化旅行路线失败:', error)
    throw new Error('优化旅行路线失败，请稍后重试')
  }
}

/**
 * 创建旅行计划提示词
 */
function createTravelPlanPrompt(params) {
  return `
请为我生成一个详细的旅行计划，要求如下：

目的地：${params.destination}
旅行天数：${params.days}天
预算：${params.budget}元
旅行人数：${params.travelers}人
旅行偏好：${params.preferences}
出发日期：${params.startDate}

请生成包含以下内容的JSON格式旅行计划：
{
  "title": "旅行计划标题",
  "summary": "行程概要",
  "totalCost": 预计总费用,
  "days": [
    {
      "day": 1,
      "date": "日期",
      "theme": "当日主题",
      "activities": [
        {
          "time": "时间",
          "activity": "活动名称",
          "location": "地点",
          "description": "详细描述",
          "cost": 费用,
          "coordinates": [经度, 纬度]
        }
      ]
    }
  ],
  "accommodation": [
    {
      "name": "酒店名称",
      "type": "酒店类型",
      "location": "位置",
      "pricePerNight": 每晚价格,
      "coordinates": [经度, 纬度]
    }
  ],
  "transportation": [
    {
      "type": "交通方式",
      "route": "路线",
      "cost": 费用,
      "duration": "时长"
    }
  ],
  "tips": ["旅行贴士1", "旅行贴士2"]
}
`
}

/**
 * 创建费用分析提示词
 */
function createCostAnalysisPrompt(travelPlan) {
  return `
请分析以下旅行计划的详细费用：

${JSON.stringify(travelPlan, null, 2)}

请生成包含以下内容的JSON格式费用分析：
{
  "totalBudget": 总预算,
  "categories": [
    {
      "name": "费用类别",
      "amount": 金额,
      "percentage": 占比百分比,
      "items": [
        {
          "name": "具体项目",
          "cost": 费用,
          "description": "说明"
        }
      ]
    }
  ],
  "dailyCosts": [
    {
      "day": 天数,
      "date": "日期",
      "cost": 当日费用,
      "breakdown": {
        "accommodation": 住宿费用,
        "food": 餐饮费用,
        "transportation": 交通费用,
        "activities": 活动费用,
        "shopping": 购物费用
      }
    }
  ],
  "costSavingTips": ["省钱建议1", "省钱建议2"],
  "budgetWarnings": ["预算警告1", "预算警告2"]
}
`
}

/**
 * 创建路线优化提示词
 */
function createRouteOptimizationPrompt(params) {
  return `
请优化以下旅行路线：

起始位置：${params.startLocation}
目的地列表：${params.destinations.join(', ')}
交通方式：${params.transportation}

请生成包含以下内容的JSON格式优化路线：
{
  "optimizedRoute": [
    {
      "order": 顺序,
      "location": "地点名称",
      "coordinates": [经度, 纬度],
      "stayDuration": "建议停留时间",
      "travelTime": "到下一地点的时间",
      "travelDistance": "到下一地点的距离"
    }
  ],
  "totalDistance": "总距离",
  "totalTravelTime": "总旅行时间",
  "optimizationReason": "优化原因说明"
}
`
}

/**
 * 解析旅行计划响应
 */
function parseTravelPlanResponse(content) {
  try {
    // 尝试提取JSON内容
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // 如果没有找到JSON，返回默认结构
    return createDefaultTravelPlan(content)
  } catch (error) {
    console.error('解析旅行计划响应失败:', error)
    return createDefaultTravelPlan(content)
  }
}

/**
 * 解析费用分析响应
 */
function parseCostAnalysisResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return createDefaultCostAnalysis()
  } catch (error) {
    console.error('解析费用分析响应失败:', error)
    return createDefaultCostAnalysis()
  }
}

/**
 * 解析路线优化响应
 */
function parseRouteOptimizationResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return createDefaultRouteOptimization()
  } catch (error) {
    console.error('解析路线优化响应失败:', error)
    return createDefaultRouteOptimization()
  }
}

/**
 * 创建默认旅行计划
 */
function createDefaultTravelPlan(content) {
  return {
    title: '个性化旅行计划',
    summary: content.substring(0, 200) + '...',
    totalCost: 8000,
    days: [
      {
        day: 1,
        date: new Date().toISOString().split('T')[0],
        theme: '抵达与探索',
        activities: [
          {
            time: '09:00',
            activity: '抵达目的地',
            location: '机场/车站',
            description: '抵达目的地，前往酒店办理入住',
            cost: 0,
            coordinates: [116.4074, 39.9042]
          }
        ]
      }
    ],
    accommodation: [
      {
        name: '推荐酒店',
        type: '商务酒店',
        location: '市中心',
        pricePerNight: 300,
        coordinates: [116.4074, 39.9042]
      }
    ],
    transportation: [
      {
        type: '飞机',
        route: '往返机票',
        cost: 2000,
        duration: '2小时'
      }
    ],
    tips: ['提前预订可享受优惠', '注意当地天气变化']
  }
}

/**
 * 创建默认费用分析
 */
function createDefaultCostAnalysis() {
  return {
    totalBudget: 8000,
    categories: [
      {
        name: '交通',
        amount: 2400,
        percentage: 30,
        items: [
          { name: '往返机票', cost: 2000, description: '经济舱' },
          { name: '当地交通', cost: 400, description: '地铁、出租车等' }
        ]
      },
      {
        name: '住宿',
        amount: 2000,
        percentage: 25,
        items: [
          { name: '酒店住宿', cost: 2000, description: '4晚商务酒店' }
        ]
      }
    ],
    dailyCosts: [],
    costSavingTips: ['提前预订享受早鸟优惠', '选择当地特色餐厅性价比更高'],
    budgetWarnings: []
  }
}

/**
 * 创建默认路线优化
 */
function createDefaultRouteOptimization() {
  return {
    optimizedRoute: [],
    totalDistance: '0公里',
    totalTravelTime: '0小时',
    optimizationReason: '路线优化中，请稍后重试'
  }
}

export default {
  generateTravelPlan,
  analyzeTravelCost,
  optimizeRoute
}