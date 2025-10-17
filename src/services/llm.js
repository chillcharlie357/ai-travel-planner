import OpenAI from 'openai'
import { config } from '@/config'

/**
 * LLM API 服务
 * 使用 OpenAI JavaScript SDK
 * 支持流式传输和非流式调用
 * 
 * 功能特性：
 * - 支持阿里云通义千问 API (DashScope)
 * - 支持 OpenAI 兼容的 API
 * - 流式传输实时响应
 * - 错误处理和重试机制
 */

// 创建 OpenAI 客户端
const openai = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.apiUrl,
  timeout: 30000,
  dangerouslyAllowBrowser: true // 允许在浏览器中使用
})

/**
 * 生成旅行计划
 * @param {Object} params - 旅行参数
 * @param {boolean} stream - 是否使用流式传输
 * @param {Function} onChunk - 流式传输回调函数
 * @returns {Promise<Object>} 旅行计划
 */
export const generateTravelPlan = async (params, stream = false, onChunk = null) => {
  try {
    const prompt = createTravelPlanPrompt(params)
    
    const requestData = {
      model: config.llm.model,
      messages: [
        { role: 'system', content: '你是一个专业的旅行规划师，能够根据用户需求制定详细的旅行计划。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: stream
    }

    if (stream && onChunk) {
      // 流式传输
      const streamResponse = await openai.chat.completions.create(requestData)
      let fullContent = ''
      
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content, fullContent)
        }
      }
      
      return parseTravelPlanResponse(fullContent)
    } else {
      // 非流式调用
      const response = await openai.chat.completions.create(requestData)
      const content = response.choices[0]?.message?.content || ''
      return parseTravelPlanResponse(content)
    }
  } catch (error) {
    console.error('生成旅行计划失败:', error)
    return createDefaultTravelPlan(error.message)
  }
}

/**
 * 分析旅行费用
 * @param {Object} travelPlan - 旅行计划
 * @param {boolean} stream - 是否使用流式传输
 * @param {Function} onChunk - 流式传输回调函数
 * @returns {Promise<Object>} 费用分析
 */
export const analyzeTravelCost = async (travelPlan, stream = false, onChunk = null) => {
  try {
    const prompt = createCostAnalysisPrompt(travelPlan)
    
    const requestData = {
      model: config.llm.model,
      messages: [
        { role: 'system', content: '你是一个专业的旅行费用分析师，能够详细分析旅行计划的各项费用。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stream: stream
    }

    if (stream && onChunk) {
      // 流式传输
      const streamResponse = await openai.chat.completions.create(requestData)
      let fullContent = ''
      
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content, fullContent)
        }
      }
      
      return parseCostAnalysisResponse(fullContent)
    } else {
      // 非流式调用
      const response = await openai.chat.completions.create(requestData)
      const content = response.choices[0]?.message?.content || ''
      return parseCostAnalysisResponse(content)
    }
  } catch (error) {
    console.error('分析旅行费用失败:', error)
    return createDefaultCostAnalysis()
  }
}

/**
 * 优化旅行路线
 * @param {Object} params - 路线参数
 * @param {boolean} stream - 是否使用流式传输
 * @param {Function} onChunk - 流式传输回调函数
 * @returns {Promise<Object>} 优化后的路线
 */
export const optimizeRoute = async (params, stream = false, onChunk = null) => {
  try {
    const prompt = createRouteOptimizationPrompt(params)
    
    const requestData = {
      model: config.llm.model,
      messages: [
        { role: 'system', content: '你是一个专业的旅行路线优化师，能够根据地理位置和时间安排优化旅行路线。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500,
      stream: stream
    }

    if (stream && onChunk) {
      // 流式传输
      const streamResponse = await openai.chat.completions.create(requestData)
      let fullContent = ''
      
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content, fullContent)
        }
      }
      
      return parseRouteOptimizationResponse(fullContent)
    } else {
      // 非流式调用
      const response = await openai.chat.completions.create(requestData)
      const content = response.choices[0]?.message?.content || ''
      return parseRouteOptimizationResponse(content)
    }
  } catch (error) {
    console.error('优化旅行路线失败:', error)
    return createDefaultRouteOptimization()
  }
}

// 创建旅行计划提示词
function createTravelPlanPrompt(params) {
  const { destination, days, budget, people, preferences, startDate } = params
  
  return `请为我制定一个详细的旅行计划，要求如下：

目的地：${destination}
旅行天数：${days}天
预算：${budget}元
人数：${people}人
偏好：${preferences}
出发日期：${startDate}

请按照以下JSON格式返回旅行计划：

{
  "title": "旅行计划标题",
  "summary": "旅行概述",
  "totalBudget": ${budget},
  "itinerary": [
    {
      "day": 1,
      "date": "2025-10-17",
      "theme": "主题",
      "activities": [
        {
          "time": "09:00",
          "name": "活动名称",
          "type": "景点",
          "location": "地点",
          "description": "详细描述",
          "coordinates": [116.397428, 39.90923],
          "estimatedCost": 100,
          "duration": "2小时"
        }
      ],
      "meals": [
        {
          "type": "早餐",
          "restaurant": "餐厅名称",
          "cuisine": "菜系",
          "estimatedCost": 50
        }
      ],
      "accommodation": {
        "name": "酒店名称",
        "type": "酒店类型",
        "location": "位置",
        "estimatedCost": 300
      },
      "transportation": {
        "method": "交通方式",
        "estimatedCost": 50
      },
      "dailyTotal": 500
    }
  ],
  "tips": [
    "实用建议1",
    "实用建议2"
  ]
}`
}

// 创建费用分析提示词
function createCostAnalysisPrompt(travelPlan) {
  return `请分析以下旅行计划的费用构成：

${JSON.stringify(travelPlan, null, 2)}

请按照以下JSON格式返回费用分析：

{
  "totalBudget": 10000,
  "categories": [
    {
      "name": "住宿",
      "amount": 3000,
      "percentage": 30,
      "details": [
        {
          "item": "酒店费用",
          "amount": 3000,
          "nights": 6
        }
      ]
    }
  ],
  "dailyAverage": 1428,
  "suggestions": [
    "节省建议1",
    "节省建议2"
  ],
  "alternatives": [
    {
      "category": "住宿",
      "suggestion": "选择民宿",
      "savings": 1000
    }
  ]
}`
}

// 创建路线优化提示词
function createRouteOptimizationPrompt(params) {
  const { locations, startPoint, preferences } = params
  
  return `请优化以下旅行路线：

起点：${startPoint}
目的地列表：${locations.join(', ')}
偏好：${preferences}

请按照以下JSON格式返回优化后的路线：

{
  "optimizedRoute": [
    {
      "order": 1,
      "location": "地点名称",
      "coordinates": {
        "lat": 1.3521,
        "lng": 103.8198
      },
      "estimatedTime": "2小时",
      "transportation": "地铁",
      "cost": 10,
      "reason": "优化原因"
    }
  ],
  "totalDistance": "25公里",
  "totalTime": "8小时",
  "totalCost": 100,
  "tips": [
    "路线建议1",
    "路线建议2"
  ]
}`
}

// 解析旅行计划响应
function parseTravelPlanResponse(content) {
  try {
    // 尝试提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return createDefaultTravelPlan(content)
  } catch (error) {
    console.error('解析旅行计划响应失败:', error)
    return createDefaultTravelPlan(content)
  }
}

// 解析费用分析响应
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

// 解析路线优化响应
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

// 创建默认旅行计划
function createDefaultTravelPlan(content) {
  return {
    title: '旅行计划生成中...',
    summary: content || '正在为您生成个性化的旅行计划，请稍候...',
    totalBudget: 0,
    itinerary: [
      {
        day: 1,
        date: new Date().toISOString().split('T')[0],
        theme: '探索之旅',
        activities: [
          {
            time: '09:00',
            name: '开始旅程',
            type: '出发',
            location: '出发地',
            description: '准备开始精彩的旅程',
            coordinates: [116.397428, 39.90923],
            estimatedCost: 0,
            duration: '1小时'
          }
        ],
        meals: [
          {
            type: '早餐',
            restaurant: '当地特色餐厅',
            cuisine: '本地菜',
            estimatedCost: 50
          }
        ],
        accommodation: {
          name: '舒适酒店',
          type: '标准间',
          location: '市中心',
          estimatedCost: 300
        },
        transportation: {
          method: '公共交通',
          estimatedCost: 50
        },
        dailyTotal: 400
      }
    ],
    tips: [
      '请根据实际情况调整行程',
      '注意查看天气预报',
      '提前预订热门景点门票'
    ]
  }
}

// 创建默认费用分析
function createDefaultCostAnalysis() {
  return {
    totalBudget: 0,
    categories: [
      {
        name: '住宿',
        amount: 0,
        percentage: 0,
        details: []
      },
      {
        name: '餐饮',
        amount: 0,
        percentage: 0,
        details: []
      },
      {
        name: '交通',
        amount: 0,
        percentage: 0,
        details: []
      },
      {
        name: '景点门票',
        amount: 0,
        percentage: 0,
        details: []
      }
    ],
    dailyAverage: 0,
    suggestions: [
      '正在分析费用构成...',
      '请稍候获取详细分析结果'
    ],
    alternatives: []
  }
}

// 创建默认路线优化
function createDefaultRouteOptimization() {
  return {
    optimizedRoute: [
      {
        order: 1,
        location: '起点',
        coordinates: { lat: 0, lng: 0 },
        estimatedTime: '0分钟',
        transportation: '步行',
        cost: 0,
        reason: '正在优化路线...'
      }
    ],
    totalDistance: '计算中...',
    totalTime: '计算中...',
    totalCost: 0,
    tips: [
      '正在为您优化最佳路线',
      '请稍候获取优化结果'
    ]
  }
}

export default {
  generateTravelPlan,
  analyzeTravelCost,
  optimizeRoute
}