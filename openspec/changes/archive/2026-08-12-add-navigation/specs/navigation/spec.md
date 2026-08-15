## Purpose

提供固定在视口顶部的导航栏，让访客在任意滚动位置都能快速跳转到首页、项目区、联系区，并通过 frosted glass 视觉效果增强科技感。

## ADDED Requirements

### Requirement: 固定顶部展示

导航栏 SHALL 固定在视口顶部，在任意滚动位置均可见，不随页面滚动消失。

- **GIVEN** 访客在任意滚动位置（包括页面顶部、中部、底部）
- **WHEN** 查看视口顶部
- **THEN** 导航栏固定显示在视口顶部
- **AND** 导航栏在垂直方向不随页面滚动而移动

#### Scenario: 导航栏不遮挡下方内容的水平布局

- **GIVEN** 导航栏固定在顶部，高度约为 64px
- **WHEN** 访客滚动页面
- **THEN** 下方内容可以从导航栏下方滚动穿过（透过 frosted glass 看到模糊效果）
- **AND** 不出现水平滚动条

### Requirement: 品牌标识展示

导航栏左侧 SHALL 显示个人名字作为品牌标识，点击后跳回首页锚点 `#home`。

- **GIVEN** 导航栏渲染完成
- **WHEN** 查看导航栏左侧
- **THEN** 显示个人名字文本
- **AND** 该文本为可点击链接，`href` 指向 `#home`

#### Scenario: 品牌标识与 Hero H1 不重复语义

- **GIVEN** 导航栏左侧显示个人名字，Hero 区块也有同名 H1
- **WHEN** 检查 DOM 结构
- **THEN** 导航栏的品牌标识使用非 H1 标签（如 `<a>` 或 `<span>`）
- **AND** 站内仍只有一个 H1（位于 Hero 区块）

### Requirement: 导航链接集合

导航栏右侧 SHALL 包含 3 个锚点链接：首页（`#home`）、项目（`#projects`）、联系我（`#contact`），按此顺序排列。

- **GIVEN** 导航栏渲染完成
- **WHEN** 查看导航栏右侧
- **THEN** 出现 3 个链接，从左到右依次为"首页"、"项目"、"联系我"
- **AND** 每个链接的 `href` 分别指向 `#home`、`#projects`、`#contact`

#### Scenario: 锚点目标全部存在

- **GIVEN** 页面 DOM 中同时存在 `#home`、`#projects`、`#contact` 三个元素
- **WHEN** 访客点击任一导航链接
- **THEN** 页面平滑滚动至对应锚点位置
- **AND** 滚动行为遵循 `prefers-reduced-motion`（启用时直接跳转，不平滑）
- **AND** URL hash 更新为对应锚点

#### Scenario: 锚点目标缺失时的降级

- **GIVEN** 因渲染异常导致某个锚点目标（如 `#contact`）不存在于 DOM
- **WHEN** 访客点击对应导航链接
- **THEN** 浏览器 URL 不更新为无效锚点（点击处理拦截默认行为）
- **AND** 不抛出 JavaScript 错误
- **AND** 页面不发生滚动

### Requirement: 常驻 Frosted Glass 视觉

导航栏 SHALL 常驻 frosted glass 效果（半透明背景 + 背景模糊），在亮色与暗色模式下分别使用匹配的色板。

- **GIVEN** 导航栏渲染，页面下方有内容
- **WHEN** 下方内容滚动到导航栏后方
- **THEN** 透过导航栏可看到模糊化的内容（backdrop-blur 效果）
- **AND** 导航栏背景为半透明（非完全不透明）

#### Scenario: 暗色模式下的 frosted glass

- **GIVEN** 站点当前处于暗色模式
- **WHEN** 查看导航栏
- **THEN** 导航栏使用暗色半透明背景（如 `dark:bg-slate-950/70`）
- **AND** backdrop-blur 效果仍生效
- **AND** 导航栏文字与背景对比度 ≥ 4.5:1（WCAG AA）

### Requirement: 亮/暗双主题适配

导航栏 SHALL 在亮色模式与暗色模式下均保证文字与背景的对比度满足 WCAG AA 标准（对比度 ≥ 4.5:1）。

- **GIVEN** 站点当前处于亮色模式
- **WHEN** 导航栏渲染
- **THEN** 使用亮色半透明背景
- **AND** 文字颜色与背景对比度 ≥ 4.5:1

- **GIVEN** 站点当前处于暗色模式
- **WHEN** 导航栏渲染
- **THEN** 使用暗色半透明背景
- **AND** 文字颜色与背景对比度 ≥ 4.5:1

#### Scenario: 主题切换时导航栏即时响应

- **GIVEN** 导航栏已渲染，当前为亮色模式
- **WHEN** 主题被切换为暗色（由 `theme` capability 触发）
- **THEN** 导航栏背景与文字颜色立即切换为暗色版本
- **AND** 切换过程不产生视觉闪烁

### Requirement: 窄屏不溢出

导航栏 SHALL 在视口宽度 < 375px 的窄屏设备上不出现水平溢出或横向滚动条。

- **GIVEN** 访客使用视口宽度 < 375px 的设备
- **WHEN** 导航栏渲染
- **THEN** 品牌标识与 3 个链接全部在视口内可见
- **AND** 不出现水平滚动条
- **AND** 不出现内容截断
