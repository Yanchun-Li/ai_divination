# 阶段 1：构建 Next.js 静态站点
FROM node:20-alpine AS frontend
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# 同域部署时 API 与前端同源，不设 NEXT_PUBLIC_API_BASE 或设为空
ARG NEXT_PUBLIC_API_BASE=
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
RUN npm run build

# 阶段 2：运行 FastAPI + 静态文件
FROM python:3.12-slim
WORKDIR /app

# 安装 backend 依赖（与 backend/pyproject.toml 一致，版本固定）
RUN pip install --no-cache-dir \
  "fastapi>=0.110" "uvicorn[standard]>=0.29" "pydantic>=2.6" \
  "python-dotenv>=1.0" "passlib[bcrypt]>=1.7" "redis>=5.0" "httpx>=0.27"

COPY backend/ ./
# 将 Next.js 静态产物拷贝到 app/static，供 FastAPI 挂载
COPY --from=frontend /app/out ./app/static

# 平台会设置 PORT，必须监听该端口
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
