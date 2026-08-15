## Phase 1: 项目数据与截图资源

- [x] 1.1 在 `public/projects/` 目录下放置至少 4 张项目截图占位图（SVG 格式，命名为 `project-1.svg` ~ `project-4.svg`，单图 < 10KB）
- [x] 1.2 在 `src/components/Projects/` 目录下创建 `projects-data.ts`：定义 `Project` interface（name/description/screenshot/githubUrl?）与 `PROJECTS` 常量数组（至少 4 项，githubUrl 用真实 GitHub 仓库 URL 模式 `https://github.com/user/repo`，screenshot 用 `${import.meta.env.BASE_URL}projects/project-N.svg`）
- [x] 1.3 启动 dev server 验证：`/my-website/projects/project-1.svg` 等静态资源可访问（HTTP 200）

## Phase 2: Projects 组件实现

- [x] 2.1 创建 `src/components/Projects/Projects.tsx`：函数组件，根 `<section id="projects">` + section 背景（`bg-slate-50 dark:bg-slate-950`）+ 垂直 padding（`py-16` / `py-20`）
- [x] 2.2 实现卡片网格容器：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`，遍历 `PROJECTS` 渲染卡片
- [x] 2.3 实现单张卡片：截图 `<img loading="lazy">` + 项目名称 + 简介文本 + GitHub 链接（`target="_blank" rel="noopener noreferrer"`），githubUrl 缺失时不渲染链接
- [x] 2.4 加卡片基础样式：`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden` + 截图容器 `aspect-video` 防止布局抖动
- [x] 2.5 加 hover 微特效：`motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600`
- [x] 2.6 加暗色模式适配：所有颜色类用 `dark:` 前缀双套色板，对比度数学核算 ≥ 4.5:1

## Phase 3: App 整合与端到端验证

- [x] 3.1 修改 `src/App.tsx`：移除空 `<section id="projects"></section>`，挂载 `<Projects />` 组件（位于 `<Hero />` 之后、`<section id="contact">` 之前）
- [x] 3.2 类型检查：`npx tsc -b --noEmit` 通过
- [x] 3.3 浏览器端到端验证：项目区在 Hero 下方渲染、至少 4 张卡片、截图 lazy loading（`loading="lazy"`）、GitHub 链接属性正确、hover 微特效生效、暗色模式切换即时响应、窄屏单列不溢出
- [x] 3.4 锚点跳转验证：点击 Hero CTA "查看我的项目" 与导航栏"项目"链接，页面平滑滚动至 `#projects` 顶部（不被导航栏遮挡，因 `#projects` 现在有内容与高度）
