#!/bin/sh

# Docker 容器启动脚本
# 用于在运行时将环境变量注入到前端应用中

# 定义需要注入的环境变量
ENV_VARS="VITE_LLM_API_URL VITE_LLM_API_KEY VITE_LLM_MODEL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY"

# 生成环境变量 JavaScript 文件
cat > /usr/share/nginx/html/env.js << EOF
window.__ENV__ = {
EOF

# 遍历环境变量并添加到 JavaScript 文件中
for var in $ENV_VARS; do
    value=$(eval echo \$$var)
    if [ -n "$value" ]; then
        echo "  $var: '$value'," >> /usr/share/nginx/html/env.js
    fi
done

cat >> /usr/share/nginx/html/env.js << EOF
};
EOF

# 将环境变量脚本注入到 index.html 中
# 检查是否已经注入过，避免重复注入
if ! grep -q "env.js" /usr/share/nginx/html/index.html; then
    # 在 head 标签中添加环境变量脚本
    sed -i 's|</head>|  <script src="/env.js"></script>\n</head>|' /usr/share/nginx/html/index.html
fi

echo "Environment variables injected successfully:"
cat /usr/share/nginx/html/env.js

# 启动 nginx
exec "$@"