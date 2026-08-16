## 1. Phase 1：后端数据模型与 migration

- [x] 1.1 创建 `backend/app/models/study_log.py`，定义 `StudyLog` ORM 模型（字段与索引按 design.md Decision 1，含 `UNIQUE(user_id, date)` 约束）
- [x] 1.2 创建 `backend/app/models/achievement.py`，定义 `Achievement` ORM 模型（字段与索引按 design.md Decision 2，含 `UNIQUE(user_id, code)` 约束）
- [x] 1.3 在 `backend/app/models/__init__.py` 导出新模型
- [x] 1.4 生成 Alembic migration：`alembic revision --autogenerate -m "create study_logs and achievements"`
- [x] 1.5 检查生成的 migration 脚本字段与约束正确，手动添加 UNIQUE 约束（autogenerate 可能遗漏）
- [x] 1.6 执行 `alembic upgrade head`，验证 `sqlite3 studypal.db ".schema study_logs"` 与 `.schema achievements` 输出正确
- [x] 1.7 **验证**：在 Python REPL 中创建 StudyLog 与 Achievement 实例，确认 UNIQUE 约束生效（重复插入报错）

## 2. Phase 2：后端 schemas 与成就 service

- [x] 2.1 创建 `backend/app/schemas/analytics.py`，定义 Pydantic 模型：`AnalyticsOverview`、`CalendarDay`、`AchievementOut`、`StudyLogCreate`、`StudyLogOut`
- [x] 2.2 在 `backend/app/schemas/__init__.py` 导出新 schema
- [x] 2.3 创建 `backend/app/services/achievements.py`，定义 `ACHIEVEMENTS` 常量列表（含 code/title/description/icon，按 design.md 表格）
- [x] 2.4 在 `achievements.py` 实现 `check_and_unlock(user_id, db)` 函数：查询未解锁成就，逐个判断条件，满足则 INSERT 到 achievements 表（同一事务内）
- [x] 2.5 实现 5 个成就解锁条件函数：`first_log` / `streak_7` / `streak_30` / `level_5` / `goals_10`
- [x] 2.6 **验证**：在 Python REPL 中模拟 study_logs 数据，调用 `check_and_unlock`，确认成就正确解锁且不重复

## 3. Phase 3：后端 analytics 路由

- [x] 3.1 创建 `backend/app/routers/analytics.py`，定义 `router = APIRouter()`
- [x] 3.2 实现 `GET /overview`：聚合查询 study_logs 返回 `today_minutes`、`week_minutes`、`today_goals_completed`、`streak_days`、`weekly_rank`（streak 计算按 design.md 示例）
- [x] 3.3 实现 `GET /calendar`：校验 days 参数（1-365，默认 90），查询近 N 天 study_logs，按 level 0-4 分档返回 `[{date, level}]`
- [x] 3.4 实现 `GET /achievements`：返回 ACHIEVEMENTS 常量与用户已解锁记录合并，按已解锁优先 + unlocked_at 降序排序
- [x] 3.5 创建 `backend/app/routers/study_logs.py`，实现 `POST /` 端点：校验 body，`INSERT ... ON CONFLICT DO UPDATE` 累加写入，调用 `check_and_unlock`
- [x] 3.6 在 `backend/app/main.py` 注册 `analytics.router` 与 `study_logs.router`（prefix 分别为 `/api/analytics` 与 `/api/study-logs`）
- [x] 3.7 **验证**：启动后端，用 curl 测试 4 个端点（携带 token），确认 overview 返回 0 值、calendar 返回 90 条、achievements 返回 5 条（全未解锁）、study-logs 写入后 achievements 部分解锁

## 4. Phase 4：前端 API client 扩展

- [x] 4.1 在 `src/services/api.ts` 新增 `AnalyticsOverview`、`CalendarDay`、`Achievement`、`StudyLogPayload` 类型
- [x] 4.2 在 `ApiClient` 新增 `analytics` 命名空间：`getOverview()`、`getCalendar(days?)`、`getAchievements()`
- [x] 4.3 在 `ApiClient` 新增 `studyLogs` 命名空间：`create(payload)` 调用 `POST /api/study-logs`
- [x] 4.4 **验证**：`npx tsc --noEmit` 无错误

## 5. Phase 5：前端 AnalyticsPage 与组件

- [x] 5.1 创建 `src/components/analytics/CalendarHeatmap.tsx`：SVG 绘制 7 行 × N 列方格，level 0-4 颜色分档（slate-100/200/400/600/800），暗色模式适配，props 接收 `data: CalendarDay[]`
- [x] 5.2 创建 `src/components/analytics/AchievementWall.tsx`：徽章网格，已解锁高亮 + 显示 unlocked_at，未解锁置灰，props 接收 `achievements: Achievement[]`
- [x] 5.3 修改 `src/components/dashboard/StatGrid.tsx`：数据源从内部 mock 切换为 props（`stats: AnalyticsOverview | null`、`loading: boolean`），加载中显示骨架屏，加载失败显示 "--"
- [x] 5.4 创建 `src/pages/AnalyticsPage.tsx`：组合 StatGrid + CalendarHeatmap + AchievementWall，挂载时调用 3 个 API 并行获取数据
- [x] 5.5 **验证**：临时在 App.tsx 渲染 `<AnalyticsPage />`，登录后确认 3 个区域正确渲染（含加载中状态）

## 6. Phase 6：前端 GoalsPage 与 Sidebar 重组

- [x] 6.1 创建 `src/pages/GoalsPage.tsx`：从 OverviewPage 抽取 GoalList 组件，独立成页，保留完成进度汇总与勾选交互
- [x] 6.2 修改 `src/components/dashboard/GoalList.tsx`：勾选完成时调用 `api.studyLogs.create()` 写入学习日志（乐观更新，失败不回滚）
- [x] 6.3 修改 `src/components/dashboard/Sidebar.tsx`：NAV_ITEMS 改为 3 个可用项（analytics 学习数据 / chat AI 对话建议 / goals 学习目标）+ 禁用占位项
- [x] 6.4 修改 `src/App.tsx`：view 状态类型改为 `'analytics' | 'chat' | 'goals'`，默认 'analytics'，根据 view 渲染对应页面
- [x] 6.5 删除 `src/pages/OverviewPage.tsx`（功能已合并到 AnalyticsPage）
- [x] 6.6 **验证**：`npx tsc --noEmit` + `npm run build` 通过，点击 Sidebar 3 个项切换页面正常

## 7. Phase 7：部署上线 — 后端 Railway

- [x] 7.1 创建 `backend/Dockerfile`（基于 python:3.12-slim，按 design.md Decision 7）
- [x] 7.2 创建 `backend/.dockerignore`（排除 .venv、__pycache__、*.db、.env）
- [x] 7.3 修改 `backend/app/config.py`：`jwt_secret_key` 字段缺失时启动失败（raise RuntimeError），`database_url` 默认指向 `/data/studypal.db`（适配 Railway 卷）
- [x] 7.4 修改 `backend/app/config.py`：`cors_origins` 支持逗号分隔多域名解析
- [x] 7.5 修改 `backend/app/main.py`：`/health` 端点返回 `{"status":"ok"}`，不查 DB、不校验 token
- [~] 7.6 本地 `docker build -t studypal-backend backend/` 验证镜像构建成功（跳过：Docker daemon 未运行，Railway 云端构建会验证）
- [~] 7.7 本地 `docker run -p 8000:8000 -e JWT_SECRET=test -e DATABASE_URL=sqlite:///./test.db studypal-backend` 验证容器启动（跳过：依赖 7.6）
- [ ] 7.8 Railway 创建项目，连接 GitHub 仓库，配置环境变量（JWT_SECRET / DEEPSEEK_API_KEY / CORS_ORIGINS / DATABASE_URL）
- [ ] 7.9 Railway 配置持久化卷挂载到 `/data`，设置 `DATABASE_URL=sqlite:////data/studypal.db`
- [ ] 7.10 **验证**：访问 `https://<railway-domain>/health` 返回 200，`/docs` 可访问

## 8. Phase 8：部署上线 — 前端 GitHub Pages

- [x] 8.1 创建 `.env.production`：`VITE_API_BASE_URL=https://<railway-domain>`
- [x] 8.2 创建 `.github/workflows/deploy.yml`：main 分支 push 触发，`npm ci && npm run build`，部署 dist/ 到 GitHub Pages
- [x] 8.3 在 workflow 中配置 `VITE_API_BASE_URL` 作为 build 环境变量（从 GitHub Secrets 读取）
- [x] 8.4 验证 `vite.config.ts` 的 `base: '/my-website/'` 配置正确
- [ ] 8.5 推送到 main 分支，观察 GitHub Actions 执行成功（待用户操作）
- [ ] 8.6 **验证**：访问 `https://yubin890816.github.io/my-website/`，登录后 AnalyticsPage 数据从 Railway 后端正常加载（待部署）

## 9. Phase 9：端到端验证与三维验证收尾

- [ ] 9.1 在生产环境注册新用户，确认数据库写入正常（Railway 卷持久化）（待用户部署后操作）
- [ ] 9.2 进入 AnalyticsPage，确认统计卡片显示 0 值（新用户无 study_logs）（待用户部署后操作）
- [ ] 9.3 进入 GoalsPage，勾选一个目标，确认 study_logs 写入 + first_chat 成就解锁（待用户部署后操作）
- [ ] 9.4 回到 AnalyticsPage 刷新，确认统计卡片、日历热力图、成就墙数据更新（待用户部署后操作）
- [ ] 9.5 进入 AI 对话建议页面，发送消息，确认流式对话正常（验证 CORS 配置正确）（待用户部署后操作）
- [ ] 9.6 测试暗色模式：切换主题，确认所有新组件（热力图、成就墙、统计卡片骨架屏）样式正确（待用户部署后操作）
- [x] 9.7 运行 `openspec validate --strict` 确认无校验错误（15/15 通过）
- [x] 9.8 三维验证：
  - 完整性：tasks.md 全部勾选（除用户手动部署项）；7 个 spec 的 requirement 均有代码实现；`tsc --noEmit` 无错误；`npm run build` 288 模块通过
  - 正确性：后端 E2E 13 项测试覆盖 4 个端点（overview/calendar/achievements/study-logs）+ 未鉴权 401 + 参数超限 422 + 累加写入 + 成就解锁触发；前端生产构建通过
  - 一致性：design.md 8 个决策逐一落地（study_logs UNIQUE 约束 / achievements 硬编码 / SVG 自绘热力图 / SQLAlchemy 聚合 / 组件层级 / GitHub Actions + Railway / Dockerfile / 环境变量管理）；命名一致（study_logs/achievements snake_case、AnalyticsPage/CalendarHeatmap PascalCase、/api/analytics kebab-case）
