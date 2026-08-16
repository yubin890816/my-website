## Purpose

定义 StudyPal 用户档案的可读字段、访问授权，以及连续学习天数与用户等级的派生规则。覆盖 Profile 读取的成功路径、未授权拒绝与字段缺失场景。

## Requirements

### Requirement: 用户档案读取

系统 SHALL 提供 `GET /api/users/me` 端点，返回当前登录用户的 Profile 数据。

- **GIVEN** 客户端发送 `GET /api/users/me`，携带有效的 Bearer access token
- **WHEN** token 校验通过且用户存在
- **THEN** 返回 HTTP 200，body 含字段：`id` / `email` / `avatar_url` / `streak_days` / `level` / `created_at`

#### Scenario: avatar_url 为空时返回 null

- **GIVEN** 用户未设置头像，数据库 `avatar_url` 字段为 NULL
- **WHEN** 客户端请求 Profile
- **THEN** 响应 body 中 `avatar_url` 字段值为 `null`
- **AND** 其他字段正常返回

#### Scenario: 未携带 access token 访问 Profile

- **GIVEN** 客户端发送 `GET /api/users/me`，未携带 `Authorization` 头
- **WHEN** 系统执行鉴权
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `MISSING_TOKEN`
- **AND** 不返回任何用户数据

#### Scenario: access token 无效

- **GIVEN** 客户端发送请求，`access_token` 签名无效或已过期
- **WHEN** 系统校验 token
- **THEN** 返回 HTTP 401
- **AND** body 含错误码 `TOKEN_INVALID` 或 `TOKEN_EXPIRED`

### Requirement: 连续学习天数派生

系统 SHALL 在用户每次登录或记录学习活动时，根据 `last_activity_date` 派生 `streak_days` 字段。

- **GIVEN** 用户最近一次 `last_activity_date` 为昨天，且此前已连续学习 N 天
- **WHEN** 用户今日首次登录或记录学习活动
- **THEN** `streak_days` 更新为 N+1
- **AND** `last_activity_date` 更新为今日

#### Scenario: 中断后重新开始

- **GIVEN** 用户最近一次 `last_activity_date` 距今 ≥ 2 天（连续中断）
- **WHEN** 用户今日登录或记录学习活动
- **THEN** `streak_days` 重置为 1
- **AND** `last_activity_date` 更新为今日

#### Scenario: 同日重复登录不累加

- **GIVEN** 用户今日已登录过，`last_activity_date` 等于今日，`streak_days` 为 N
- **WHEN** 用户再次登录
- **THEN** `streak_days` 保持为 N 不变
- **AND** `last_activity_date` 保持为今日

### Requirement: 用户等级派生

系统 SHALL 根据累计经验值（XP）按固定阈值表派生 `level` 字段。

- **GIVEN** 用户累计 XP 满足某等级阈值（Lv1=0 / Lv2=100 / Lv3=500 / Lv4=1500 / Lv5=4000）
- **WHEN** 客户端请求 Profile
- **THEN** 响应 body 中 `level` 字段返回对应等级数字（1-5）

#### Scenario: XP 跨越阈值时立即升级

- **GIVEN** 用户当前为 Lv2（XP=480），完成一次学习活动获得 30 XP
- **WHEN** XP 累计达到 510，超过 Lv3 阈值 500
- **THEN** `level` 立即更新为 3
- **AND** 下次 Profile 请求返回 `level: 3`

#### Scenario: XP 字段缺失时降级返回

- **GIVEN** 用户记录异常，`xp` 字段为 NULL 或缺失
- **WHEN** 客户端请求 Profile
- **THEN** `level` 字段返回默认值 1
- **AND** 不抛出服务端错误
