## Phase 1: 后端骨架与数据库

- [x] 1.1 检查复用：确认项目无已有 `backend/` 目录或 Python 服务可复用（预期无，新建）
- [x] 1.2 创建 `backend/` 目录结构：`app/{__init__.py, main.py, config.py, database.py, deps.py, security.py}` / `app/models/` / `app/schemas/` / `app/routers/`
- [x] 1.3 创建 `backend/requirements.txt`：fastapi / uvicorn[standard] / sqlalchemy / alembic / python-jose[cryptography] / passlib[bcrypt] / pydantic-settings / email-validator
- [x] 1.4 创建 `backend/.env.example`：`JWT_SECRET=` / `JWT_ALGORITHM=HS256` / `JWT_ACCESS_EXPIRE_MINUTES=30` / `JWT_REFRESH_EXPIRE_DAYS=7` / `CORS_ORIGINS=http://localhost:5173` / `DATABASE_URL=sqlite:///./studypal.db`
- [x] 1.5 创建 `backend/.gitignore`：忽略 `.env` / `studypal.db` / `__pycache__/` / `.venv/`
- [x] 1.6 实现 `app/config.py`：用 pydantic-settings 加载 `.env`，导出 `Settings` 类
- [x] 1.7 实现 `app/database.py`：SQLAlchemy engine + SessionLocal + `get_db` 依赖
- [x] 1.8 实现 `app/models/user.py`：User ORM 模型，字段 `id` / `email` / `hashed_password` / `avatar_url` / `streak_days` / `level` / `xp` / `last_activity_date` / `created_at`
- [x] 1.9 初始化 Alembic：`alembic init alembic`，配置 `alembic.ini` 指向 `DATABASE_URL`，`alembic/env.py` 导入 metadata
- [x] 1.10 生成初始迁移：`alembic revision --autogenerate -m "create users table"`
- [x] 1.11 执行迁移：`alembic upgrade head`，验证 `studypal.db` 中 `users` 表存在

**验证**：`uvicorn app.main:app --reload` 启动不报错；`sqlite3 backend/studypal.db ".schema users"` 显示表结构

## Phase 2: 安全模块与 JWT

- [x] 2.1 实现 `app/security.py` 的密码哈希：`hash_password(plain)` 用 passlib bcrypt cost=12 + `verify_password(plain, hashed)`
- [x] 2.2 实现 `app/security.py` 的 JWT 签发：`create_access_token(subject)` 用 HS256，有效期从 `Settings.JWT_ACCESS_EXPIRE_MINUTES` 读取
- [x] 2.3 实现 `app/security.py` 的 refresh token 签发：`create_refresh_token(subject)`，有效期 7 天，claim 含 `type: refresh`
- [x] 2.4 实现 `app/security.py` 的 JWT 校验：`decode_token(token)` 返回 payload 或抛出 `TokenExpiredError` / `TokenInvalidError`

**验证**：在 Python REPL 中调用 `hash_password` + `verify_password` 通过；调用 `create_access_token` + `decode_token` 往返通过

## Phase 3: Auth 路由（注册/登录/刷新）

- [x] 3.1 实现 `app/schemas/auth.py`：`RegisterRequest` / `LoginRequest` / `TokenResponse` / `ErrorResponse` Pydantic schema，含邮箱格式校验 + 密码长度 ≥8 校验
- [x] 3.2 实现 `app/routers/auth.py` 的 `POST /api/auth/register`：校验邮箱唯一 → 哈希密码 → 创建用户 → 签发 access + refresh → Set-Cookie refresh → 返回 201
- [x] 3.3 实现 `app/routers/auth.py` 的 `POST /api/auth/login`：查询用户 → 校验密码 → 签发 access + refresh → Set-Cookie → 返回 200（错误不区分"用户不存在"与"密码错误"）
- [x] 3.4 实现 `app/routers/auth.py` 的 `POST /api/auth/refresh`：从 cookie 读 refresh → 校验 → 签发新 access（不轮换 refresh）→ 返回 200
- [x] 3.5 实现 `app/deps.py` 的 `get_current_user`：从 Authorization Bearer 解析 access → 校验 → 查询用户 → 返回 User 对象；失败抛 401 + 错误码

**验证**：curl 注册 → curl 登录 → curl 刷新 → curl 受保护端点（用 `get_current_user`）→ 4 个端点均返回正确状态码与 body

## Phase 4: Profile 路由与派生逻辑

- [x] 4.1 实现 `app/schemas/user.py`：`ProfileResponse` Pydantic schema，字段 `id` / `email` / `avatar_url` / `streak_days` / `level` / `created_at`
- [x] 4.2 实现 `app/routers/users.py` 的 `GET /api/users/me`：调用 `get_current_user` → 序列化 Profile → 返回 200
- [x] 4.3 在 `get_current_user` 或登录流程中实现 `streak_days` 派生：按 `last_activity_date` 与今日对比，昨日则 +1，中断则重置为 1，同日不变
- [x] 4.4 实现 `level` 派生函数：`compute_level(xp)` 按阈值表 Lv1=0 / Lv2=100 / Lv3=500 / Lv4=1500 / Lv5=4000 返回等级；`xp` 为 NULL 时返回 1
- [x] 4.5 在 `app/main.py` 注册 CORS 中间件：`allow_origins` 从 `Settings.CORS_ORIGINS` 读取，`allow_credentials=True`，`allow_methods=["GET","POST"]`，`allow_headers=["Authorization","Content-Type"]`
- [x] 4.6 在 `app/main.py` 注册路由：`include_router(auth.router, prefix="/api/auth")` + `include_router(users.router, prefix="/api/users")`

**验证**：`uvicorn app.main:app --reload` 启动 → curl 注册用户 → curl 登录拿 access → curl `/api/users/me` 返回完整 Profile；`streak_days` 与 `level` 派生正确

## Phase 5: 前端 API Client

- [x] 5.1 检查复用：确认 `src/services/` 目录不存在，无已有 API client 可复用（预期无，新建）
- [x] 5.2 在 `package.json` 或 `.env.local` 配置 `VITE_API_BASE_URL=http://localhost:8000`（开发期）
- [x] 5.3 实现 `src/services/api.ts`：`ApiClient` 类，`baseUrl` 从 `import.meta.env.VITE_API_BASE_URL` 读取
- [x] 5.4 实现 `ApiClient.request()` 私有方法：注入 `Authorization: Bearer <access>`，401 时自动调用 `auth.refresh()` 后重试一次，refresh 失败抛 `UnauthorizedError`
- [x] 5.5 实现 `ApiClient.auth.register(email, password)` / `auth.login(email, password)` / `auth.refresh()` 三个方法，fetch 需 `credentials: 'include'`
- [x] 5.6 实现 `ApiClient.users.getMe()` 方法
- [x] 5.7 导出单例 `export const api = new ApiClient()`

**验证**：`npx tsc -b --noEmit` 类型检查通过；`npm run build` 构建通过；不破坏现有 Dashboard 渲染（mock 数据源保留）

## Phase 6: 端到端验证

- [x] 6.1 启动后端：`cd backend && uvicorn app.main:app --reload`（端口 8000）
- [x] 6.2 启动前端：`npm run dev`（端口 5173）
- [x] 6.3 curl 端到端验证：注册 → 登录 → 刷新 → GET /api/users/me，4 个端点状态码与 body 符合 spec
- [x] 6.4 错误场景验证：重复邮箱注册返回 409 / 错误密码登录返回 401 / 过期 token 访问返回 401 / 无 Authorization 访问返回 401
- [x] 6.5 CORS 验证：从 `http://localhost:5173` 发起 fetch，浏览器 console 无 CORS 错误
- [x] 6.6 前端构建验证：`npm run build` 通过，`dist/` 产物完整，`backend/` 不影响前端构建
