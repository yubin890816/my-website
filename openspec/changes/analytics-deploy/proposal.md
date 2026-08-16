## Why

StudyPal 当前 Dashboard 的统计卡片（`learning/stats`）、目标清单（`learning/goals`）、AI 建议面板（`learning/insights`）均依赖前端 mock 数据，无法反映用户真实学习进度；同时 Sidebar 中"目标/进度/建议"为禁用占位，缺少学习数据分析入口与激励机制（日历/成就）。本次变更将后端聚合真实学习数据供前端消费，新增学习日历与成就系统两个分析模块，并完成全栈部署上线，让产品从"本地原型"走向"可访问的应用"。

## What Changes

- 新增后端 `/api/analytics` 路由：聚合 `users` + `chat_messages`（间接反映学习活跃度）+ 后续 `study_logs`（本期新增表）数据，返回统计概览、日历热力图、成就列表。
- 新增后端 `study_logs` 表：记录用户每日学习时长、完成目标数等明细，作为聚合数据源。
- 新增前端"学习数据"页面（AnalyticsPage）：整合统计卡片（替换 mock）、学习日历热力图、成就墙。
- 新增前端"学习日历"组件：GitHub 风格热力图，展示近 90 天学习活跃度。
- 新增前端"成就系统"组件：徽章网格，按解锁状态展示（已解锁/未解锁）。
- 修改前端 `Sidebar` 导航项：将禁用占位项重组为 3 个可用项 —— "学习数据"（analytics）、"AI 对话建议"（chat）、"学习目标"（goals），原"总览"合并到"学习数据"。
- 修改前端 `OverviewPage`：统计卡片数据源从 mock 切换为后端 API，保留布局结构。
- 修改前端 `App.tsx`：view 状态从 `overview|chat` 扩展为 `analytics|chat|goals`。
- 修改后端 `requirements`：无新增（沿用 FastAPI + SQLAlchemy + Alembic）。
- 部署上线：前端构建产物部署到 GitHub Pages（已有 `deploy` 脚本），后端部署到 Railway（或 Render，首期选其一）。
- 配置生产环境：DeepSeek API key、JWT secret、CORS origins 通过 Railway 环境变量注入；前端 `VITE_API_BASE_URL` 指向后端生产域名。

**out-of-scope（不做）：**
- 实时通知（无 WebSocket / SSE 推送，成就解锁不弹窗）
- 数据导出（无 CSV / Excel 导出功能）
- 学习目标 CRUD 后端化（goals 仍用前端状态管理，不持久化到 DB，本期仅展示）
- 自定义成就（用户不能创建自定义徽章）
- 成就解锁条件可配置（条件硬编码在后端）
- 多语言 / i18n（仅简体中文）
- 自定义域名（首期用 Railway 默认域名 + GitHub Pages 默认域名）
- CI/CD 自动化（首期手动 `npm run deploy` + Railway auto-deploy from GitHub）
- 数据库迁移到 PostgreSQL（首期仍用 SQLite，部署时挂载持久化卷）
- 监控 / 日志聚合（无 Sentry / Grafana）
- 移动端原生 App

## Capabilities

### New Capabilities

- `analytics/overview`: 后端统计概览聚合 API 契约 —— 返回今日/本周学习时长、完成目标数、连续打卡天数、周排名（基于 study_logs 聚合）。
- `analytics/calendar`: 学习日历热力图契约 —— 后端返回近 90 天每日学习活跃度，前端以热力图渲染。
- `analytics/achievements`: 成就系统契约 —— 后端返回成就列表与解锁状态，前端渲染徽章墙；成就解锁由后端在写入 study_logs 时计算。
- `deploy/hosting`: 部署上线契约 —— 前端 GitHub Pages + 后端 Railway 的部署流程、环境变量管理、CORS 配置、健康检查。

### Modified Capabilities

- `learning/dashboard`: Sidebar 导航项重组 —— 3 个可用项（学习数据 / AI 对话建议 / 学习目标），原"总览"合并到"学习数据"；主内容区视图切换扩展为 analytics|chat|goals。
- `learning/stats`: 统计卡片数据源从 mock 切换为后端 `/api/analytics/overview`，保留 4 个指标与布局结构，新增加载中/加载失败状态。
- `learning/goals`: 目标清单页独立化（从 OverviewPage 抽取为 GoalsPage），数据源仍为前端状态（本期不持久化）。

## Impact

**受影响代码：**
- 后端新增：`backend/app/routers/analytics.py`、`backend/app/models/study_log.py`、`backend/app/schemas/analytics.py`、`backend/app/services/achievements.py`、`backend/alembic/versions/<新增>.py`
- 后端修改：`backend/app/main.py`（注册 analytics router）、`backend/app/models/__init__.py`、`backend/app/config.py`（新增生产环境 CORS 配置）
- 前端新增：`src/pages/AnalyticsPage.tsx`、`src/pages/GoalsPage.tsx`、`src/components/analytics/CalendarHeatmap.tsx`、`src/components/analytics/AchievementWall.tsx`
- 前端修改：`src/components/dashboard/Sidebar.tsx`（导航项重组）、`src/App.tsx`（view 状态扩展）、`src/components/dashboard/StatGrid.tsx`（数据源切换）、`src/services/api.ts`（新增 analytics 命名空间）、`src/pages/OverviewPage.tsx`（移除或合并到 AnalyticsPage）
- 部署文件：`package.json`（deploy 脚本已存在）、`backend/Dockerfile`（新增，用于 Railway）、`backend/Procfile` 或 `railway.json`、`.github/workflows/deploy.yml`（前端 GitHub Actions 自动部署）

**API 变更：**
- `GET /api/analytics/overview` —— 返回统计概览聚合数据
- `GET /api/analytics/calendar?days=90` —— 返回近 N 天每日学习活跃度
- `GET /api/analytics/achievements` —— 返回成就列表与解锁状态
- `POST /api/study-logs` —— 记录学习日志（触发成就解锁检查）

**依赖：**
- 无新增前端依赖（热力图用 SVG + Tailwind 自绘，不引第三方库）
- 无新增后端依赖（沿用现有栈）

**数据：**
- 新增 `study_logs` 表：id / user_id / date / study_minutes / goals_completed / created_at
- 新增 `achievements` 表：id / user_id / code / unlocked_at / （code 唯一约束 user_id + code）
- 成就定义硬编码在 `services/achievements.py`（如 first_chat / streak_7 / streak_30 / level_5 / goals_10）

**部署影响（高风险项）：**
- 后端首次暴露公网，需确保 JWT secret 强随机、CORS 严格限制为 GitHub Pages 域名
- SQLite 文件需持久化卷挂载（Railway volume），否则重启丢数据
- DeepSeek API key 通过 Railway 环境变量注入，不进 git
- 前端 `VITE_API_BASE_URL` 在 build 时注入生产后端 URL

**回滚方案：**
- 后端：Railway 可一键 redeploy 旧 commit；数据库 migration 提供 downgrade
- 前端：GitHub Pages 保留历史构建产物，可通过 `git revert` + 重新 `npm run deploy` 回滚
- 配置：环境变量删除不影响其他环境
