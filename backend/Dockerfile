# 后端 Dockerfile（Railway 部署用）
FROM python:3.12-slim

WORKDIR /app

# 系统依赖（bcrypt 编译需要 gcc）
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# 先复制依赖文件，利用 Docker 层缓存
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 持久化卷挂载点（Railway volume mount 到 /data）
RUN mkdir -p /data

# Railway 通过 PORT 环境变量注入端口，默认 8000
ENV PORT=8000
EXPOSE 8000

# 启动命令：uvicorn 单 worker（首期足够，SQLite 限制单写入）
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
