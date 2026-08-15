## Why

个人品牌站目前只有 Hero 与空的 `#projects` 占位，访客无法快速跳转到不同区域。需要一个固定在顶部的导航栏，让访客在任意滚动位置都能回到首页、跳到项目区、或前往联系区，同时通过 frosted glass 视觉效果增强科技感。

## What Changes

- 新增固定在视口顶部的导航栏组件（`fixed top-0`）
- 左侧显示个人名字作为品牌标识，点击跳回首页
- 右侧 3 个导航链接：首页（`#home`）、项目（`#projects`）、联系我（`#contact`）
- 导航栏常驻 frosted glass 效果（`backdrop-blur` + 半透明背景）
- 给现有 Hero 区块新增 `id="home"` 锚点
- 新增空 `<section id="contact">` 占位（与 `#projects` 占位策略一致）
- 新增全局 CSS `scroll-padding-top`（让锚点跳转留出导航栏高度，避免目标被遮挡）
- 导航栏适配亮/暗双主题

## Capabilities

### New Capabilities
- `navigation`: 固定顶部导航栏，含品牌标识、3 个锚点链接、frosted glass 视觉、主题适配

### Modified Capabilities
- `hero`: 给 Hero 区块新增 `id="home"` 锚点（使"首页"导航链接可达）

## Impact

### 对现有功能的影响

- **Hero 区块**：新增 `id` 属性，不改视觉与交互行为。Hero 的"全屏高度展示" requirement 不变——固定导航栏会遮住 Hero 顶部约 64px，但 `min-h-dvh` 仍是整视口高，首屏仍无滚动条，Hero 内容仍在视口内可见（视觉中心略偏下，接受此偏移不补偿，不改 hero spec 的"全屏高度展示" requirement）。
- **Hero CTA 锚点跳转**：`#projects` 跳转后顶部会被导航栏遮挡约 64px。新增的 `scroll-padding-top: 4rem` 全局 CSS 会同时影响 Hero CTA 与导航栏链接的锚点行为——跳转后目标 section 顶部对齐视口顶部下方 4rem 处，而非视口顶部。这是行为变化，但结果更正确（目标不被遮挡），无需修改 hero spec 的"CTA 按钮锚点跳转" requirement 文字（spec 只要求"滚动至该 section 顶部对齐视口顶部"，加了 padding 后仍满足"对齐"语义，只是对齐基准变了——这是实现细节，不构成 spec 级别的行为变化）。
- **主题基础设施**：导航栏复用现有 `theme` capability 的 `dark:` 前缀机制，无改动。

### 受影响代码

- `src/App.tsx`：挂载 `Navigation` 组件，给 Hero 加 `id="home"`，新增 `<section id="contact">`
- `src/index.css`：新增 `scroll-padding-top` 全局规则
- `src/components/Navigation/Navigation.tsx`：新文件

### Out of Scope（严禁开发）

- 不做搜索功能
- 不做多级下拉菜单
- 不做用户登录和注册
- 不做 scroll spy（滚动时高亮当前 section 对应的导航链接）
- 不做移动端汉堡菜单（窄屏始终展示 3 个短链接）
- 不填充 `#contact` section 的内容（仅占位，与 `#projects` 策略一致）
- 不做导航栏的显示/隐藏动画（滚动时自动隐藏等）
- 不做 logo 图片（左侧用文字名字）
