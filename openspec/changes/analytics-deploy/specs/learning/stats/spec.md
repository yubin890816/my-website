## MODIFIED Requirements

### Requirement: 4 个核心指标卡片展示

AnalyticsPage（原 OverviewPage）SHALL 展示 4 张统计卡片：今日学习时长（分钟）、完成目标数（个）、连续打卡天数（天）、本周排名（位）。数据来源从 mock 切换为后端 `GET /api/analytics/overview`。

- **GIVEN** 访客进入 AnalyticsPage
- **WHEN** 统计卡片区域渲染完成
- **THEN** 出现 4 张卡片，从左到右依次为：今日学习时长 / 完成目标数 / 连续打卡天数 / 本周排名
- **AND** 每张卡片显示指标名、数值、单位
- **AND** 数值字号显著大于指标名（视觉层级清晰）
- **AND** 数据通过 `GET /api/analytics/overview` 获取

#### Scenario: 同比变化标签展示

- **GIVEN** 某指标的同比变化数据已加载
- **WHEN** 卡片渲染
- **THEN** 数值下方显示同比变化标签（如 "↑12%" 或 "↓5%"）
- **AND** 上升用绿色，下降用红色
- **AND** 变化为 0 时显示 "持平" 灰色标签

#### Scenario: 加载中状态

- **GIVEN** AnalyticsPage 刚挂载，API 请求尚未返回
- **WHEN** 统计卡片区域渲染
- **THEN** 每张卡片的数值位置显示骨架屏（skeleton）占位符
- **AND** 不显示具体数值
- **AND** 不显示 "0" 默认值

#### Scenario: 加载失败降级

- **GIVEN** `/api/analytics/overview` 请求失败（网络错误或 5xx）
- **WHEN** 统计卡片区域渲染
- **THEN** 每张卡片的数值位置显示占位符 "--"
- **AND** 同比变化标签隐藏
- **AND** 卡片其余结构正常渲染
- **AND** 不抛出 JavaScript 错误

#### Scenario: 指标数据缺失

- **GIVEN** 后端返回的某指标字段为 null 或 0
- **WHEN** 对应卡片渲染
- **THEN** 数值位置显示 "0"（后端保证非负整数）
- **AND** 同比变化标签隐藏
- **AND** 卡片其余结构正常渲染（不报错）

#### Scenario: 桌面 4 列网格

- **GIVEN** 视口宽度 ≥1024px
- **WHEN** 卡片区域渲染
- **THEN** 4 张卡片横向排列为 4 列
- **AND** 卡片间距均匀（gap-4 或 gap-6）

#### Scenario: 移动端单列堆叠

- **GIVEN** 视口宽度 <640px
- **WHEN** 卡片区域渲染
- **THEN** 4 张卡片纵向堆叠为单列
- **AND** 每张卡片宽度填满主内容区
