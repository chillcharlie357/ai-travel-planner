// API配置管理
const config = {
  // 高德地图API配置
  gaode: {
    key: import.meta.env.VITE_GAODE_MAP_KEY || 'demo_key_for_development',
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Marker', 'AMap.Geocoder', 'AMap.Text']
  },
  
  // LLM API配置
  llm: {
    apiUrl: import.meta.env.VITE_LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_LLM_API_KEY || '',
    model: import.meta.env.VITE_LLM_MODEL || 'gpt-3.5-turbo',
    timeout: 30000,
    maxTokens: 2000,
    temperature: 0.7
  },
  
  // Supabase配置
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  
  // 应用配置
  app: {
    name: 'AI旅行规划师',
    version: '1.0.0',
    defaultLanguage: 'zh-CN'
  }
}

// 验证配置完整性
export const validateConfig = () => {
  const errors = []
  
  if (!config.gaode.key || config.gaode.key === 'demo_key_for_development') {
    errors.push('高德地图API密钥未配置')
  }
  
  if (!config.llm.apiKey) {
    errors.push('LLM API密钥未配置')
  }
  
  if (!config.supabase.url || !config.supabase.anonKey) {
    errors.push('Supabase配置不完整')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export { config }
export default config