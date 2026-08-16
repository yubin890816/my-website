## Context

参见 `proposal.md - Why`。当前 StudyPal 已具备：FastAPI 后端（auth/users/chat 路由）、SQLite + SQLAlchemy + Alembic、前端 DashboardLayout（Sidebar + Topbar + main）、条件渲染视图切换（overview/chat）、AuthProvider、ApiClient（含 401 自动 refresh）、已归档的 4 个 capability（auth、user-profile、learning/dashboard、ai/chat）。本次变更新增学习数据分析与成就系统，并完成全栈部署上线。

约束摘要：
- 复用 `get_current_user` / `get_db` 依赖
- 复用 `ApiClient` 的 401 refresh 机制
- 复用 `DashboardLayout`、`Topbar`、`Sidebar`、`UserMenu`
- 不引入 React Router，沿用条件渲染
- 不引入第三方图表库，热力图 SVG 自绘
- Tailwind v4 + class 暗色模式
- SQLite 持久化卷挂载（Railway volume）

## Goals / Non-Goals

**Goals:**
- 后端新增 `/api/analytics/*` 三个聚合端点 + `/api/study-logs` 写入端点
- 后端新增 `study_logs` 与 `achievements` 两张表
- 成就解锁自动触发（写入 study_logs 时检查）
- 前端新增 AnalyticsPage（含统计卡片 + 日历热力图 + 成就墙）
- 前端新增 GoalsPage（从 OverviewPage 抽取）
- Sidebar 重组为 3 个可用项
- 前端部署 GitHub Pages（GitHub Actions 自动化）
- 后端部署 Railway（auto-deploy + 持久化卷）

**Non-Goals:**
- 不做实时通知 / WebSocket 推送
- 不做数据导出
- 不做目标 CRUD 后端化（goals 仍前端状态）
- 不做自定义成就 / 可配置解锁条件
- 不做 PostgreSQL 迁移
- 不做监控 / 日志聚合
- 不做自定义域名

## Decisions

### Decision 1: 学习日志模型 — study_logs 单表

**选择：**

```
study_logs
  id                INTEGER PK AUTOINCREMENT
  user_id           INTEGER FK -> users.id NOT NULL
  date              DATE NOT NULL              -- 学习日期（YYYY-MM-DD）
  study_minutes     INTEGER DEFAULT 0 NOT NULL -- 当日学习时长
  goals_completed   INTEGER DEFAULT 0 NOT NULL -- 当日完成目标数
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  UNIQUE(user_id, date)  -- 每用户每日一条（重复写入累加）
```

**理由：**
- 单表聚合简单，统计概览与日历热力图均从此表查询
- `UNIQUE(user_id, date)` 保证每用户每日一条，勾选目标时 `INSERT ... ON CONFLICT DO UPDATE` 累加
- 不做 study_sessions 明细表（首期不需要分钟级精度）

**备选：** study_sessions（每次学习一条记录，含 start/end 时间）—— 聚合查询复杂、首期过度设计，否决。

### Decision 2: 成就模型 — achievements 表 + 硬编码定义

**选择：**

```
achievements
  id            INTEGER PK AUTOINCREMENT
  user_id       INTEGER FK -> users.id NOT NULL
  code          VARCHAR(32) NOT NULL          -- 如 first_log / streak_7 / streak_30 / level_5 / goals_10
  unlocked_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  UNIQUE(user_id, code)  -- 每用户每成就一条
```

成就定义硬编码在 `services/achievements.py`：

```python
ACHIEVEMENTS = [
    {"code": "first_log", "title": "初次打卡", "description": "记录第一条学习日志", "icon": "🌱"},
    {"code": "streak_7", "title": "一周坚持", "description": "连续学习 7 天", "icon": "🔥"},
    {"code": "streak_30", "title": "月度坚持", "description": "连续学习 30 天", "icon": "🏆"},
    {"code": "level_5", "title": "等级达人", "description": "达到 Lv 5", "icon": "⭐"},
    {"code": "goals_10", "title": "目标达人", "description": "累计完成 10 个目标", "icon": "🎯"},
]
```

**理由：**
- 成就定义变化频率低，硬编码避免引入额外表与管理 UI
- `UNIQUE(user_id, code)` 防止重复解锁
- 解锁检查在 study_logs 写入后触发，遍历未解锁成就判断条件

**备选：** achievements_definitions 表 —— 需额外管理界面，首期过度设计，否决。

### Decision 3: 日历热力图 — SVG 自绘

**选择：** 前端 `CalendarHeatmap` 组件用 SVG 绘制 7 行 × N 列方格，每方格 11px × 11px，颜色按 level 0-4 分档（slate-100/200/400/600/800 暗色模式对应调整）。

**理由：**
- 不引入 `react-calendar-heatmap` 等第三方库，减少依赖
- SVG 简单可控，Tailwind 颜色类直接适配暗色模式
- 90 天数据量小（90 个 rect），性能无忧

**备选：** `react-calendar-heatmap` —— 引入额外依赖且样式定制成本高，否决。

### Decision 4: 后端聚合查询 — SQLAlchemy func + group_by

**选择：** 统计概览与日历数据均用 SQLAlchemy 聚合函数（`func.sum`、`func.count`、`func.max`）+ `group_by` 直接查询 `study_logs`。

**理由：**
- SQLite 单表聚合性能足够（用户量小）
- 不引入 Redis 缓存或物化视图
- 查询逻辑集中在 service 层，便于后续优化

**示例查询（streak_days 计算）：**
```python
# 取最近连续有记录的天数
last_date = db.query(func.max(StudyLog.date)).filter(StudyLog.user_id == user.id).scalar()
streak = 0
d = last_date
while d and db.query(StudyLog).filter(StudyLog.user_id == user.id, StudyLog.date == d).first():
    streak += 1
    d -= timedelta(days=1)
```

### Decision 5: 前端组件层级

**选择：**

```
App
└── AuthProvider
    └── AppContent
        ├── LoginPage（未登录）
        └── DashboardLayout（已登录）
            ├── Topbar（含 UserMenu）
            ├── Sidebar（3 个可用项）
            └── main
                ├── AnalyticsPage（view === 'analytics'）
                │   ├── StatGrid（数据源：/api/analytics/overview）
                │   ├── CalendarHeatmap（数据源：/api/analytics/calendar）
                │   └── AchievementWall（数据源：/api/analytics/achievements）
                ├── ChatPage（view === 'chat'，已有）
                └── GoalsPage（view === 'goals'）
                    └── GoalList（前端状态管理，勾选触发 POST /api/study-logs）
```

**理由：**
- 复用 ChatPage、DashboardLayout、Topbar、Sidebar
- AnalyticsPage 取代 OverviewPage，整合统计 + 日历 + 成就
- GoalsPage 从 OverviewPage 抽取 GoalList，独立成页
- StatGrid 从 mock 数据切换为 props 传入（由 AnalyticsPage 从 API 获取后下发）

### Decision 6: 部署 — 前端 GitHub Actions + 后端 Railway

**选择：**
- 前端：`.github/workflows/deploy.yml`，main 分支 push 触发 `npm run build` + 部署到 gh-pages 分支
- 后端：Railway 连接 GitHub 仓库，main 分支 push 触发 `backend/Dockerfile` 构建部署

**理由：**
- GitHub Pages 免费、已有 `deploy` 脚本基础
- Railway 支持自动部署 + 持久化卷 + 环境变量管理，适合 FastAPI + SQLite
- 两者均 auto-deploy from GitHub，无需手动 CI/CD

**备选：**
- Vercel（前端）：免费但 SPA 路由配置复杂，base path 已有 GitHub Pages 适配
- Render（后端）：免费层冷启动慢，Railway 更稳定

### Decision 7: 后端 Dockerfile

**选择：**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**理由：**
- python:3.12-slim 镜像小、与本地 venv Python 版本一致
- uvicorn 直接启动，无需 gunicorn（首期单 worker 足够）
- Railway 通过 `PORT` 环境变量覆盖端口（CMD 中用 `$PORT` 或 Railway 自动注入）

**注意：** SQLite 文件路径需通过 `DATABASE_URL` 指向持久化卷挂载路径（`/data/studypal.db`）。

### Decision 8: 环境变量管理

**选择：**

| 变量 | 用途 | 本地默认 | 生产环境 |
|---|---|---|---|
| `DATABASE_URL` | SQLite 路径 | `sqlite:///./studypal.db` | `sqlite:////data/studypal.db` |
| `JWT_SECRET` | JWT 签名密钥 | `dev-secret-change-me` | Railway 注入强随机值 |
| `DEEPSEEK_API_KEY` | DeepSeek key | `.env` | Railway 注入 |
| `CORS_ORIGINS` | 允许的前端域名 | `http://localhost:5173` | `https://yubin890816.github.io` |
| `VITE_API_BASE_URL` | 前端指向后端 | `http://localhost:8000` | `https://<railway-domain>` |

**理由：**
- 敏感变量（JWT_SECRET、DEEPSEEK_API_KEY）只在后端，不入 git
- `VITE_API_BASE_URL` 在前端 build 时注入，运行时不可变
- `JWT_SECRET` 缺失时应用启动失败（fail-fast，避免使用弱默认值）

## API 端点规范

| 方法 | 路径 | 鉴权 | 请求体 / 参数 | 响应 |
|---|---|---|---|---|
| GET | `/api/analytics/overview` | Bearer | — | 200 `{today_minutes, week_minutes, today_goals_completed, streak_days, weekly_rank}` |
| GET | `/api/analytics/calendar` | Bearer | query: `?days=90` | 200 `[{date, level}]` |
| GET | `/api/analytics/achievements` | Bearer | — | 200 `[{code, title, description, icon, unlocked, unlocked_at}]` |
| POST | `/api/study-logs` | Bearer | `{date, study_minutes, goals_completed}` | 201 `{id, ...}` |

**成就定义（硬编码）：**

| code | title | description | icon | 解锁条件 |
|---|---|---|---|---|
| `first_log` | 初次打卡 | 记录第一条学习日志 | 🌱 | study_logs 表有 ≥1 条记录 |
| `streak_7` | 一周坚持 | 连续学习 7 天 | 🔥 | streak_days ≥ 7 |
| `streak_30` | 月度坚持 | 连续学习 30 天 | 🏆 | streak_days ≥ 30 |
| `level_5` | 等级达人 | 达到 Lv 5 | ⭐ | user.level ≥ 5 |
| `goals_10` | 目标达人 | 累计完成 10 个目标 | 🎯 | sum(goals_completed) ≥ 10 |

## Risks / Trade-offs

- **[风险] SQLite 并发写入** → Railway 单容器无并发问题；后续如需多 worker 需迁移 PostgreSQL
- **[风险] 成就解锁竞态** → 写入 study_logs 与 achievements 需在同一事务中，避免并发请求重复解锁
- **[风险] GitHub Pages 部署延迟** → GitHub Actions 缓存 + workflow 并发控制；首期可接受 1-2 分钟延迟
- **[风险] Railway 免费额度** → 免费层有月度执行时长限制；首期单用户场景足够
- **[权衡] 不做目标 CRUD 后端化** → goals 仍前端状态，刷新后重置；后续可加 goals 表持久化
- **[权衡] 热力图 SVG 自绘** → 无 tooltip 交互（首期仅静态展示）；后续可加 hover 提示

## Migration Plan

**部署步骤：**
1. 后端：新增 study_logs + achievements 表的 migration，`alembic upgrade head`
2. 后端：实现 `/api/analytics/*` 与 `/api/study-logs` 端点
3. 后端：创建 `Dockerfile`，本地 `docker build` 验证
4. 后端：Railway 创建项目，连接 GitHub 仓库，配置环境变量与持久化卷
5. 前端：实现 AnalyticsPage、GoalsPage、CalendarHeatmap、AchievementWall
6. 前端：修改 Sidebar、App.tsx、StatGrid 数据源切换
7. 前端：`.env.production` 配置 `VITE_API_BASE_URL` 指向 Railway 域名
8. 前端：`.github/workflows/deploy.yml` 自动部署到 GitHub Pages
9. 验证：访问 `https://yubin890816.github.io/my-website/`，登录后查看 AnalyticsPage 数据正常

**回滚步骤：**
1. 前端：`git revert` + 重新触发 GitHub Actions，或手动 `npm run deploy` 回退版本
2. 后端：Railway 一键 redeploy 旧 commit
3. 数据库：`alembic downgrade -1` drop study_logs + achievements 表
4. 配置：删除 Railway 环境变量不影响其他环境

## Open Questions

无（所有关键决策已确定，剩余实现细节由 tasks 阶段细化）。
