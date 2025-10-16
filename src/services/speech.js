/**
 * 语音识别服务
 * 支持浏览器原生Web Speech API和第三方语音服务
 */

class SpeechService {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.isSupported = false
    this.callbacks = {
      onResult: null,
      onError: null,
      onStart: null,
      onEnd: null
    }
    
    this.init()
  }

  /**
   * 初始化语音识别
   */
  init() {
    // 检查浏览器支持
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition()
      this.isSupported = true
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition()
      this.isSupported = true
    } else {
      console.warn('浏览器不支持语音识别')
      this.isSupported = false
      return
    }

    // 配置语音识别
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'zh-CN'
    this.recognition.maxAlternatives = 1

    // 绑定事件
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.recognition) return

    // 开始识别
    this.recognition.onstart = () => {
      this.isListening = true
      console.log('语音识别已开始')
      if (this.callbacks.onStart) {
        this.callbacks.onStart()
      }
    }

    // 识别结果
    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (this.callbacks.onResult) {
        this.callbacks.onResult({
          final: finalTranscript,
          interim: interimTranscript,
          isFinal: finalTranscript.length > 0
        })
      }
    }

    // 识别结束
    this.recognition.onend = () => {
      this.isListening = false
      console.log('语音识别已结束')
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd()
      }
    }

    // 识别错误
    this.recognition.onerror = (event) => {
      this.isListening = false
      console.error('语音识别错误:', event.error)
      
      let errorMessage = '语音识别出错'
      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试'
          break
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查权限'
          break
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝'
          break
        case 'network':
          errorMessage = '网络错误，请检查网络连接'
          break
        case 'service-not-allowed':
          errorMessage = '语音服务不可用'
          break
        default:
          errorMessage = `语音识别错误: ${event.error}`
      }

      if (this.callbacks.onError) {
        this.callbacks.onError(errorMessage)
      }
    }
  }

  /**
   * 开始语音识别
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onResult - 识别结果回调
   * @param {Function} callbacks.onError - 错误回调
   * @param {Function} callbacks.onStart - 开始回调
   * @param {Function} callbacks.onEnd - 结束回调
   */
  startListening(callbacks = {}) {
    if (!this.isSupported) {
      const error = '浏览器不支持语音识别'
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      return Promise.reject(new Error(error))
    }

    if (this.isListening) {
      console.warn('语音识别已在进行中')
      return Promise.resolve()
    }

    // 设置回调函数
    this.callbacks = { ...this.callbacks, ...callbacks }

    try {
      this.recognition.start()
      return Promise.resolve()
    } catch (error) {
      console.error('启动语音识别失败:', error)
      if (callbacks.onError) {
        callbacks.onError('启动语音识别失败')
      }
      return Promise.reject(error)
    }
  }

  /**
   * 停止语音识别
   */
  stopListening() {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('停止语音识别失败:', error)
    }
  }

  /**
   * 检查麦克风权限
   */
  async checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('麦克风权限检查失败:', error)
      return false
    }
  }

  /**
   * 请求麦克风权限
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('请求麦克风权限失败:', error)
      throw new Error('无法获取麦克风权限，请在浏览器设置中允许麦克风访问')
    }
  }

  /**
   * 设置语言
   * @param {string} lang - 语言代码 (如: 'zh-CN', 'en-US')
   */
  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return [
      { code: 'zh-CN', name: '中文(普通话)' },
      { code: 'zh-HK', name: '中文(粤语)' },
      { code: 'zh-TW', name: '中文(台湾)' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'es-ES', name: 'Español' }
    ]
  }

  /**
   * 检查是否支持语音识别
   */
  isRecognitionSupported() {
    return this.isSupported
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      language: this.recognition?.lang || 'zh-CN'
    }
  }
}

// 语音合成服务
class SpeechSynthesisService {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.isSupported = 'speechSynthesis' in window
    this.voices = []
    this.currentUtterance = null
    
    this.init()
  }

  /**
   * 初始化语音合成
   */
  init() {
    if (!this.isSupported) {
      console.warn('浏览器不支持语音合成')
      return
    }

    // 加载语音列表
    this.loadVoices()
    
    // 监听语音列表变化
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices()
      }
    }
  }

  /**
   * 加载可用语音
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices()
  }

  /**
   * 语音播报
   * @param {string} text - 要播报的文本
   * @param {Object} options - 播报选项
   * @param {string} options.lang - 语言
   * @param {number} options.rate - 语速 (0.1-10)
   * @param {number} options.pitch - 音调 (0-2)
   * @param {number} options.volume - 音量 (0-1)
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('浏览器不支持语音合成')
      return Promise.reject(new Error('浏览器不支持语音合成'))
    }

    // 停止当前播报
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // 设置参数
    utterance.lang = options.lang || 'zh-CN'
    utterance.rate = options.rate || 1
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    // 选择合适的语音
    const voice = this.findVoice(utterance.lang)
    if (voice) {
      utterance.voice = voice
    }

    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`语音播报失败: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    })
  }

  /**
   * 停止语音播报
   */
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  /**
   * 暂停语音播报
   */
  pause() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
    }
  }

  /**
   * 恢复语音播报
   */
  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  /**
   * 查找合适的语音
   * @param {string} lang - 语言代码
   */
  findVoice(lang) {
    // 优先查找完全匹配的语音
    let voice = this.voices.find(v => v.lang === lang)
    
    // 如果没找到，查找语言前缀匹配的
    if (!voice) {
      const langPrefix = lang.split('-')[0]
      voice = this.voices.find(v => v.lang.startsWith(langPrefix))
    }
    
    return voice
  }

  /**
   * 获取可用语音列表
   */
  getVoices() {
    return this.voices
  }

  /**
   * 检查是否正在播报
   */
  isSpeaking() {
    return this.synthesis.speaking
  }
}

// 创建服务实例
const speechRecognition = new SpeechService()
const speechSynthesis = new SpeechSynthesisService()

export {
  speechRecognition,
  speechSynthesis,
  SpeechService,
  SpeechSynthesisService
}

export default speechRecognition