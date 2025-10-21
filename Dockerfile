# 多阶段构建 - 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产阶段
FROM nginx:alpine AS production

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制 Docker 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh

# 设置脚本执行权限
RUN chmod +x /docker-entrypoint.sh

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 使用自定义启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]

# 默认命令
CMD ["nginx", "-g", "daemon off;"]