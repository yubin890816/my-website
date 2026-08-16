## Why

StudyPal 当前 Dashboard 已具备登录态、用户档案与统计概览，但学习建议仍依赖静态 mock 数据（`InsightPanel`），用户无法与 AI 进行多轮对话获取个性化指导。引入 AI 对话能力后，可基于用户的 streak、level、目标进度等学习数据生成针对性建议，使 Dashboard 从"展示数据"演进为"对话式学习伙伴"。

## What Changes

- 新增前端"AI 助手"页面与对话 UI：消息气泡式布局、Markdown 渲染、自动滚动到底部、流式打字效果。
- 新增前端 API client 扩展：调用后端流式对话端点（SSE / Server-Sent Events），自动附加 access token，401 时复用现有 refresh 逻辑。
- 新增后端 `/api/chat` 路由：接收用户消息，调用 DeepSeek `chat/completions`（stream=true），将 OpenAI 兼容的 chunk 流转发给前端。
- 新增后端对话持久化：新建 `chat_sessions` 与 `chat_messages` 两张表（snake_case），按用户维度存储会话与消息，支持按 session 加载历史。
- 新增后端上下文装配：调用 LLM 前，将用户的 streak_days / level / xp / last_activity_date 注入 system prompt，使回复个性化。
- 修改前端 `Sidebar` 导航项：将原"建议"项（insights）保留为禁用占位，新增可用的"AI 助手"入口，点击切换主内容区。
- 修改前端 `App.tsx`：增加简单的 view 状态切换（`overview` / `chat`），不引入 React Router，保持现有条件渲染架构。
- 修改后端 `main.py`：注册新的 `chat` 路由，扩展 CORS 允许方法（流式响应需要 GET/POST 已支持，无需改动 methods）。
- 修改后端 `requirements.txt`：新增 `httpx`（用于调用 DeepSeek 流式 API）、`aiosqlite` 或保持同步 SQLAlchemy（首期使用同步调用 + `StreamingResponse`）。
- 修改 `.env.example` 与 `config.py`：新增 `deepseek_api_key` 与 `deepseek_base_url` 配置项。

**out-of-scope（不做）：**
- 语音输入（无麦克风集成、无 ASR）。
- 文件/图片上传（无多模态消息体）。
- 模型切换（前端不暴露 model 选择，固定使用 `deepseek-chat`）。
- 多会话管理 UI（首期仅一个隐式 session：用户进入对话页即加载/创建当前会话，不提供"新建会话/历史会话列表"操作）。
- Function calling / 工具调用（不向 LLM 注册任何 tool）。
- 消息编辑/重新生成/复制按钮（仅展示与发送）。
- Token 用量统计与限流（首期不实现）。
- 后台管理（沿用 user-auth 的 out-of-scope）。

## Capabilities

### New Capabilities

- `ai/chat`: 后端 AI 对话能力契约 —— 流式对话端点、对话持久化、上下文装配（注入用户学习数据）、DeepSeek 适配。
- `ai/chat-ui`: 前端 AI 对话页面 UI 契约 —— 消息气泡布局、Markdown 渲染、自动滚动、流式接收、发送交互、错误反馈。

### Modified Capabilities

- `learning/dashboard`: Sidebar 导航项变更 —— 新增"AI 助手"可用入口；主内容区支持 view 切换（overview / chat）。原"建议"项保留禁用占位，行为契约微调。

## Impact

**受影响代码：**
- 后端新增：`backend/app/routers/chat.py`、`backend/app/models/chat.py`、`backend/app/schemas/chat.py`、`backend/app/services/deepseek.py`、`backend/alembic/versions/<新增 migration>.py`
- 后端修改：`backend/app/main.py`（注册路由）、`backend/app/config.py`（新增配置）、`backend/requirements.txt`（新增 httpx）、`backend/.env.example`
- 前端新增：`src/pages/ChatPage.tsx`、`src/components/chat/ChatMessage.tsx`、`src/components/chat/ChatInput.tsx`、`src/components/chat/ChatStream.tsx`（或合并为更少文件，由 design 决定）
- 前端修改：`src/services/api.ts`（新增 chat 命名空间与 SSE 解析）、`src/App.tsx`（view 状态）、`src/components/dashboard/Sidebar.tsx`（导航项）

**API 变更：**
- `POST /api/chat/sessions` —— 创建会话（返回 session_id）
- `GET /api/chat/sessions/current` —— 获取当前用户当前会话（无则隐式创建）
- `GET /api/chat/sessions/{id}/messages` —— 拉取历史消息（分页或全量，由 design 决定）
- `POST /api/chat/sessions/{id}/messages/stream` —— 发送消息并以 SSE 流式返回 AI 回复

**依赖：**
- 新增 Python 依赖：`httpx>=0.27.0`（流式 HTTP 客户端）
- 新增前端依赖：`react-markdown` + `remark-gfm`（Markdown 渲染）

**数据：**
- 新增 `chat_sessions` 表：id / user_id / title / created_at / updated_at
- 新增 `chat_messages` 表：id / session_id / role(user|assistant) / content / created_at

**安全考量（高风险项）：**
- DeepSeek API key 必须存放于后端 `.env`，**严禁前端直连 DeepSeek**（避免 key 泄露）。
- 流式响应需复用现有 JWT 鉴权链路（`get_current_user` 依赖）。
- 用户消息内容需做长度上限校验（防止单条消息过长导致 token 超限或 DoS）。

**回滚方案：**
- 后端：alembic 提供 downgrade 脚本（drop 两张表），删除 `chat.py` 路由与 service 文件，从 `main.py` 移除 router include 即可回滚。
- 前端：移除 `ChatPage` 与导航项，恢复 `App.tsx` 的 view 状态为单一 overview，移除 `api.chat` 命名空间。
- 配置：删除 `.env` 中新增字段不影响其他模块。
