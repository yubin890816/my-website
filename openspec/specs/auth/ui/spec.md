## Purpose

定义前端认证 UI 层的对外行为契约：登录/注册表单交互、用户上下文管理、未登录访问守卫。覆盖成功路径、表单校验错误、API 错误反馈与登出流程。

## Requirements

### Requirement: 登录注册表单

系统 SHALL 提供单一表单页，支持在"登录"与"注册"两种模式间切换，提交后调用对应后端 API。

- **GIVEN** 未登录访客访问任意页面
- **WHEN** 页面渲染
- **THEN** 显示认证表单页（默认"登录"模式）
- **AND** 表单含 `email` 输入框、`password` 输入框、提交按钮
- **AND** 底部显示"切换到注册"链接

#### Scenario: 切换到注册模式

- **GIVEN** 表单当前为"登录"模式
- **WHEN** 访客点击"切换到注册"链接
- **THEN** 表单切换为"注册"模式
- **AND** 新增 `password` 确认输入框
- **AND** 提交按钮文案变为"注册"
- **AND** 底部链接变为"切换到登录"

#### Scenario: 邮箱格式校验

- **GIVEN** 访客在 `email` 输入框输入非合法邮箱格式（如 `abc`）
- **WHEN** 访客点击提交按钮
- **THEN** 表单不提交
- **AND** `email` 输入框下方显示"请输入合法邮箱地址"错误提示

#### Scenario: 密码长度校验

- **GIVEN** 表单为"注册"模式，`password` 长度 < 8
- **WHEN** 访客点击提交按钮
- **THEN** 表单不提交
- **AND** `password` 输入框下方显示"密码至少 8 位"错误提示

#### Scenario: 两次密码不一致

- **GIVEN** 表单为"注册"模式，`password` 与确认密码不一致
- **WHEN** 访客点击提交按钮
- **THEN** 表单不提交
- **AND** 确认密码框下方显示"两次输入的密码不一致"错误提示

### Requirement: 认证状态管理

系统 SHALL 通过 AuthProvider 在 React 树顶层管理登录状态与当前用户信息，子组件通过 `useAuth()` hook 读取。

- **GIVEN** 用户成功登录或注册
- **WHEN** AuthProvider 收到 API 成功响应
- **THEN** 在内存中保存 `access_token` 与当前用户 Profile
- **AND** 触发 React 树重新渲染，受保护页面显示已登录状态

#### Scenario: 应用启动时恢复会话

- **GIVEN** 用户曾登录，`access_token` 已过期但 `refresh_token` cookie 仍有效
- **WHEN** 用户重新打开应用
- **THEN** AuthProvider 调用 `GET /api/users/me` 触发 401 → 自动 refresh → 重试
- **AND** refresh 成功后恢复登录状态，无需用户重新输入凭据

#### Scenario: 会话失效自动登出

- **GIVEN** 用户已登录，但 `refresh_token` 也已过期
- **WHEN** 任意 API 请求收到 401 且 refresh 也失败
- **THEN** AuthProvider 清除本地登录状态
- **AND** 页面切换回认证表单页
- **AND** 不显示错误弹窗（静默登出）

### Requirement: 未登录访问守卫

系统 SHALL 对 Dashboard 内容实施访问控制，未登录用户不能看到 Dashboard 主体。

- **GIVEN** 用户未登录（AuthProvider 中 `user` 为 null）
- **WHEN** 用户访问应用根路径
- **THEN** 显示认证表单页
- **AND** 不渲染 DashboardLayout / Sidebar / Topbar / OverviewPage

#### Scenario: 登录成功后跳转 Dashboard

- **GIVEN** 用户在认证表单页，输入正确凭据
- **WHEN** 登录 API 返回 200
- **THEN** 表单页消失
- **AND** DashboardLayout 渲染
- **AND** OverviewPage 显示在主内容区

### Requirement: 登出操作

系统 SHALL 提供登出入口，用户主动登出时清除本地登录状态。

- **GIVEN** 用户已登录，点击 Topbar 用户菜单中的"登出"项
- **WHEN** 登出操作触发
- **THEN** 清除内存中的 `access_token` 与用户 Profile
- **AND** 页面切换回认证表单页
- **AND** 不调用后端 `/api/auth/logout` 端点（后端未实现，refresh token 等待自然过期）

#### Scenario: 登出后无法通过浏览器后退返回 Dashboard

- **GIVEN** 用户已登出
- **WHEN** 用户点击浏览器后退按钮
- **THEN** 仍显示认证表单页
- **AND** 不渲染 Dashboard 内容
