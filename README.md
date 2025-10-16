# AI Travel Planner

智能旅行规划应用 - 基于 Vue 3 + Element Plus + Supabase 的现代化旅行助手

## 功能特性

- 🎯 智能旅行规划
- 💰 预算管理
- 🗺️ 地图导航
- 🎤 语音输入
- 👤 用户认证
- 📱 响应式设计

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **后端服务**: Supabase
- **地图服务**: 高德地图 API
- **语音识别**: Web Speech API

## 项目结构

```
src/
├── components/          # 公共组件
├── views/              # 页面组件
├── stores/             # Pinia 状态管理
├── services/           # API 服务
├── router/             # 路由配置
└── config/             # 配置文件
```

## 开发环境设置

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制 `.env.example` 到 `.env` 并配置相应的环境变量：

```bash
cp .env.example .env
```

配置以下环境变量：
- `VITE_SUPABASE_URL`: Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `VITE_AMAP_KEY`: 高德地图 API 密钥

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

## 主要功能

### 1. 用户认证
- 用户注册/登录
- 密码重置
- 用户资料管理

### 2. 旅行规划
- AI 智能推荐
- 自定义行程
- 景点信息查询

### 3. 预算管理
- 预算设置
- 费用跟踪
- 消费分析

### 4. 地图导航
- 实时定位
- 路线规划
- 景点标记

### 5. 语音交互
- 语音输入
- 智能对话
- 语音导航

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
