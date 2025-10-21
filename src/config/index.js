// 运行时环境变量读取函数
const getEnvVar = (key, defaultValue = '') => {
  // 优先从 window.__ENV__ 读取（Docker 运行时注入）
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  
  // 回退到构建时环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  return defaultValue;
};

// API配置管理
const config = {
  // LLM API配置
  llm: {
    apiUrl: getEnvVar('VITE_LLM_API_URL', 'https://api.openai.com/v1/chat/completions'),
    apiKey: getEnvVar('VITE_LLM_API_KEY', ''),
    model: getEnvVar('VITE_LLM_MODEL', 'gpt-3.5-turbo'),
    timeout: 30000,
    maxTokens: 2000,
    temperature: 0.7
  },
  
  // Supabase配置
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL', ''),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', '')
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