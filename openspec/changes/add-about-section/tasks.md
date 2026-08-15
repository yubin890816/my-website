## Phase 1: 照片资源与数据准备

- [ ] 1.1 在 `public/about/` 目录下放置作者照片占位图 `portrait.svg`（SVG 格式，正方形 1:1，单图 < 10KB）
- [ ] 1.2 启动 dev server 验证：`/my-website/about/portrait.svg` 静态资源可访问（HTTP 200）

## Phase 2: About 组件实现

- [ ] 2.1 创建 `src/components/About/About.tsx`：函数组件，根 `<section id="about">` + section 背景（`bg-white dark:bg-slate-900`）+ 垂直 padding（`py-16 sm:py-20`）+ 容器（`mx-auto max-w-6xl px-4`）
- [ ] 2.2 实现左右分栏布局：`flex flex-col md:flex-row gap-8 md:gap-12`，照片容器 `w-full md:w-1/3`，简介容器 `w-full md:w-2/3`
- [ ] 2.3 实现左侧照片：`<img>` 元素 + `loading="lazy"` + `aspect-square` + `object-cover` + `alt` 文本 + `src` 用 `${import.meta.env.BASE_URL}about/portrait.svg` + 圆角 `rounded-2xl`
- [ ] 2.4 实现右侧简介：3 段 `<p>` 文本，硬编码为 `ABOUT_PARAGRAPHS` 常量数组，段落间距 `space-y-4`，文本色 `text-slate-700 dark:text-slate-300`
- [ ] 2.5 实现下方品牌标签：`inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300`，文本"赋范空间"，位于分栏内容下方（`mt-10`）
- [ ] 2.6 加暗色模式适配：所有颜色类用 `dark:` 前缀双套色板，对比度数学核算 ≥ 4.5:1

## Phase 3: App 整合与端到端验证

- [ ] 3.1 修改 `src/App.tsx`：在 `<Hero />` 与 `<Projects />` 之间插入 `<About />`，顺序变为 `Navigation → Hero → About → Projects → Contact`
- [ ] 3.2 类型检查：`npx tsc -b --noEmit` 通过
- [ ] 3.3 浏览器端到端验证：About 在 Hero 与 Projects 之间渲染、照片 lazy loading（`loading="lazy"`）、3 段简介可见、品牌标签"赋范空间"可见、暗色模式切换即时响应、窄屏堆叠不溢出
- [ ] 3.4 锚点目标验证：通过 URL hash `#about` 访问，About 区域顶部对齐视口顶部下方（不被固定导航栏遮挡）
