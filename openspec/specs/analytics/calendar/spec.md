## Purpose

定义学习日历热力图能力的对外行为契约：后端返回近 N 天每日学习活跃度数据，前端以 GitHub 风格热力图渲染。覆盖数据缺失、天数参数校验、鉴权场景。

## Requirements

### Requirement: 日历数据端点

系统 SHALL 通过 `GET /api/analytics/calendar` 返回当前用户近 N 天每日学习活跃度数据。

- **GIVEN** 已登录用户请求学习日历
- **WHEN** 调用 `/api/analytics/calendar?days=90`
- **THEN** 返回 200 与数组，每项含 `date`（YYYY-MM-DD）与 `level`（0-4 整数）
- **AND** level 0 表示无学习记录，1-4 表示学习时长分档（如 1-15/16-30/31-60/60+ 分钟）

#### Scenario: days 参数默认值

- **GIVEN** 请求未指定 days 参数
- **WHEN** 调用日历端点
- **THEN** 默认返回近 90 天数据
- **AND** 数组长度 ≤ 90

#### Scenario: days 参数校验

- **GIVEN** days 参数为非正整数或超过 365
- **WHEN** 调用日历端点
- **THEN** 返回 422，error_code 为 `VALIDATION_ERROR`
- **AND** 不查询数据库

#### Scenario: 部分日期无记录

- **GIVEN** 用户近 90 天内仅有部分日期有 study_logs
- **WHEN** 调用日历端点
- **THEN** 无记录的日期 level 为 0
- **AND** 数组包含所有 N 天（含 level 0 的日期）

#### Scenario: 未鉴权访问

- **GIVEN** 请求未携带有效 access token
- **WHEN** 调用日历端点
- **THEN** 返回 401，error_code 为 `MISSING_TOKEN` 或 `TOKEN_INVALID`
