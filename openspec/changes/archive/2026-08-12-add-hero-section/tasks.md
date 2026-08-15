## Phase 1: 主题基础设施

- [x] 1.1 修改 `src/index.css`：在 `@import "tailwindcss";` 之后添加 `@custom-variant dark (&:where(.dark, .dark *));`，并补齐暗色主题色板（在 `@theme` 中增加 `--color-*` 的 dark 对应值，或直接通过 Tailwind `dark:` 工具类实现，二选一）
- [x] 1.2 修改 `src/index.css`：添加全局平滑滚动规则 `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }`
- [x] 1.3 修改 `index.html`：在 `<head>` 中、所有 CSS link 之前注入主题预设 inline script（读取 `localStorage.getItem('theme')`，若为 `'dark'` 则给 `document.documentElement` 添加 `dark` class，用 `try/catch` 包裹）
- [x] 1.4 创建 `src/features/theme/ThemeProvider.tsx`：用 `useState<'light' | 'dark'>` 管理主题，初始值读取 `<html>` 当前是否含 `dark` class（与 inline script 结果对齐），通过 `useEffect` 在主题变化时同步 `<html>` class 与 `localStorage`
- [x] 1.5 创建 `src/features/theme/useTheme.ts`：导出 `useTheme` hook，从 Context 读取 `{ theme, toggleTheme }`；当组件未包裹在 Provider 内时，返回默认值 `{ theme: 'light', toggleTheme: () => {} }` 并在 `import.meta.env.DEV` 时 `console.warn`

**Phase 1 检查点**：暂停，总结变更，等待用户确认后再进入 Phase 2。

## Phase 2: Vite base path 配置

- [x] 2.1 修改 `vite.config.ts`：在 `defineConfig` 中增加 `base: '/my-website/'`
- [x] 2.2 运行 `npm run dev` 验证本地访问路径变为 `http://localhost:5173/my-website/`，页面正常加载无 404
- [x] 2.3 运行 `npm run build` 验证构建产物中静态资源路径均带 `/my-website/` 前缀

**Phase 2 检查点**：暂停，总结变更，等待用户确认后再进入 Phase 3。

## Phase 3: Hero 组件实现

- [x] 3.1 创建 `src/components/Hero/Hero.tsx`：定义 `Hero` 函数组件，接收 `name`、`profession`、`tagline` 三个字符串 props（带默认值，文案先用占位文本，后续由用户替换）
- [x] 3.2 在 `Hero.tsx` 中实现组件结构：`<section className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden ...">`，背景使用 Tailwind 渐变类（如 `bg-gradient-to-br from-... to-... dark:from-... dark:to-...`），暂定亮/暗各一组科技感色板
- [x] 3.3 在 `Hero.tsx` 中实现内容层：`<div className="relative z-10 flex flex-col items-center px-4 text-center">`，内含 `<h1>`（名字）、`<p>`（职业，次级样式）、`<p>`（一句话介绍，辅助样式）、`<a href="#projects">`（CTA "查看我的项目"，按钮样式）
- [x] 3.4 在 `Hero.tsx` 中验证：H1 是站内唯一 H1；文本与背景对比度 ≥ 4.5:1（用浏览器 DevTools 检查亮/暗两种模式）

**Phase 3 检查点**：暂停，总结变更，等待用户确认后再进入 Phase 4。

## Phase 4: App 整合与清理

- [x] 4.1 修改 `src/App.tsx`：移除 Vite 默认模板内容（counter 状态、`hero.png`/`react.svg`/`vite.svg` 引用、文档与社交链接 section、`import './App.css'`）
- [x] 4.2 修改 `src/App.tsx`：用 `ThemeProvider` 包裹根内容，渲染 `<Hero />` 组件，并在其后追加 `<section id="projects"></section>` 占位
- [x] 4.3 删除 `src/App.css` 文件（样式已全部迁移到 Tailwind 类名）
- [x] 4.4 手动验证端到端行为：首屏显示 Hero，CTA 点击平滑滚动到 `#projects` 占位区，主题在 `<html>` class 切换时 Hero 背景与文本颜色即时变化，刷新后主题持久化，首屏无 FOUC

**Phase 4 检查点**：暂停，总结变更，等待用户确认后视为本变更完成。
