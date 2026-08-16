## Context

参见 `proposal.md - Why`。当前 StudyPal 已具备：FastAPI 后端（`/api/auth`、`/api/users`），SQLite + SQLAlchemy 2.0 + Alembic 迁移，前端 `ApiClient`（含 401 自动 refresh）、`AuthProvider`、`DashboardLayout`（Sidebar + Topbar + main）、条件渲染式视图切换（无 React Router）。本变更在现有架构上新增 AI 对话能力，不改技术栈。

约束摘要：
- 复用 `get_current_user` 依赖与 `get_db` 会话工厂
- 复用 `ApiClient` 的 401 自动 refresh 机制
- 不引入 React Router，沿用条件渲染
- Tailwind v4 + class 暗色模式
- 后端 `.env` 管理 DeepSeek key

## Goals / Non-Goals

**Goals:**
- 后端通过 SSE 流式转发 DeepSeek `chat/completions` 响应，首字节延迟可控
- 对话按用户隔离持久化，支持历史拉取
- LLM 调用前注入用户学习画像，回复个性化
- 前端气泡式 UI + Markdown 渲染 + 自动滚动 + 流式打字效果
- DeepSeek key 全程不暴露给前端

**Non-Goals:**
- 不做多会话管理 UI（仅隐式当前会话）
- 不做模型切换 / function calling / 多模态
- 不做 token 计量与限流
- 不引入消息队列（首期单实例同步流式足够）

## Decisions

### Decision 1: 流式协议 — SSE over POST

**选择：** `POST /api/chat/sessions/{id}/messages/stream` 响应 `text/event-stream`，事件类型 `delta` / `done` / `error`。

**理由：**
- DeepSeek 兼容 OpenAI 协议，原生返回 SSE 流，后端只需透传/重新封装
- SSE 浏览器原生 `fetch` + `ReadableStream` 可解析，无需 WebSocket 库
- POST 携带 body 自然容纳用户消息，比 GET query 更适合长文本
- 现有 `ApiClient` 的 401 refresh 逻辑可直接复用（fetch 失败重试）

**备选：**
- WebSocket：双向通信更强，但需要引入 `websockets` 库、修改 CORS、且本场景无服务端主动推送需求
- Chunked JSON Streaming：需自定义分隔符，生态弱于 SSE

### Decision 2: DeepSeek 调用 — httpx 同步流式 + FastAPI StreamingResponse

**选择：** 使用 `httpx` 的 `stream()` 上下文管理器同步迭代上游 chunk，通过 FastAPI `StreamingResponse` 生成器逐 chunk 转发。

**理由：**
- 现有后端为同步 SQLAlchemy（`SessionLocal` 非 async），保持一致避免混用同步/异步引发阻塞
- `httpx.stream()` 在同步生成器中可逐行读取 `data: ...`，转换简单
- FastAPI `StreamingResponse` 接受同步 generator，无需 `async def`

**备选：**
- `httpx.AsyncClient` + `async def`：需将整个 chat 路由与依赖改为 async，与现有同步 DB 会话混用易踩坑
- `aiohttp`：额外依赖，无优势

**风险：** 同步生成器在事件循环中执行可能阻塞 worker。uvicorn 默认单 worker，多用户并发时可能排队。首期可接受（单用户学习场景），后续如需扩展再迁移 async + 连接池。

### Decision 3: 数据模型 — chat_sessions + chat_messages 两张表

**选择：**

```
chat_sessions
  id            INTEGER PK AUTOINCREMENT
  user_id       INTEGER FK -> users.id NOT NULL
  title         VARCHAR(100) DEFAULT '新对话'
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP

chat_messages
  id            INTEGER PK AUTOINCREMENT
  session_id    INTEGER FK -> chat_sessions.id NOT NULL
  role          VARCHAR(16) NOT NULL  -- 'user' | 'assistant'
  content       TEXT NOT NULL
  is_partial    BOOLEAN DEFAULT FALSE
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
```

**理由：**
- 会话与消息 1:N 关系清晰，便于后续做多会话管理
- `is_partial` 标记客户端断开导致的截断消息，便于审计与重试
- `updated_at` 用于"返回最近活跃会话"排序
- 索引：`chat_messages(session_id, created_at)`、`chat_sessions(user_id, updated_at)`

**备选：** 单表存储（role + parent_id）—— 查询复杂、难以扩展会话元数据，否决。

### Decision 4: 上下文装配 — system prompt 模板

**选择：** 后端在调用 DeepSeek 前，从 DB 读取 user 记录，构造如下 system prompt：

```
你是 StudyPal 的 AI 学习教练，名字叫小帕。请基于以下用户学习数据给出针对性建议：
- 连续学习天数（streak）：{streak_days} 天
- 当前等级（level）：Lv {level}
- 经验值（xp）：{xp or "未知"}
- 上次活动日期：{last_activity_date or "未知"}

回复要求：
1. 用简体中文
2. 语气友好、鼓励为主
3. 结合用户数据给出可执行的具体建议
4. 回复使用 Markdown 格式，代码块标注语言
```

**理由：** system prompt 集中在后端，便于后续调优，前端无感知。字段缺失时降级为"未知"避免崩溃。

### Decision 5: 前端组件层级

**选择：**

```
App
└── AuthProvider
    └── AppContent
        ├── LoginPage（未登录）
        └── DashboardLayout（已登录）
            ├── Topbar（含 UserMenu）
            ├── Sidebar（含"AI 助手"导航项）
            └── main
                ├── OverviewPage（view === 'overview'）
                └── ChatPage（view === 'chat'）
                    ├── ChatMessageList
                    │   └── ChatMessage（× N）
                    │       ├── 用户气泡（纯文本）
                    │       └── AI 气泡（ReactMarkdown）
                    └── ChatInput
```

**理由：**
- 复用 `DashboardLayout`、`Topbar`、`Sidebar`、`UserMenu`
- `ChatPage` 自包含状态管理（消息列表、流式状态、错误），不污染全局
- `ChatMessage` 区分 role 渲染用户/AI 气泡
- view 状态提升到 `AppContent`，由 Sidebar 触发切换

### Decision 6: SSE 前端解析 — fetch + ReadableStream + TextDecoder

**选择：** 不引入 `EventSource`（不支持 POST 与自定义 header），改用 `fetch` + `response.body.getReader()` + `TextDecoder` 手动解析 SSE 帧。

**理由：**
- 需携带 `Authorization: Bearer` header，`EventSource` 不支持自定义 header
- 复用 `ApiClient` 的 token 注入与 401 refresh
- SSE 帧解析简单（按 `\n\n` 分割事件，按 `\n` 分割字段）

### Decision 7: Markdown 渲染 — react-markdown + remark-gfm

**选择：** `react-markdown@9` + `remark-gfm@4`，禁用 `raw HTML`（默认即禁用）。

**理由：**
- 生态成熟、React 19 兼容
- 默认不渲染原始 HTML，满足 spec 中"危险 HTML 转义"要求
- GFM 支持代码块、列表、表格、删除线等

## API 端点规范

| 方法 | 路径 | 鉴权 | 请求体 / 参数 | 响应 |
|---|---|---|---|---|
| GET | `/api/chat/sessions/current` | Bearer | — | 200 `{id, title, created_at, updated_at}` |
| POST | `/api/chat/sessions` | Bearer | `{title?: string}` | 201 `{id, title, created_at, updated_at}` |
| GET | `/api/chat/sessions/{id}/messages` | Bearer | query: `?limit=100&offset=0` | 200 `[{id, role, content, created_at}]`，header `X-Total-Count` |
| POST | `/api/chat/sessions/{id}/messages/stream` | Bearer | `{content: string}` | 200 `text/event-stream`，事件 `delta`/`done`/`error` |

**SSE 事件格式：**
```
event: delta
data: {"content": "你"}

event: delta
data: {"content": "好"}

event: done
data: {"message_id": 42}

event: error
data: {"error_code": "LLM_UPSTREAM_ERROR"}
```

**错误码统一：**
- `MISSING_TOKEN` / `TOKEN_INVALID` / `TOKEN_EXPIRED`（401，沿用现有）
- `SESSION_NOT_FOUND`（404）
- `VALIDATION_ERROR`（422，消息为空或超长）
- `LLM_NOT_CONFIGURED`（key 缺失）
- `LLM_UPSTREAM_ERROR`（DeepSeek 非 2xx / 超时）

## Risks / Trade-offs

- **[风险] 同步流式阻塞 worker** → 单 uvicorn worker 下多用户并发会排队。首期单用户场景可接受，后续切 async + uvicorn workers。
- **[风险] DeepSeek 速率限制** → 首期不实现限流，依赖 DeepSeek 侧默认限速。后续可加 per-user 滑动窗口。
- **[风险] 消息长度超 LLM context** → 前端 4000 字符限制 + 后端可后续加 token 估算与历史截断（首期仅传最近 N 条历史）。
- **[风险] 客户端断开后 assistant 消息半截** → `is_partial` 标记，前端可显示"（回复中断）"提示，用户可重新发送。
- **[权衡] 不做多会话 UI** → 用户无法手动开新会话，但"当前会话"机制已满足首期需求。后续可加"清空当前会话"按钮。
- **[权衡] 历史全量传给 LLM** → 首期简单实现，消息量大时需截断（仅在 messages > 20 条时取最近 10 条 + system prompt）。

## Migration Plan

**部署步骤：**
1. 后端：新增 migration（`alembic revision`），创建两张表
2. 后端：`pip install httpx`，更新 `requirements.txt`
3. 后端：`.env` 添加 `DEEPSEEK_API_KEY=sk-...` 与 `DEEPSEEK_BASE_URL=https://api.deepseek.com`
4. 后端：注册 chat router，重启服务
5. 前端：`npm install react-markdown remark-gfm`
6. 前端：新增 ChatPage 等组件，修改 Sidebar 与 App.tsx
7. 验证：登录 → 进入 AI 助手 → 发送消息 → 收到流式回复

**回滚步骤：**
1. 前端：移除 ChatPage、Sidebar 新导航项、App.tsx view 状态、`api.chat` 命名空间、卸载 react-markdown
2. 后端：从 main.py 移除 chat router，删除 `routers/chat.py`、`services/deepseek.py`、`models/chat.py`、`schemas/chat.py`
3. 后端：`alembic downgrade -1` drop 两张表
4. 后端：从 requirements.txt 移除 httpx
5. 配置：从 .env 删除 DeepSeek 相关字段

## Open Questions

无（所有关键决策已确定，剩余实现细节由 tasks 阶段细化）。
