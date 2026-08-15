## Phase 1: 全局 CSS 与锚点占位

- [x] 1.1 在 `src/index.css` 的 `html` 选择器新增 `scroll-padding-top: 4rem;`（与现有 `scroll-behavior: smooth` 协同）
- [x] 1.2 修改 `src/App.tsx`：给 `<Hero />` 包裹的 Hero 区块加 `id="home"`（通过 Hero 组件的根 `<section>` 实现，需确认 Hero 组件接受 id 或直接在 App.tsx 用 `<div id="home">` 包裹——按 spec 要求 Hero 的 DOM 元素具有 `id="home"`，在 Hero 组件根 section 上加）
- [x] 1.3 修改 `src/App.tsx`：在 `<section id="projects">` 之后新增空 `<section id="contact"></section>`
- [x] 1.4 启动 dev server 验证：`#home`、`#projects`、`#contact` 三个锚点在 DOM 中存在，URL 手动加 `#contact` 不报错

## Phase 2: Navigation 组件实现

- [x] 2.1 创建 `src/components/Navigation/Navigation.tsx`：函数组件，根 `<nav>` 用 `fixed top-0 left-0 right-0 z-50 h-16` + frosted glass 类（`bg-white/70 backdrop-blur-md dark:bg-slate-950/70`）
- [x] 2.2 实现左侧品牌标识：`<a href="#home">` 包裹个人名字文本，非 H1 标签
- [x] 2.3 实现右侧 3 个导航链接：`<a href="#home">首页</a>`、`<a href="#projects">项目</a>`、`<a href="#contact">联系我</a>`，按顺序排列，用 flex 布局
- [x] 2.4 为每个链接加 `onClick` 拦截器：目标缺失时 `preventDefault()`（复用 Hero CTA 的模式）
- [x] 2.5 加暗色模式适配：所有颜色类用 `dark:` 前缀双套色板，验证对比度 ≥ 4.5:1
- [x] 2.6 加窄屏适配：`text-sm sm:text-base` 字号断点，确保 320px 宽度不溢出

## Phase 3: App 整合与端到端验证

- [x] 3.1 修改 `src/App.tsx`：在 `<ThemeProvider>` 内、`<Hero />` 之前挂载 `<Navigation />`
- [x] 3.2 修改 `src/components/Hero/Hero.tsx`：根 `<section>` 加 `id="home"` 属性（落实 hero spec MODIFIED requirement）
- [x] 3.3 类型检查：`npx tsc -b --noEmit` 通过
- [x] 3.4 浏览器端到端验证：导航栏 fixed 在顶部、frosted glass 生效、3 个链接点击平滑滚动到对应锚点、暗色模式切换即时响应、窄屏不溢出
