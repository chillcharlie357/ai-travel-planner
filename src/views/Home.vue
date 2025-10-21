<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">AI智能旅行规划师</h1>
        <p class="hero-subtitle">让AI为您规划完美的旅行路线，享受无忧的旅行体验</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="startPlanning">
            <el-icon><LocationInformation /></el-icon>
            开始规划
          </el-button>
          <el-button size="large" @click="viewDemo">
            <el-icon><VideoPlay /></el-icon>
            查看演示
          </el-button>
        </div>
      </div>
      <div class="hero-image">
        <svg viewBox="0 0 400 300" class="travel-illustration">
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- 天空背景 -->
          <rect width="400" height="200" fill="url(#skyGradient)" />
          <!-- 山脉 -->
          <polygon points="0,150 100,80 200,120 300,60 400,100 400,200 0,200" fill="#4A90E2" opacity="0.8"/>
          <!-- 云朵 -->
          <ellipse cx="80" cy="60" rx="25" ry="15" fill="white" opacity="0.9"/>
          <ellipse cx="320" cy="40" rx="30" ry="18" fill="white" opacity="0.9"/>
          <!-- 飞机 -->
          <g transform="translate(250,80)">
            <ellipse cx="0" cy="0" rx="20" ry="3" fill="#FF6B6B"/>
            <polygon points="-15,-2 -25,-8 -20,-8 -10,-2" fill="#FF6B6B"/>
            <polygon points="15,-1 25,-3 25,3 15,1" fill="#FF6B6B"/>
          </g>
          <!-- 地面 -->
          <rect y="200" width="400" height="100" fill="#90EE90"/>
          <!-- 建筑物 -->
          <rect x="50" y="180" width="30" height="40" fill="#FFB347"/>
          <rect x="120" y="170" width="25" height="50" fill="#DDA0DD"/>
          <rect x="300" y="175" width="35" height="45" fill="#F0E68C"/>
        </svg>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Microphone /></el-icon>
            </div>
            <h3>语音规划</h3>
            <p>支持语音输入，只需说出您的旅行需求，AI即可为您生成个性化行程</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Location /></el-icon>
            </div>
            <h3>地图导航</h3>
            <p>基于OpenStreetMap，直观展示行程路线，实时导航让旅行更轻松</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <el-icon><Upload /></el-icon>
            </div>
            <h3>云端同步</h3>
            <p>基于Supabase云端存储，多设备同步，随时随地查看您的旅行计划</p>
          </div>
        </div>
      </div>
    </div>

    <div class="testimonials-section">
      <div class="container">
        <h2 class="section-title">用户评价</h2>
        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"AI旅行规划师让我的日本之旅变得完美无缺！语音规划功能特别实用，省去了很多繁琐的查找工作。"</p>
            </div>
            <div class="testimonial-author">
              <el-avatar :size="50" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png">张</el-avatar>
              <div class="author-info">
                <h4>张小姐</h4>
                <span>旅行爱好者</span>
              </div>
            </div>
          </div>
          
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"智能规划功能太棒了！帮我合理安排了欧洲15天的行程路线，每个景点都安排得恰到好处。"</p>
            </div>
            <div class="testimonial-author">
              <el-avatar :size="50" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png">李</el-avatar>
              <div class="author-info">
                <h4>李先生</h4>
                <span>商务人士</span>
              </div>
            </div>
          </div>
          
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"云端同步功能让我和朋友可以一起规划旅行，实时更新行程，协作变得如此简单！"</p>
            </div>
            <div class="testimonial-author">
              <el-avatar :size="50" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png">王</el-avatar>
              <div class="author-info">
                <h4>王同学</h4>
                <span>大学生</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>开始您的智能旅行规划之旅</h2>
          <p>加入数万用户的选择，让AI为您打造专属的旅行体验</p>
          <div class="cta-actions">
            <el-button type="primary" size="large" @click="startPlanning">
              <el-icon><LocationInformation /></el-icon>
              立即开始
            </el-button>
            <el-button size="large" plain @click="$router.push('/auth')">
              <el-icon><User /></el-icon>
              注册账户
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { LocationInformation, VideoPlay, Microphone, Location, Money, Upload, User } from '@element-plus/icons-vue'

const router = useRouter()

const startPlanning = () => {
  router.push('/plan')
}

const viewDemo = () => {
  // 创建演示对话框或跳转到演示页面
  ElMessage.info('演示功能即将上线，敬请期待！')
}
</script>

<style scoped>
.home {
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-section {
  display: flex;
  align-items: center;
  min-height: 60vh;
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  flex: 1;
  color: white;
  padding-right: 40px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 20px;
}

.hero-image {
  flex: 1;
  max-width: 400px;
}

.travel-illustration {
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.features-section {
  background: white;
  padding: 80px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  border-radius: 20px;
  background: #f8f9fa;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-content {
    padding-right: 0;
    margin-bottom: 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
}
/* 用户评价部分 */
.testimonials-section {
  background: #f8f9fa;
  padding: 80px 20px;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.testimonial-card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.testimonial-content {
  margin-bottom: 20px;
}

.testimonial-content p {
  font-style: italic;
  color: #555;
  line-height: 1.6;
  font-size: 1rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-info h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.author-info span {
  color: #888;
  font-size: 0.9rem;
}

/* 行动号召部分 */
.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  color: white;
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  font-weight: bold;
}

.cta-content p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.cta-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

@media (max-width: 768px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-content h2 {
    font-size: 2rem;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>