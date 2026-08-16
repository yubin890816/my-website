## Purpose

定义 StudyPal 用户身份认证的对外行为契约：注册、登录、JWT 签发与刷新。覆盖成功路径与错误场景，不涉及前端 UI。

## Requirements

### Requirement: 用户注册

系统 SHALL 提供 `POST /api/auth/register` 端点，接收邮箱与密码，创建用户账号并返回 access token 与 refresh token。

- **GIVEN** 客户端发送 `POST /api/auth/register`，body 含合法 `email` 和 `password`（≥8 字符）
- **WHEN** 邮箱未被注册
- **THEN** 系统创建用户记录，密码以 bcrypt 哈希存储
- **AND** 返回 HTTP 201，body 含 `access_token` 与 `refresh_token`

#### Scenario: 邮箱已被注册

- **GIVEN** 客户端发送注册请求，`email` 已存在于数据库
- **WHEN** 系统校验唯一约束
- **THEN** 返回 HTTP 409
- **AND** body 含错误码 `EMAIL_ALREADY_EXISTS`
- **AND** 不创建新用户记录

#### Scenario: 密码不满足最小长度

- **GIVEN** 客户端发送注册请求，`password` 长度 < 8
- **WHEN** 系统执行输入校验
- **THEN** 返回 HTTP 422
- **AND** body 含错误码 `INVALID_PASSWORD`
- **AND** 不创建用户记录

#### Scenario: 邮箱格式无效

- **GIVEN** 客户端发送注册请求，`email` 不是合法邮箱格式
- **WHEN** 系统执行输入校验
- **THEN** 返回 HTTP 422
- **AND** body 含错误码 `INVALID_EMAIL`

### Requirement: 用户登录

系统 SHALL 提供 `POST /api/auth/login` 端点，校验用户凭据并签发 JWT token 对。

- **GIVEN** 客户端发送 `POST /api/auth/login`，body 含已注册的 `email` 与正确 `password`
- **WHEN** 凭据校验通过
- **THEN** 返回 HTTP 200，body 含 `access_token`（有效期 30 分钟）与 `refresh_token`（有效期 7 天）

#### Scenario: 密码错误

- **GIVEN** 客户端发送登录请求，`password` 与数据库哈希不匹配
- **WHEN** 系统校验凭据
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `INVALID_CREDENTIALS`
- **AND** 不签发任何 token

#### Scenario: 用户不存在

- **GIVEN** 客户端发送登录请求，`email` 不在数据库中
- **WHEN** 系统查询用户
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `INVALID_CREDENTIALS`
- **AND** 错误信息不区分"用户不存在"与"密码错误"（防止用户枚举）

### Requirement: Token 刷新

系统 SHALL 提供 `POST /api/auth/refresh` 端点，凭有效的 refresh token 签发新的 access token。

- **GIVEN** 客户端发送 `POST /api/auth/refresh`，body 含有效的 `refresh_token`
- **WHEN** token 校验通过且未过期
- **THEN** 返回 HTTP 200，body 含新的 `access_token`（旧 access token 不被显式吊销）

#### Scenario: refresh token 已过期

- **GIVEN** 客户端发送刷新请求，`refresh_token` 已超过 7 天有效期
- **WHEN** 系统校验 token
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `TOKEN_EXPIRED`
- **AND** 客户端 SHALL 引导用户重新登录

#### Scenario: refresh token 签名无效

- **GIVEN** 客户端发送刷新请求，`refresh_token` 签名与服务器密钥不匹配
- **WHEN** 系统校验 token
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `TOKEN_INVALID`

### Requirement: 受保护端点鉴权

系统 SHALL 对标记为"需认证"的端点强制校验 Bearer access token。

- **GIVEN** 客户端发送请求到受保护端点，Header 含合法 `Authorization: Bearer <access_token>`
- **WHEN** token 校验通过
- **THEN** 请求被放行，下游处理函数可获取当前用户身份

#### Scenario: 缺失 Authorization 头

- **GIVEN** 客户端发送请求到受保护端点，未携带 `Authorization` 头
- **WHEN** 系统执行鉴权中间件
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `MISSING_TOKEN`

#### Scenario: access token 已过期

- **GIVEN** 客户端发送请求到受保护端点，`access_token` 已超过 30 分钟有效期
- **WHEN** 系统校验 token
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `TOKEN_EXPIRED`
- **AND** 客户端 SHALL 使用 refresh token 自动刷新后重试原请求
