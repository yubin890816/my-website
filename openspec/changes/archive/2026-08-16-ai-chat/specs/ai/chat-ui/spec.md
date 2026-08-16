## Purpose

定义前端 AI 对话页面的对外行为契约：消息气泡布局、Markdown 渲染、自动滚动、SSE 流式接收、发送交互、错误反馈与会话恢复。覆盖加载中、流式中、错误、空会话等场景。

## ADDED Requirements

### Requirement: 对话页面渲染

系统 SHALL 提供 ChatPage 作为 AI 对话页面的容器，渲染消息列表区与底部输入区，消息以气泡形式呈现。

- **GIVEN** 已登录用户点击 Sidebar 中的"AI 助手"导航项
- **WHEN** ChatPage 挂载
- **THEN** 显示消息列表区（占满主内容区高度）与底部输入框
- **AND** 输入框始终固定在视口底部可见
- **AND** 消息列表区独立滚动

#### Scenario: 空会话首次进入

- **GIVEN** 用户当前会话无任何消息
- **WHEN** ChatPage 渲染
- **THEN** 消息列表区显示欢迎占位符（如"和你的 AI 学习教练开始对话吧"）
- **AND** 不显示 loading 指示器

#### Scenario: 暗色模式适配

- **GIVEN** 站点处于暗色模式
- **WHEN** ChatPage 渲染
- **THEN** 用户气泡使用 indigo 色板、AI 气泡使用 slate 色板
- **AND** 文字与背景对比度 ≥ 4.5:1（WCAG AA）

#### Scenario: 加载历史失败

- **GIVEN** 拉取历史消息 API 返回 5xx
- **WHEN** ChatPage 渲染
- **THEN** 消息列表区显示"历史加载失败，点击重试"按钮
- **AND** 输入框置灰禁用

### Requirement: 消息气泡与 Markdown 渲染

系统 SHALL 将 AI 回复以 Markdown 渲染（支持代码块、列表、加粗等 GFM 语法），用户消息以纯文本呈现。

- **GIVEN** AI 回复包含 GFM 代码块（```语法）
- **WHEN** 消息气泡渲染
- **THEN** 代码块以等宽字体与浅色背景呈现
- **AND** 代码块可水平滚动，不撑破气泡宽度

#### Scenario: 用户消息换行保留

- **GIVEN** 用户消息含 `\n` 换行
- **WHEN** 用户气泡渲染
- **THEN** 换行在气泡中保留显示
- **AND** 不进行 Markdown 解析

#### Scenario: 危险 HTML 转义

- **GIVEN** AI 回复含 `<script>` 标签或内联 HTML
- **WHEN** Markdown 渲染
- **THEN** 原始 HTML 不被执行
- **AND** 标签以文本形式显示

### Requirement: 流式接收与打字效果

系统 SHALL 通过 SSE 接收 AI 回复增量，逐字追加到当前 assistant 气泡，呈现打字效果。

- **GIVEN** 用户发送消息后服务端开始流式返回
- **WHEN** 收到 `event: delta`
- **THEN** 新增一个 assistant 气泡并追加增量文本
- **AND** 气泡显示打字光标（如闪烁的竖线）
- **AND** 输入框置灰禁用直至 `event: done`

#### Scenario: 收到 error 事件

- **GIVEN** 流式响应进行中收到 `event: error`
- **WHEN** 前端处理 error 事件
- **THEN** 在当前 assistant 气泡后追加错误提示（如"AI 回复失败，请重试"）
- **AND** 终止流式状态，恢复输入框可用

#### Scenario: 网络中断流式中止

- **GIVEN** 流式响应进行中网络断开（fetch 抛出 TypeError）
- **WHEN** 前端检测到连接中断
- **THEN** 已接收的部分内容保留显示
- **AND** 显示"网络中断"提示与"重试"按钮
- **AND** 重试时仅重新发送未完成的部分（或整条重发，由实现决定）

### Requirement: 自动滚动到底部

系统 SHALL 在新消息到达或流式增量追加时，自动将消息列表滚动到底部。

- **GIVEN** 用户处于对话中，消息列表已滚动到非底部位置
- **WHEN** 收到新的 delta 或新消息
- **THEN** 列表平滑滚动到底部
- **AND** 滚动行为不干扰用户主动上滑浏览历史

#### Scenario: 用户主动上滑时不强制下拉

- **GIVEN** 用户已主动向上滚动查看历史
- **WHEN** 流式增量到达
- **THEN** 不自动滚动到底部
- **AND** 显示"新消息"悬浮按钮，点击后滚动到底部

### Requirement: 发送消息交互

系统 SHALL 提供多行输入框与发送按钮，支持 Enter 发送、Shift+Enter 换行。

- **GIVEN** 用户在输入框中输入非空文本
- **WHEN** 用户按下 Enter 键（未按 Shift）或点击发送按钮
- **THEN** 立即将消息追加到列表（用户气泡）
- **AND** 清空输入框
- **AND** 发起流式请求

#### Scenario: 空消息禁止发送

- **GIVEN** 输入框仅含空白字符
- **WHEN** 用户按 Enter 或点击发送
- **THEN** 不发起请求
- **AND** 输入框不清空

#### Scenario: 超长消息前端拦截

- **GIVEN** 输入框内容超过 4000 字符
- **WHEN** 用户尝试发送
- **THEN** 不发起请求
- **AND** 输入框下方显示"单条消息不超过 4000 字符"提示

#### Scenario: 流式中禁止重复发送

- **GIVEN** 流式响应进行中
- **WHEN** 用户尝试再次发送消息
- **THEN** 发送按钮与 Enter 均不触发新请求
- **AND** 视觉上按钮置灰禁用
