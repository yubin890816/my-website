## Context

当前站点结构为 `<ThemeProvider>` 包裹 `<Hero />` + 空 `<section id="projects">`。Hero 用 `min-h-dvh` 占满首屏，全局 CSS 已有 `scroll-behavior: smooth`（带 `prefers-reduced-motion` 守卫）。主题切换通过 `<html>` 上的 `dark` class 实现。

本变更新增固定顶部导航栏，复用现有主题机制，并引入全局 `scroll-padding-top` 解决固定导航栏遮挡锚点目标的问题。Hero 自身行为不变，仅新增 `id="home"`。

## Goals / Non-Goals

**Goals:**
- 实现固定顶部导航栏，含品牌标识与 3 个锚点链接
- 引入常驻 frosted glass 视觉（`backdrop-blur` + 半透明背景）
- 解决固定导航栏遮挡锚点目标的问题（通过 `scroll-padding-top`）
- 给 Hero 加 `id="home"`，新增空 `<section id="contact">` 占位
- 复用现有 `theme` capability，无新增主题逻辑

**Non-Goals:**
- 不做 scroll spy、汉堡菜单、显示/隐藏动画（见 proposal out-of-scope）
- 不修改 Hero 现有视觉与交互行为（仅加 `id`）
- 不修改 theme capability
- 不填充 `#contact` 内容

## Decisions

### Decision 1: 用 `position: fixed` 而非 `sticky`

**选择**：`fixed top-0 left-0 right-0 z-50`

**理由**：
- `fixed` 脱离文档流，导航栏始终固定在视口顶部，不随滚动消失
- `sticky` 需要父容器配合，且在 Hero `min-h-dvh` 之后的行为不如 `fixed` 直观
- `fixed` 的副作用是导航栏不占文档流空间，下方内容会从视口顶部开始渲染——但 Hero 是 `min-h-dvh`，首屏无滚动条，导航栏覆盖 Hero 顶部约 64px 是可接受的（Hero 内容居中，不会被裁切，仅视觉中心略偏下）

**备选**：`sticky top-0` —— 会在 Hero 滚出后才开始 sticky，但 Hero 占满首屏，访客落地时导航栏还未 sticky，体验差。否决。

### Decision 2: Frosted glass 用 `backdrop-blur-md` + `bg-*/70`

**选择**：
```
亮色: bg-white/70 backdrop-blur-md
暗色: dark:bg-slate-950/70 dark:backdrop-blur-md
```

**理由**：
- `/70` 透明度让下方内容隐约可见，`backdrop-blur-md`（8px）提供足够模糊
- `backdrop-blur` 在所有现代浏览器支持（Chrome 76+、Safari 9+、Firefox 103+）
- 性能：`backdrop-filter` 由 GPU 加速，滚动时性能可接受

**备选**：
- `backdrop-blur-sm`（4px）：模糊不够，可读性略差
- `backdrop-blur-lg`（16px）：过度模糊，性能开销增加
- 纯透明无 blur：不符合 spec 的 frosted glass 要求

### Decision 3: 用 `scroll-padding-top` 而非 JS 偏移

**选择**：在 `src/index.css` 的 `html` 选择器加 `scroll-padding-top: 4rem;`

**理由**：
- 全局 CSS 一行解决所有锚点跳转的遮挡问题（Hero CTA、导航链接都受益）
- 无需 JS 监听点击 + 手动 `scrollTo` 偏移
- 与现有 `scroll-behavior: smooth` 协同工作
- `4rem`（64px）对应导航栏高度

**备选**：JS 拦截每个锚点点击 + `scrollTo({ top: target.offsetTop - 64 })` —— 代码量大、需处理 reduced-motion、维护成本高。否决。

### Decision 4: 导航链接用原生 `<a href="#...">` + onClick 拦截

**选择**：与 Hero CTA 一致的策略——原生 `<a>` 标签 + `onClick` 处理器在目标缺失时 `preventDefault()`

**理由**：
- 复用 add-hero-section 变更已验证的锚点降级模式
- 原生 `<a>` 保证可访问性（键盘导航、右键打开等）
- `scroll-padding-top` + `scroll-behavior: smooth` 已处理滚动行为，无需 JS 干预正常情况

**备选**：纯 JS `scrollIntoView` —— 失去 `<a>` 的语义与可访问性。否决。

### Decision 5: 品牌标识用 `<a href="#home">` 而非 `<span>`

**选择**：左侧品牌名字为 `<a href="#home">`，点击跳回首页

**理由**：
- 与导航链接行为一致
- 提供额外的"回到首页"入口
- 非 H1 标签，不与 Hero H1 冲突

### Decision 6: 窄屏不引入汉堡菜单

**选择**：始终展示 3 个短链接（首页、项目、联系我），用 `text-sm` 在窄屏缩小字号

**理由**：
- 3 个中文短词 + 品牌名字在 320px 仍可容纳（实测约 280px 宽）
- 汉堡菜单需要额外的展开/收起状态管理，增加复杂度
- out-of-scope 已排除多级下拉，汉堡菜单在精神上也应排除

**备选**：`md:` 断点切换汉堡菜单 —— 超出本变更范围。否决。

### Decision 7: 导航栏高度 `h-16`（64px）

**选择**：`h-16`（4rem = 64px）

**理由**：
- 64px 是移动端导航栏的常见高度，触控友好（Apple HIG 建议触控目标 ≥ 44px）
- 与 `scroll-padding-top: 4rem` 对齐
- 在 320px 窄屏不过分占用垂直空间

## Risks / Trade-offs

- **[Risk] `backdrop-filter` 在旧浏览器不支持** → 降级为半透明背景（无 blur），可读性仍达标（`/70` 透明度保证）。不引入 polyfill。
- **[Risk] 固定导航栏遮挡 Hero 顶部内容** → Hero 内容居中，64px 遮挡不影响可见性，接受此偏移不补偿（与 spec 对齐）。
- **[Risk] `scroll-padding-top` 影响所有锚点跳转** → 这是预期行为，Hero CTA 也受益（跳转后 `#projects` 不被遮挡）。
- **[Trade-off] 品牌名字与 Hero H1 文本重复** → 牺牲少量 SEO 严格性换取导航一致性，可接受（H1 仍唯一）。
- **[Trade-off] 窄屏 3 个链接可能拥挤** → 用 `text-sm` 缩小字号缓解，不做汉堡菜单。
