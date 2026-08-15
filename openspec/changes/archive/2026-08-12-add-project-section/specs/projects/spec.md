## Purpose

向访客展示作者的代表性项目集合，每张卡片含截图/名称/简介/GitHub 链接，让访客快速了解作者的作品能力。

## ADDED Requirements

### Requirement: 项目区位置与结构

项目区 SHALL 渲染在 Hero 区块下方，具有 `id="projects"`，作为 Hero CTA 与导航栏"项目"链接的锚点目标。

- **GIVEN** 页面渲染完成
- **WHEN** 检查 DOM 结构
- **THEN** 存在 `<section id="projects">` 元素
- **AND** 该 section 位于 Hero 区块之后
- **AND** 该 section 具有非零高度（包含可见内容）

#### Scenario: 锚点跳转后目标不被导航栏遮挡

- **GIVEN** 访客在 Hero 区块点击 CTA 按钮或导航栏"项目"链接
- **WHEN** 页面滚动至 `#projects`
- **THEN** 项目区顶部对齐视口顶部下方（不被固定导航栏遮挡）
- **AND** URL hash 更新为 `#projects`

### Requirement: 卡片式布局展示项目

项目区 SHALL 以卡片网格布局展示项目集合，每张卡片包含项目截图、项目名称、项目简介、GitHub 链接四个元素。

- **GIVEN** 项目区渲染完成
- **WHEN** 查看项目区内容
- **THEN** 出现以卡片形式排列的项目集合
- **AND** 每张卡片包含一张项目截图（`<img>` 元素）
- **AND** 每张卡片包含项目名称
- **AND** 每张卡片包含项目简介文本
- **AND** 每张卡片包含一个指向 GitHub 仓库的链接（`<a href="https://...">`）

#### Scenario: 最少展示 4 个项目

- **GIVEN** 项目区渲染完成
- **WHEN** 统计卡片数量
- **THEN** 卡片数量 ≥ 4

#### Scenario: 项目截图使用 lazy loading

- **GIVEN** 项目区渲染完成，截图位于视口外
- **WHEN** 检查 `<img>` 元素的 `loading` 属性
- **THEN** 所有项目截图的 `loading="lazy"`
- **AND** 截图在进入视口附近时才加载（不阻塞首屏）

### Requirement: GitHub 链接外跳

每张卡片的 GitHub 链接 SHALL 在新标签页打开，并指明外部跳转语义。

- **GIVEN** 项目卡片渲染完成
- **WHEN** 查看GitHub 链接属性
- **THEN** 链接的 `href` 指向 `https://github.com/...` 开头的外部 URL
- **AND** 链接具有 `target="_blank"`
- **AND** 链接具有 `rel="noopener noreferrer"`（安全要求）

#### Scenario: GitHub 链接 URL 缺失时的降级

- **GIVEN** 某个项目数据缺少 GitHub URL
- **WHEN** 渲染该卡片
- **THEN** 不渲染 GitHub 链接（而非渲染空 href 的 `<a>`）
- **AND** 其他卡片不受影响

### Requirement: 鼠标悬浮微特效

项目卡片 SHALL 在鼠标悬浮时呈现轻量微特效（如轻微上移、阴影加深、边框高亮等），增强交互反馈。

- **GIVEN** 访客将鼠标悬浮在某张项目卡片上
- **WHEN** hover 状态触发
- **THEN** 卡片呈现可感知的视觉变化（如 transform、box-shadow、border-color 变化）
- **AND** 特效为过渡动画而非突变

#### Scenario: 用户启用减少动效偏好

- **GIVEN** 访客系统设置 `prefers-reduced-motion: reduce`
- **WHEN** 鼠标悬浮项目卡片
- **THEN** 不触发任何过渡动画
- **AND** 视觉状态直接切换（无 duration）

#### Scenario: 触屏设备无 hover

- **GIVEN** 访客使用触屏设备（无鼠标 hover 能力）
- **WHEN** 查看项目卡片
- **THEN** 卡片始终呈现默认状态
- **AND** 不因缺少 hover 而丢失信息（所有内容在默认状态可见）

### Requirement: 亮/暗双主题适配

项目区 SHALL 在亮色模式与暗色模式下均保证文本与背景的对比度满足 WCAG AA 标准（对比度 ≥ 4.5:1）。

- **GIVEN** 站点当前处于亮色模式
- **WHEN** 项目区渲染
- **THEN** 卡片背景、文本、边框使用亮色色板
- **AND** 文本颜色与卡片背景对比度 ≥ 4.5:1

- **GIVEN** 站点当前处于暗色模式
- **WHEN** 项目区渲染
- **THEN** 卡片背景、文本、边框使用暗色色板
- **AND** 文本颜色与卡片背景对比度 ≥ 4.5:1

#### Scenario: 主题切换时项目区即时响应

- **GIVEN** 项目区已渲染，当前为亮色模式
- **WHEN** 主题被切换为暗色（由 `theme` capability 触发）
- **THEN** 卡片背景、文本、边框立即切换为暗色版本
- **AND** 切换过程不产生视觉闪烁

### Requirement: 响应式布局

项目区 SHALL 在不同视口宽度下保持可读性，卡片网格自适应列数。

- **GIVEN** 访客使用桌面宽屏（≥ 1024px）
- **WHEN** 项目区渲染
- **THEN** 卡片以多列网格排列（如 2-3 列）

- **GIVEN** 访客使用平板宽度（768px-1023px）
- **WHEN** 项目区渲染
- **THEN** 卡片以适中列数排列（如 2 列）

#### Scenario: 窄屏单列不溢出

- **GIVEN** 访客使用视口宽度 < 640px 的窄屏设备
- **WHEN** 项目区渲染
- **THEN** 卡片以单列排列
- **AND** 不出现水平滚动条
- **AND** 卡片内容不溢出视口
