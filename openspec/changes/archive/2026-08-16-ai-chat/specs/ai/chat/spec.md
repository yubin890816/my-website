## Purpose

定义后端 AI 对话能力的对外行为契约：流式对话端点、会话与消息的持久化、调用 LLM 前的上下文装配（注入用户学习数据）、DeepSeek 适配。覆盖鉴权、流式中断、上游错误与持久化失败等场景。

## ADDED Requirements

### Requirement: 会话管理

系统 SHALL 提供按用户隔离的对话会话，每个用户在同一时刻仅有一个"当前会话"。

- **GIVEN** 已登录用户首次调用 `GET /api/chat/sessions/current`
- **WHEN** 该用户尚无任何会话
- **THEN** 系统隐式创建一个新会话（title 默认 "新对话"）
- **AND** 返回 200 与会话对象 `{id, title, created_at, updated_at}`

#### Scenario: 已有会话时返回最近活跃会话

- **GIVEN** 用户已存在多个会话
- **WHEN** 调用 `GET /api/chat/sessions/current`
- **THEN** 返回 `updated_at` 最新的会话
- **AND** 不创建新会话

#### Scenario: 未鉴权访问

- **GIVEN** 请求未携带有效 access token
- **WHEN** 调用会话相关端点
- **THEN** 返回 401，error_code 为 `MISSING_TOKEN` 或 `TOKEN_INVALID`

#### Scenario: 会话归属校验

- **GIVEN** 用户 A 持有自身 access token，尝试访问用户 B 的 session
- **WHEN** 调用 `GET /api/chat/sessions/{id}/messages`（id 属于用户 B）
- **THEN** 返回 404，error_code 为 `SESSION_NOT_FOUND`
- **AND** 不泄露该 session 归属用户 B 的事实

### Requirement: 流式对话端点

系统 SHALL 通过 `POST /api/chat/sessions/{id}/messages/stream` 以 Server-Sent Events 形式逐 token 返回 AI 回复。

- **GIVEN** 已登录用户向自身拥有的会话发送合法消息
- **WHEN** 请求体 `{content}` 通过校验且 DeepSeek 可达
- **THEN** 响应 Content-Type 为 `text/event-stream`
- **AND** 依次发送 `event: delta` 数据（每条携带一段增量文本）
- **AND** 流结束时发送 `event: done` 携带完整 message_id
- **AND** 用户消息与最终的 assistant 消息均持久化到 `chat_messages` 表

#### Scenario: 用户消息长度校验

- **GIVEN** 请求体 `content` 为空字符串或超过 4000 字符
- **WHEN** 调用流式端点
- **THEN** 返回 422，error_code 为 `VALIDATION_ERROR`
- **AND** 不调用 DeepSeek、不写入数据库

#### Scenario: 上游 DeepSeek 调用失败

- **GIVEN** DeepSeek 返回非 2xx 或连接超时
- **WHEN** 流式响应已开始
- **THEN** 系统发送 `event: error` 携带 error_code `LLM_UPSTREAM_ERROR`
- **AND** 关闭流
- **AND** 已写入的用户消息保留，assistant 消息不写入

#### Scenario: 客户端中途断开

- **GIVEN** 流式响应进行中，客户端断开 TCP 连接
- **WHEN** 后端检测到连接断开
- **THEN** 后端取消上游 DeepSeek 请求
- **AND** 已生成的部分 assistant 内容作为一条消息持久化（标记 partial）
- **AND** 不抛出未捕获异常

#### Scenario: 会话不存在或非本人

- **GIVEN** 请求的 session_id 不存在或不属于当前用户
- **WHEN** 调用流式端点
- **THEN** 返回 404，error_code 为 `SESSION_NOT_FOUND`
- **AND** 不调用 DeepSeek

### Requirement: 历史消息拉取

系统 SHALL 通过 `GET /api/chat/sessions/{id}/messages` 返回该会话的全部消息，按时间升序排列。

- **GIVEN** 已登录用户访问自身拥有的会话
- **WHEN** 调用历史消息端点
- **THEN** 返回 200 与消息数组，每条含 `{id, role, content, created_at}`
- **AND** role 取值为 `user` 或 `assistant`

#### Scenario: 空会话历史

- **GIVEN** 会话存在但尚无任何消息
- **WHEN** 调用历史消息端点
- **THEN** 返回 200 与空数组 `[]`

#### Scenario: 分页超限

- **GIVEN** 会话消息数超过 100 条
- **WHEN** 调用历史消息端点未指定分页参数
- **THEN** 返回最近 100 条消息
- **AND** 响应头 `X-Total-Count` 标明总数

### Requirement: 上下文装配

系统 SHALL 在调用 DeepSeek 前将当前用户的学习画像注入 system prompt，使 AI 回复具备个性化。

- **GIVEN** 已登录用户发起对话
- **WHEN** 后端构造 LLM 请求
- **THEN** system prompt 含用户的 `streak_days`、`level`、`xp`、`last_activity_date`
- **AND** system prompt 指示 AI 以学习教练角色回复，结合上述数据给出针对性建议

#### Scenario: 学习数据缺失字段降级

- **GIVEN** 用户的 `xp` 或 `last_activity_date` 为 null
- **WHEN** 装配 system prompt
- **THEN** 缺失字段以 "未知" 或 0 替代
- **AND** 不抛出异常，对话正常进行

### Requirement: DeepSeek API key 安全

系统 SHALL 通过环境变量读取 DeepSeek API key，SHALL NOT 在任何响应体、日志或前端可见位置暴露 key。

- **GIVEN** 后端启动且 `.env` 中 `DEEPSEEK_API_KEY` 已配置
- **WHEN** 调用 DeepSeek 上游 API
- **THEN** key 仅存在于后端进程内存与对 DeepSeek 的 Authorization 请求头中
- **AND** 应用日志不打印完整 key

#### Scenario: API key 未配置

- **GIVEN** 环境变量 `DEEPSEEK_API_KEY` 缺失
- **WHEN** 用户发起流式对话
- **THEN** 流式响应发送 `event: error` 携带 error_code `LLM_NOT_CONFIGURED`
- **AND** 不发起上游请求
