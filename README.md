# AI Travel Planner

智能旅行规划应用 - 基于 Vue 3 + Element Plus + Supabase 的现代化旅行助手

## 功能特性

- 🎯 智能旅行规划
- 💰 预算管理
- 🗺️ 地图导航
- 🎤 语音输入
- 👤 用户认证
- 📱 响应式设计
- 🐳 Docker 容器化部署

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **后端服务**: Supabase
- **地图服务**: OpenStreetMap
- **语音识别**: Web Speech API
- **容器化**: Docker + Docker Compose

## 项目结构

```
src/
├── components/          # 公共组件
├── views/              # 页面组件
├── stores/             # Pinia 状态管理
├── services/           # API 服务
├── router/             # 路由配置
├── config/             # 配置文件
└── utils/              # 工具函数
scripts/                # 部署脚本
├── deploy.sh           # Linux/macOS 部署脚本
└── deploy.bat          # Windows 部署脚本
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Docker (可选，用于容器化部署)

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-travel-planner
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **环境配置**
   
   复制环境变量模板：
   ```bash
   cp .env.example .env
   ```
   
   配置以下环境变量：
   ```bash
   # Supabase 配置
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # LLM API 配置
   VITE_LLM_API_URL=https://api.openai.com/v1
   VITE_LLM_API_KEY=your-llm-api-key
   VITE_LLM_MODEL=gpt-3.5-turbo
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **构建生产版本**
   ```bash
   pnpm build
   ```

## Docker 部署

### 快速部署

**Windows 用户：**
```cmd
scripts\deploy.bat deploy
```

**Linux/macOS 用户：**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

### 手动部署

1. **准备环境变量文件**
   ```bash
   cp .env.docker .env.docker.local
   ```
   
   编辑 `.env.docker.local` 并填入实际配置：
   ```bash
   # LLM API 配置
   VITE_LLM_API_URL=https://api.openai.com/v1
   VITE_LLM_API_KEY=your-actual-api-key
   VITE_LLM_MODEL=gpt-3.5-turbo
   
   # Supabase 配置
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

2. **拉取并启动镜像**
   ```bash
   # 拉取最新镜像
   docker pull registry.cn-hangzhou.aliyuncs.com/mydocker_he/ai-travel-planner:latest
   
   # 运行容器
   docker run -d -p 80:80 \
     --env-file .env.docker.local \
     --name ai-travel-planner \
     registry.cn-hangzhou.aliyuncs.com/mydocker_he/ai-travel-planner:latest
   ```

3. **访问应用**
   
   打开浏览器访问 `http://localhost`

### 本地构建部署

如果需要本地构建镜像：
```bash
# 构建镜像
docker build -t ai-travel-planner .

# 运行容器
docker run -d -p 80:80 \
  -e VITE_LLM_API_URL="your-llm-api-url" \
  -e VITE_LLM_API_KEY="your-llm-api-key" \
  -e VITE_LLM_MODEL="your-llm-model" \
  -e VITE_SUPABASE_URL="your-supabase-url" \
  -e VITE_SUPABASE_ANON_KEY="your-supabase-anon-key" \
  --name ai-travel-planner \
  ai-travel-planner:latest
```

## CI/CD 自动化部署

### GitHub Actions 配置

项目已配置 GitHub Actions 自动构建和推送 Docker 镜像到阿里云容器镜像服务。

**镜像仓库地址**: `registry.cn-hangzhou.aliyuncs.com/mydocker_he/ai-travel-planner`

#### 设置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `ALIYUN_REGISTRY_USERNAME` | 阿里云镜像仓库用户名 | `your-username` |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云镜像仓库密码 | `your-password` |

#### 触发构建

- **自动触发**: 推送到 `main` 分支或创建 `v*` 标签
- **手动触发**: 在 GitHub Actions 页面手动运行工作流

### 镜像拉取和部署

```bash
# 拉取最新镜像
docker pull registry.cn-hangzhou.aliyuncs.com/mydocker_he/ai-travel-planner:latest

# 运行容器
docker run -d -p 80:80 \
  --env-file .env.docker.local \
  --name ai-travel-planner \
  registry.cn-hangzhou.aliyuncs.com/mydocker_he/ai-travel-planner:latest
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

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本是否为 18+
   - 确保所有依赖正确安装
   - 检查环境变量配置

2. **Docker 部署失败**
   - 确保 Docker 服务正在运行
   - 检查环境变量文件格式
   - 查看容器日志：`docker logs ai-travel-planner`

3. **API 连接失败**
   - 验证 Supabase 配置是否正确
   - 检查 LLM API 密钥是否有效
   - 确认网络连接正常

### 查看日志

```bash
# 查看应用日志
docker logs ai-travel-planner

# 实时查看日志
docker logs -f ai-travel-planner
```

## 安全注意事项

- ⚠️ **切勿将 API 密钥提交到代码仓库**
- ⚠️ **使用环境变量管理敏感配置**
- ⚠️ **定期轮换 API 密钥**
- ⚠️ **生产环境使用 HTTPS**

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
