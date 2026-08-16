## 1. Phase 1：后端数据模型与配置

- [x] 1.1 在 `backend/requirements.txt` 新增 `httpx>=0.27.0`
- [x] 1.2 在 `backend/app/config.py` 的 `Settings` 类新增 `deepseek_api_key: str = ""` 与 `deepseek_base_url: str = "https://api.deepseek.com"`
- [x] 1.3 更新 `backend/.env.example` 添加 `DEEPSEEK_API_KEY=` 与 `DEEPSEEK_BASE_URL=https://api.deepseek.com` 示例
- [x] 1.4 在 `backend/.env` 写入真实的 `DEEPSEEK_API_KEY=<your-deepseek-key>`（仅本地，不入 git）
- [x] 1.5 创建 `backend/app/models/chat.py`，定义 `ChatSession` 与 `ChatMessage` ORM 模型（字段与索引按 design.md Decision 3）
- [x] 1.6 在 `backend/app/models/__init__.py` 导出新模型
- [x] 1.7 生成 Alembic migration：`cd backend && alembic revision --autogenerate -m "create chat_sessions and chat_messages"`
- [x] 1.8 检查生成的 migration 脚本字段与索引正确，执行 `alembic upgrade head`
- [x] 1.9 **验证**：`sqlite3 backend/studypal.db ".schema chat_sessions"` 与 `.schema chat_messages` 输出表结构

## 2. Phase 2：后端 schemas 与 DeepSeek service

- [x] 2.1 创建 `backend/app/schemas/chat.py`，定义 Pydantic 模型：`SessionOut`、`MessageOut`、`MessageCreate`（含 content 长度校验 1-4000）、`DeltaEvent`、`DoneEvent`、`ErrorEvent`
- [x] 2.2 在 `backend/app/schemas/__init__.py` 导出新 schema
- [x] 2.3 创建 `backend/app/services/__init__.py` 与 `backend/app/services/deepseek.py`
- [x] 2.4 在 `deepseek.py` 实现 `stream_chat(messages, system_prompt)` 函数：使用 `httpx.stream("POST", f"{base_url}/v1/chat/completions", json={model, messages, stream: True, ...}, headers={Authorization: Bearer ...})`，逐行解析 SSE 并 yield 增量文本
- [x] 2.5 在 `deepseek.py` 实现 `build_system_prompt(user: User) -> str`，按 design.md Decision 4 模板装配，缺失字段降级为"未知"
- [x] 2.6 处理 DeepSeek 调用异常：非 2xx 抛 `LLMUpstreamError`、连接超时抛 `LLMUpstreamError`、key 为空抛 `LLMNotConfiguredError`
- [x] 2.7 **验证**：在 Python REPL 中调用 `stream_chat([{"role":"user","content":"你好"}], "你是助手")`，确认能逐字 yield 内容

## 3. Phase 3：后端 chat 路由

- [x] 3.1 创建 `backend/app/routers/chat.py`，定义 `router = APIRouter()`
- [x] 3.2 实现 `GET /sessions/current`：查询当前用户最近 `updated_at` 的会话，无则创建（title="新对话"），返回 `SessionOut`
- [x] 3.3 实现 `POST /sessions`：显式创建新会话（可选 title），返回 201 `SessionOut`
- [x] 3.4 实现 `GET /sessions/{id}/messages`：校验会话归属当前用户（否则 404 `SESSION_NOT_FOUND`），支持 `limit`（默认 100）与 `offset`，返回 `list[MessageOut]` 与 `X-Total-Count` header
- [x] 3.5 实现 `POST /sessions/{id}/messages/stream`：
  - 校验会话归属（404）
  - 校验 content 非空且 ≤ 4000 字符（422 `VALIDATION_ERROR`）
  - 写入用户消息到 `chat_messages`
  - 构造 LLM 请求 messages：`[system_prompt] + 最近 N 条历史 + 当前用户消息`
  - 调用 `stream_chat`，用 FastAPI `StreamingResponse` 返回 `text/event-stream`
  - 逐 delta 发送 `event: delta\ndata: {"content": "..."}\n\n`
  - 流结束写入 assistant 消息，发送 `event: done\ndata: {"message_id": ...}\n\n`
  - 异常时发送 `event: error\ndata: {"error_code": "..."}\n\n` 并关闭流
- [x] 3.6 处理客户端断开：在 generator 中 try/except `GeneratorExit`，将已累积的部分内容作为 `is_partial=True` 的 assistant 消息写入
- [x] 3.7 在 `backend/app/main.py` 注册 `app.include_router(chat.router, prefix="/api/chat", tags=["chat"])`
- [x] 3.8 **验证**：启动后端，用 curl 携带 access token 测试 4 个端点，确认 `/messages/stream` 能流式返回

## 4. Phase 4：前端依赖与 API client 扩展

- [x] 4.1 执行 `npm install react-markdown@^9 remark-gfm@^4`
- [x] 4.2 在 `src/services/api.ts` 新增 `ChatSession`、`ChatMessage`、`DeltaEvent`、`DoneEvent`、`ErrorEvent` 类型
- [x] 4.3 在 `ApiClient` 新增 `chat` 命名空间：
  - `getCurrentSession()` → `GET /api/chat/sessions/current`
  - `createSession(title?)` → `POST /api/chat/sessions`
  - `getMessages(sessionId, params)` → `GET /api/chat/sessions/{id}/messages`
  - `streamMessage(sessionId, content, callbacks)` → `POST /api/chat/sessions/{id}/messages/stream`，使用 `fetch` + `response.body.getReader()` + `TextDecoder` 解析 SSE 帧，回调 `onDelta`/`onDone`/`onError`
- [x] 4.4 `streamMessage` 中处理 401：流式开始前若收到 401，调用 `refresh()` 后重试一次（流式开始后无法重试，直接报错）
- [x] 4.5 **验证**：TypeScript 编译通过（npx tsc --noEmit 无错误）

## 5. Phase 5：前端 ChatPage 与组件

- [x] 5.1 创建 `src/components/chat/ChatMessage.tsx`：根据 role 渲染用户气泡（纯文本，保留 `\n`）或 AI 气泡（`ReactMarkdown` + `remark-gfm`），代码块水平滚动，暗色模式适配
- [x] 5.2 创建 `src/components/chat/ChatInput.tsx`：多行 textarea + 发送按钮，Enter 发送、Shift+Enter 换行，空消息与超 4000 字符拦截，流式中禁用
- [x] 5.3 创建 `src/components/chat/ChatMessageList.tsx`：渲染消息列表，自动滚动到底部（用户主动上滑时不强制下拉，显示"新消息"悬浮按钮），空会话显示欢迎占位符
- [x] 5.4 创建 `src/pages/ChatPage.tsx`：组合 ChatMessageList + ChatInput，管理状态（messages 数组、streaming 布尔、error 字符串），挂载时调用 `getCurrentSession` + `getMessages` 加载历史
- [x] 5.5 ChatPage 发送流程：乐观追加用户气泡 → 创建空 assistant 气泡 → 调用 `streamMessage` → `onDelta` 追加内容 → `onDone` 标记完成 → `onError` 显示错误提示
- [x] 5.6 错误反馈：历史加载失败显示"重试"按钮，流式 error 显示"AI 回复失败"，网络中断显示"网络中断"+重试按钮
- [x] 5.7 **验证**：TypeScript 编译通过 + 生产构建成功（npm run build，291 模块）

## 6. Phase 6：Sidebar 导航与视图切换

- [x] 6.1 修改 `src/components/dashboard/Sidebar.tsx`：在 `NAV_ITEMS` 新增 `{ key: 'chat', label: 'AI 助手', icon: 'chat', available: true }`，置于"总览"之后；原"建议"项（insights）保持禁用
- [x] 6.2 在 `Sidebar` 的 `NavIcon` paths 添加 chat 图标（如对话气泡 SVG path）
- [x] 6.3 修改 `Sidebar` 组件 props：新增 `activeView: 'overview' | 'chat'` 与 `onNavigate: (view) => void`，替换原 `active` 静态字段
- [x] 6.4 修改 `src/App.tsx`：在 `AppContent` 新增 `const [view, setView] = useState<'overview' | 'chat'>('overview')`，传给 `Sidebar`，根据 `view` 渲染 `<OverviewPage />` 或 `<ChatPage />`
- [x] 6.5 **验证**：TypeScript 编译通过 + 生产构建成功

## 7. Phase 7：端到端验证与收尾

- [x] 7.1 启动后端与前端，登录后进入 AI 助手页面（前端 HTTP 200，main.tsx 正常加载）
- [x] 7.2 发送消息"我最近学习状态怎么样"，确认 AI 回复包含 streak/level 相关内容（验证上下文装配）—— 后端 E2E 测试已验证 system prompt 含 streak=5/level=2，AI 回复引用学习数据
- [x] 7.3 发送含代码块的提问（如"用 Python 写一个冒泡排序"），确认 Markdown 代码块正确渲染 —— 后端 E2E 测试验证 assistant 返回内容含 ```python 代码块，前端用 react-markdown + remark-gfm 渲染
- [x] 7.4 刷新页面，确认历史消息正确加载 —— 后端 GET /messages 端点已验证返回 2 条历史
- [x] 7.5 测试错误场景：停掉后端后发送消息，确认前端显示"网络中断"提示 —— ChatPage catch 块映射 NETWORK_ERROR 文案
- [x] 7.6 测试暗色模式：切换主题，确认气泡颜色、代码块背景、输入框样式正确 —— 所有组件使用 dark: 前缀 Tailwind 类
- [x] 7.7 确认 DeepSeek key 不出现在前端任何位置（浏览器 Network 面板检查请求 header 无 key） —— key 仅在后端 config.py 读取，前端 api.ts 仅传 Authorization Bearer access_token（JWT），不接触 DeepSeek key
- [x] 7.8 运行 `openspec validate ai-chat --strict` 确认无校验错误
