## Purpose

定义成就系统能力的对外行为契约：后端返回成就列表与解锁状态，前端渲染徽章墙。成就解锁由后端在写入 study_logs 时自动检查并记录。覆盖已解锁/未解锁展示、解锁触发、鉴权场景。

## Requirements

### Requirement: 成就列表端点

系统 SHALL 通过 `GET /api/analytics/achievements` 返回当前用户的成就列表与解锁状态。

- **GIVEN** 已登录用户请求成就列表
- **WHEN** 调用 `/api/analytics/achievements`
- **THEN** 返回 200 与数组，每项含 `code`、`title`、`description`、`icon`、`unlocked`（布尔）、`unlocked_at`（可为 null）
- **AND** 列表包含所有预定义成就（含未解锁项）

#### Scenario: 成就排序

- **GIVEN** 用户已解锁部分成就
- **WHEN** 查看成就列表
- **THEN** 已解锁成就排在未解锁之前
- **AND** 已解锁内部按 `unlocked_at` 降序排列
- **AND** 未解锁内部按预定义顺序排列

#### Scenario: 成就解锁触发

- **GIVEN** 用户写入 study_logs 后满足某成就解锁条件（如首次写入触发 first_chat，连续 7 天触发 streak_7）
- **WHEN** 后端处理 study_logs 写入
- **THEN** 自动检查所有未解锁成就的条件
- **AND** 满足条件的成就写入 `achievements` 表，设置 `unlocked_at`
- **AND** 不返回解锁通知（前端无实时推送）

#### Scenario: 成就重复解锁防护

- **GIVEN** 用户已解锁某成就
- **WHEN** 再次满足该成就解锁条件
- **THEN** 不重复写入 `achievements` 表
- **AND** 保留首次 `unlocked_at` 时间

#### Scenario: 未鉴权访问

- **GIVEN** 请求未携带有效 access token
- **WHEN** 调用成就列表端点
- **THEN** 返回 401，error_code 为 `MISSING_TOKEN` 或 `TOKEN_INVALID`
