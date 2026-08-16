## Purpose

定义用户档案展示 UI 的对外行为契约：在 Topbar 用户菜单与 Profile 展示组件中呈现用户身份信息（头像、邮箱、连续学习天数、等级）。覆盖数据加载中、加载失败、字段为空的场景。

## ADDED Requirements

### Requirement: Topbar 用户入口

系统 SHALL 在 Topbar 右侧显示用户入口区域，根据登录状态显示不同内容。

- **GIVEN** 用户已登录
- **WHEN** Topbar 渲染
- **THEN** 右侧显示用户头像（圆形，首字母占位符）+ 邮箱前缀
- **AND** 点击头像展开下拉菜单，含"Profile"项与"登出"项

#### Scenario: 未登录时显示登录按钮

- **GIVEN** 用户未登录
- **WHEN** Topbar 渲染
- **THEN** 右侧显示"登录"按钮
- **AND** 点击按钮跳转到认证表单页

#### Scenario: 下拉菜单点击外部关闭

- **GIVEN** 用户头像下拉菜单已展开
- **WHEN** 用户点击菜单外部任意区域
- **THEN** 下拉菜单收起
- **AND** 不触发菜单项动作

#### Scenario: 头像首字母派生

- **GIVEN** 用户的 `avatar_url` 为 null
- **WHEN** 渲染头像
- **THEN** 显示用户邮箱首字母的大写形式（如 `alice@test.com` → "A"）
- **AND** 背景使用 indigo 色板

### Requirement: Profile 展示组件

系统 SHALL 提供 ProfileBadge 组件，展示连续学习天数与用户等级徽章。

- **GIVEN** 用户已登录，Profile 数据已加载
- **WHEN** ProfileBadge 渲染
- **THEN** 显示"🔥 N 天"连续学习天数
- **AND** 显示"Lv N"等级徽章
- **AND** 两者使用不同的视觉样式区分

#### Scenario: Profile 加载中

- **GIVEN** 用户刚登录，Profile 数据尚未返回
- **WHEN** ProfileBadge 渲染
- **THEN** 显示骨架屏（skeleton）占位符
- **AND** 不显示 "0 天" 或 "Lv 1" 默认值

#### Scenario: streak_days 为 0

- **GIVEN** 用户的 `streak_days` 字段为 0
- **WHEN** ProfileBadge 渲染
- **THEN** 显示"0 天"（不隐藏）
- **AND** 视觉样式与 N>0 一致

#### Scenario: level 派生异常

- **GIVEN** 后端返回的 `level` 字段为 null 或缺失
- **WHEN** ProfileBadge 渲染
- **THEN** 显示"Lv 1"作为降级默认值
- **AND** 不抛出前端错误
