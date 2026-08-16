## Purpose

定义后端学习数据统计概览聚合 API 的对外行为契约：基于 `study_logs` 表聚合返回今日/本周学习时长、完成目标数、连续打卡天数、周排名，供前端统计卡片消费。覆盖鉴权、空数据、聚合失败场景。

## ADDED Requirements

### Requirement: 统计概览聚合端点

系统 SHALL 通过 `GET /api/analytics/overview` 返回当前用户的统计概览数据。

- **GIVEN** 已登录用户请求统计概览
- **WHEN** 调用 `/api/analytics/overview`
- **THEN** 返回 200 与 JSON 对象，含 `today_minutes`、`week_minutes`、`today_goals_completed`、`streak_days`、`weekly_rank` 字段
- **AND** 所有数值字段为非负整数，缺失时为 0

#### Scenario: 周排名计算

- **GIVEN** 系统中存在多个用户的学习日志
- **WHEN** 计算当前用户的 `weekly_rank`
- **THEN** 按本周学习时长降序排名，返回名次（从 1 开始）
- **AND** 并列时按 user_id 升序

#### Scenario: 连续打卡天数计算

- **GIVEN** 用户最近 N 天每天均有 study_logs 记录
- **WHEN** 计算 `streak_days`
- **THEN** 从今日倒推连续有记录的天数
- **AND** 今日无记录时 streak 为 0（不要求今日必须有）

#### Scenario: 无任何学习日志

- **GIVEN** 新注册用户从未写入 study_logs
- **WHEN** 调用统计概览端点
- **THEN** 返回 200，所有字段为 0
- **AND** `weekly_rank` 为 0（不参与排名）

#### Scenario: 未鉴权访问

- **GIVEN** 请求未携带有效 access token
- **WHEN** 调用统计概览端点
- **THEN** 返回 401，error_code 为 `MISSING_TOKEN` 或 `TOKEN_INVALID`
