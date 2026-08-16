## Context

当前 StudyPal 是纯前端 React 应用，数据来自 `src/mock/*.ts`。后端从零起步：FastAPI + SQLite + Alembic，独立 `backend/` 目录，与前端 Vite 构建解耦。前端引入 `src/services/api.ts` 作为 API client 雏形，封装 fetch + Bearer 注入 + 401 自动刷新，但本变更不接入 Dashboard 数据源（保留 mock）。

部署模型：前端 GitHub Pages（静态），后端独立部署（Vercel/Railway/Fly.io，本变更不处理）。CORS 允许前端 origin 跨域访问后端。

## Goals / Non-Goals

**Goals:**
- 建立可独立运行的 FastAPI 后端骨架（`uvicorn` 启动）
- 实现注册/登录/刷新/Profile 4 个端点的完整 JWT 流程
- 提供 Alembic 迁移机制，首期仅 `users` 表
- 提供前端 API client 雏形，为后续 UI 接入做准备

**Non-Goals:**
- 不接入 Dashboard 数据源（mock 保留）
- 不实现前端登录/注册 UI（留待 `auth-ui` change）
- 不处理后端部署
- 不引入测试框架（仅手动 curl 验证）

## Decisions

### Decision 1: JWT 算法选 HS256（对称密钥）

- **选择**：HS256
- **理由**：单后端服务，无需多服务共享公钥；HS256 签名/验证都用同一密钥，实现简单
- **备选**：RS256（非对称，适合多服务验证 token，但需管理公私钥对，过度设计）

### Decision 2: Access token 30 分钟 / Refresh token 7 天

- **选择**：access 30min + refresh 7d
- **理由**：access 短时降低被盗风险，refresh 7 天覆盖一周学习周期，用户无需频繁重登
- **备选**：access 15min + refresh 30d（更安全但 30 天 refresh 被盗风险高）/ access 1h + refresh 7d（更宽松但 access 被盗窗口大）

### Decision 3: Refresh token 用 HttpOnly cookie 存储

- **选择**：HttpOnly + Secure + SameSite=Lax cookie
- **理由**：JS 无法读取 HttpOnly cookie，防 XSS 窃取；SameSite=Lax 防 CSRF
- **备选**：返回 body 由前端存 localStorage（易实现但 XSS 可读取）
- **影响**：登录/刷新端点需设置 `Set-Cookie` 头，前端 fetch 需 `credentials: 'include'`

### Decision 4: 密码哈希用 bcrypt（cost=12）

- **选择**：passlib[bcrypt]，cost factor=12
- **理由**：bcrypt 抗 GPU 算力，cost=12 在 2026 年仍是合理安全强度（单次哈希约 250ms）
- **备选**：argon2（更现代但依赖更重，SQLite 单文件场景过度）

### Decision 5: 单一 `users` 表，streak/level/xp 字段冗余存储

- **选择**：`users` 表含 `id` / `email` / `hashed_password` / `avatar_url` / `streak_days` / `level` / `xp` / `last_activity_date` / `created_at`
- **理由**：首期 MVP，避免过早分表；`streak_days` 和 `level` 作为派生字段冗余存储，读取 Profile 时无需 JOIN
- **备选**：拆分 `user_stats` 表（更规范但首期无收益）
- **派生规则**：
  - `streak_days`：登录时按 `last_activity_date` 派生（见 user-profile spec）
  - `level`：按 `xp` 阈值表派生（Lv1=0 / Lv2=100 / Lv3=500 / Lv4=1500 / Lv5=4000）

### Decision 6: 前后端目录结构分离

```
my-website/
├── backend/                    # 后端独立目录
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app 入口
│   │   ├── config.py          # pydantic-settings 配置
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models/
│   │   │   └── user.py        # User ORM model
│   │   ├── schemas/
│   │   │   ├── auth.py        # 请求/响应 Pydantic schema
│   │   │   └── user.py        # Profile schema
│   │   ├── routers/
│   │   │   ├── auth.py        # /api/auth/* 路由
│   │   │   └── users.py       # /api/users/* 路由
│   │   ├── deps.py            # 依赖注入（get_db / get_current_user）
│   │   └── security.py        # JWT 签发/校验 + 密码哈希
│   ├── alembic/               # 迁移脚本
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example           # 配置模板（不入库的 .env 的样例）
│   └── studypal.db            # SQLite 文件（gitignore）
├── src/                       # 前端（已有）
│   ├── services/              # 新增
│   │   └── api.ts             # API client
│   ├── mock/                  # 保留，不删
│   └── ...                    # 现有组件
└── ...                        # vite.config.ts 等
```

### Decision 7: 前端 API client 组件层级

```
src/services/api.ts            # 单文件 client，不拆分
├── class ApiClient
│   ├── baseUrl: string        # 从 import.meta.env.VITE_API_BASE_URL
│   ├── request()              # 私有 fetch 包装
│   │   ├── 注入 Authorization: Bearer <access>
│   │   ├── 401 自动调用 refresh 后重试一次
│   │   └── refresh 失败抛出 UnauthorizedError
│   ├── auth.register()
│   ├── auth.login()
│   ├── auth.refresh()
│   └── users.getMe()
└── export const api = new ApiClient()
```

- **选择**：单文件单类，不拆 hooks（hooks 留待 `auth-ui` change）
- **理由**：本变更仅提供 client，UI 层消费留待后续

## API 端点规范

### POST /api/auth/register

| 项 | 值 |
|---|---|
| 请求 body | `{ "email": string, "password": string }` |
| 成功响应 | 201 `{ "access_token": string, "token_type": "bearer" }` + Set-Cookie: `refresh_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` |
| 409 | `{ "error_code": "EMAIL_ALREADY_EXISTS" }` |
| 422 | `{ "error_code": "INVALID_PASSWORD" }` 或 `{ "error_code": "INVALID_EMAIL" }` |
| 鉴权 | 无 |

### POST /api/auth/login

| 项 | 值 |
|---|---|
| 请求 body | `{ "email": string, "password": string }` |
| 成功响应 | 200 `{ "access_token": string, "token_type": "bearer" }` + Set-Cookie（同 register） |
| 401 | `{ "error_code": "INVALID_CREDENTIALS" }` |
| 鉴权 | 无 |

### POST /api/auth/refresh

| 项 | 值 |
|---|---|
| 请求 | 无 body，从 cookie 读取 `refresh_token` |
| 成功响应 | 200 `{ "access_token": string, "token_type": "bearer" }` |
| 401 | `{ "error_code": "TOKEN_EXPIRED" }` 或 `{ "error_code": "TOKEN_INVALID" }` |
| 鉴权 | refresh token cookie |

### GET /api/users/me

| 项 | 值 |
|---|---|
| 请求 | 无 body |
| 成功响应 | 200 `{ "id": int, "email": string, "avatar_url": string\|null, "streak_days": int, "level": int, "created_at": ISO8601 }` |
| 401 | `{ "error_code": "MISSING_TOKEN" }` / `{ "error_code": "TOKEN_EXPIRED" }` / `{ "error_code": "TOKEN_INVALID" }` |
| 鉴权 | `Authorization: Bearer <access_token>` |

### CORS 配置

```
Allow-Origin: http://localhost:5173 (dev), https://yubin890816.github.io (prod)
Allow-Credentials: true  (cookie 跨域必需)
Allow-Methods: GET, POST
Allow-Headers: Authorization, Content-Type
```

## Risks / Trade-offs

- **[SQLite 并发写入限制]** → 首期单用户开发场景可接受；后续若多用户并发，迁移到 PostgreSQL（Alembic 迁移可复用）
- **[Refresh token 无法吊销]** → 本变更不维护 session 列表，refresh token 一旦签发无法主动失效；用户改密或登出时需等待自然过期。后续 change 可引入 `revoked_tokens` 表
- **[HS256 密钥泄露风险]** → 密钥从 `.env` 读取，不入库；生产环境需用 secrets manager（本变更不处理）
- **[前端 API client 未接入 UI]** → 本变更仅产出 client 类，无消费方；需后续 `auth-ui` change 才能端到端验证

## Migration Plan

1. 创建 `backend/` 目录结构与 `requirements.txt`
2. 实现 `models/user.py` + Alembic 初始迁移生成 `users` 表
3. 实现 `security.py`（JWT + bcrypt）
4. 实现 `routers/auth.py` 3 个端点
5. 实现 `routers/users.py` Profile 端点
6. 实现 `src/services/api.ts` 前端 client
7. 手动 curl 验证全部端点
8. 回滚：`rm -rf backend/ src/services/`，前端回退到 mock

## Open Questions

- **后端部署目标**：Vercel / Railway / Fly.io / VPS？影响 `.env` 配置与 cold start 策略，但本变更不处理部署，留待后续 change `deploy-backend`
- **XP 来源**：`xp` 字段如何累积？本变更仅定义 `level` 派生规则，XP 写入逻辑留待 `study-logs` change
