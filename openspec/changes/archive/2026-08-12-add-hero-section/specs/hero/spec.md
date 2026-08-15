## Purpose

向访客展示个人品牌核心信息（名字、职业、一句话介绍），并提供进入项目区的入口，作为访客落地后的首屏体验。

## ADDED Requirements

### Requirement: 全屏高度展示

Hero 区块 SHALL 占据视口完整高度，确保首屏不出现滚动条，内容在视口内垂直居中。

- **GIVEN** 访客使用任意现代浏览器访问站点首页
- **WHEN** 页面完成首次渲染
- **THEN** Hero 区块高度等于视口可视高度（动态视口高度，非固定 `100vh`）
- **AND** 首屏不出现垂直滚动条
- **AND** 名字、职业、介绍文本、CTA 按钮均在视口可见范围内

#### Scenario: 移动端地址栏伸缩不产生空白

- **GIVEN** 访客使用 iOS Safari 等动态地址栏浏览器
- **WHEN** 访客滚动页面导致地址栏收起或展开
- **THEN** Hero 区块高度始终跟随动态视口高度变化
- **AND** 不出现底部空白或内容被裁切

### Requirement: 品牌信息展示

Hero 区块 SHALL 居中显示名字、职业、一句话介绍三段品牌信息，层级清晰。

- **GIVEN** 访客进入站点首页
- **WHEN** Hero 区块渲染完成
- **THEN** 名字以 H1 标签呈现，且为站内唯一 H1
- **AND** 职业以次级文本呈现，视觉权重低于名字
- **AND** 一句话介绍以辅助文本呈现，视觉权重低于职业
- **AND** 三段内容水平居中

#### Scenario: 长文本不破坏布局

- **GIVEN** 一句话介绍文本长度超过 40 个中文字符
- **WHEN** 在视口宽度 < 375px 的窄屏设备上渲染
- **THEN** 文本自动换行
- **AND** 不出现水平溢出或横向滚动条
- **AND** 整体仍保持水平居中

### Requirement: CTA 按钮锚点跳转

Hero 区块 SHALL 包含一个名为"查看我的项目"的 CTA 按钮，点击后平滑滚动至页面内的 `#projects` 锚点。

- **GIVEN** 页面存在 `id="projects"` 的元素作为锚点目标
- **WHEN** 访客点击"查看我的项目"按钮
- **THEN** 页面平滑滚动至 `#projects` 元素位置
- **AND** 滚动行为遵循浏览器 `prefers-reduced-motion` 设置（用户启用减少动效时不平滑滚动，直接跳转）

#### Scenario: 锚点目标存在且可达

- **GIVEN** 页面 DOM 中存在 `<section id="projects">`
- **WHEN** 访客点击 CTA 按钮
- **THEN** 视口滚动至该 section 顶部对齐视口顶部

#### Scenario: 锚点目标缺失时的降级

- **GIVEN** 因渲染异常导致 `#projects` 元素不存在于 DOM
- **WHEN** 访客点击 CTA 按钮
- **THEN** 浏览器 URL 不更新为无效锚点
- **AND** 不抛出 JavaScript 错误
- **AND** 页面不发生滚动

### Requirement: 静态科技感渐变背景

Hero 区块 SHALL 使用纯 CSS 渐变作为背景，呈现科技感视觉风格，且禁止任何动画效果。

- **GIVEN** Hero 区块渲染
- **WHEN** 背景样式应用
- **THEN** 背景为静态 CSS 渐变（linear 或 conic）
- **AND** 背景不包含任何 keyframe 动画、transition 动画、粒子效果
- **AND** 背景在亮色与暗色模式下分别使用不同的渐变色板

#### Scenario: 用户启用减少动效偏好

- **GIVEN** 访客系统设置 `prefers-reduced-motion: reduce`
- **WHEN** Hero 渲染
- **THEN** 背景保持静态（与本需求的默认行为一致）
- **AND** CTA 按钮的 hover 状态不触发任何过渡动画

### Requirement: 亮/暗双主题适配

Hero 区块 SHALL 在亮色模式与暗色模式下均保证文本与背景的对比度满足 WCAG AA 标准（对比度 ≥ 4.5:1）。

- **GIVEN** 站点当前处于亮色模式
- **WHEN** Hero 渲染
- **THEN** 背景使用亮色渐变色板
- **AND** 文本颜色与背景对比度 ≥ 4.5:1

- **GIVEN** 站点当前处于暗色模式
- **WHEN** Hero 渲染
- **THEN** 背景使用暗色渐变色板
- **AND** 文本颜色与背景对比度 ≥ 4.5:1

#### Scenario: 主题切换时 Hero 即时响应

- **GIVEN** Hero 已渲染，当前为亮色模式
- **WHEN** 主题被切换为暗色（由 `theme` capability 触发）
- **THEN** Hero 背景渐变色板立即切换为暗色版本
- **AND** 文本颜色立即切换为暗色模式对应颜色
- **AND** 切换过程不产生视觉闪烁

### Requirement: 项目区占位锚点

本变更 SHALL 在页面中保留一个空的 `<section id="projects">` 作为 CTA 锚点目标，不填充任何内容。

- **GIVEN** 页面渲染完成
- **WHEN** 检查 DOM 结构
- **THEN** 存在 `<section id="projects">` 元素
- **AND** 该 section 不含任何子内容（占位）
- **AND** 该 section 位于 Hero 区块之后
