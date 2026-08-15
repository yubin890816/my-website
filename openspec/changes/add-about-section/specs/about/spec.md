## Purpose

向访客介绍作者的背景、能力与价值主张，建立个人认知，为后续浏览项目作品提供上下文。

## ADDED Requirements

### Requirement: 关于我区域位置与结构

"关于我"区域 SHALL 渲染在 Hero 区块之后、Projects 区块之前，具有 `id="about"`，包含照片、简介、品牌标签三个组成部分。

- **GIVEN** 页面渲染完成
- **WHEN** 检查 DOM 结构
- **THEN** 存在 `<section id="about">` 元素
- **AND** 该 section 位于 Hero 区块（`#home`）之后
- **AND** 该 section 位于 Projects 区块（`#projects`）之前
- **AND** 该 section 具有非零高度（包含可见内容）

#### Scenario: 锚点目标可达（为未来导航扩展预留）

- **GIVEN** 访客通过 URL hash 或未来导航链接访问 `#about`
- **WHEN** 页面滚动至 `#about`
- **THEN** About 区域顶部对齐视口顶部下方（不被固定导航栏遮挡，复用全局 `scroll-padding-top`）
- **AND** URL hash 更新为 `#about`

### Requirement: 左侧照片展示

About 区域左侧 SHALL 展示一张作者照片，照片使用 lazy loading 加载。

- **GIVEN** About 区域渲染完成
- **WHEN** 检查左侧内容
- **THEN** 出现一张 `<img>` 元素展示作者照片
- **AND** 该 `<img>` 具有 `loading="lazy"` 属性
- **AND** 照片在进入视口附近时才加载（不阻塞首屏）

#### Scenario: 照片资源加载失败的降级

- **GIVEN** 照片 URL 失效或网络错误
- **WHEN** 浏览器加载照片失败
- **THEN** `<img>` 元素显示 `alt` 文本作为替代
- **AND** 不破坏 About 区域其余布局（简介与品牌标签仍可见）

### Requirement: 右侧个人简介

About 区域右侧 SHALL 展示 3 段个人简介文本，文本层级清晰可读。

- **GIVEN** About 区域渲染完成
- **WHEN** 检查右侧内容
- **THEN** 出现 3 段简介文本
- **AND** 每段文本为独立的段落元素（`<p>`）
- **AND** 段落之间具有可读的垂直间距

#### Scenario: 长文本不破坏布局

- **GIVEN** 某段简介文本内容较长（如超过 200 字符）
- **WHEN** About 区域在宽屏渲染
- **THEN** 文本自动换行
- **AND** 不溢出右侧容器
- **AND** 不挤压左侧照片

### Requirement: 下方品牌标签

About 区域下方 SHALL 展示品牌标签"赋范空间"，作为视觉化的关键词标签呈现。

- **GIVEN** About 区域渲染完成
- **WHEN** 检查下方内容
- **THEN** 出现一个可见的"赋范空间"标签
- **AND** 标签具有与简介文本可区分的视觉样式（如带背景色、圆角、内边距）

#### Scenario: 品牌标签在暗色模式下可读

- **GIVEN** 站点当前处于暗色模式
- **WHEN** About 区域渲染
- **THEN** 品牌标签的背景色与文本色切换为暗色版本
- **AND** 标签文本与标签背景对比度 ≥ 4.5:1

### Requirement: 亮/暗双主题适配

About 区域 SHALL 在亮色模式与暗色模式下均保证文本与背景的对比度满足 WCAG AA 标准（对比度 ≥ 4.5:1）。

- **GIVEN** 站点当前处于亮色模式
- **WHEN** About 区域渲染
- **THEN** 背景、文本使用亮色色板
- **AND** 文本颜色与背景对比度 ≥ 4.5:1

- **GIVEN** 站点当前处于暗色模式
- **WHEN** About 区域渲染
- **THEN** 背景、文本使用暗色色板
- **AND** 文本颜色与背景对比度 ≥ 4.5:1

#### Scenario: 主题切换时 About 区域即时响应

- **GIVEN** About 区域已渲染，当前为亮色模式
- **WHEN** 主题被切换为暗色（由 `theme` capability 触发）
- **THEN** 背景、文本、品牌标签立即切换为暗色版本
- **AND** 切换过程不产生视觉闪烁

### Requirement: 响应式布局

About 区域 SHALL 在不同视口宽度下保持可读性，宽屏左右分栏，窄屏上下堆叠。

- **GIVEN** 访客使用桌面宽屏（≥ 1024px）
- **WHEN** About 区域渲染
- **THEN** 照片在左侧、简介在右侧，水平分栏排列
- **AND** 品牌标签位于分栏内容下方

#### Scenario: 窄屏堆叠不溢出

- **GIVEN** 访客使用视口宽度 < 768px 的窄屏设备
- **WHEN** About 区域渲染
- **THEN** 照片与简介上下堆叠（照片在上，简介在下）
- **AND** 品牌标签位于简介下方
- **AND** 不出现水平滚动条
- **AND** 内容不溢出视口
