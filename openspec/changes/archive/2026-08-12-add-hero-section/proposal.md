## Why

个人品牌站目前仍停留在 Vite 默认模板（counter + 文档示例），没有任何品牌内容，也没有可用的首屏体验。需要补齐 Hero Section 作为访客落地后的第一屏，承担"自我介绍 + 引导访客查看项目"的核心职责，同时完成亮/暗双主题切换的基础设施，为后续所有区块奠定视觉与主题基线。

## What Changes

- 新增 Hero 区块：全屏高度（`h-dvh`），居中显示名字、职业、一句话介绍，并提供一个 CTA 按钮"查看我的项目"
- Hero 背景：静态科技感渐变（纯 CSS 渐变，无动画、无粒子）
- 新增主题切换基础设施：两态（light/dark）主题模型，含 `ThemeProvider`、`useTheme` 钩子、`localStorage` 持久化、`<html>` class 注入；并修复首屏 FOUC（在 `index.html` 注入 inline script 预设主题 class）
- CTA 锚点跳转：本次变更一并占位一个空的 `<section id="projects">` 作为锚点目标，避免 CTA 跳空；该占位区不在本变更范围内填充内容
- 配置 Vite `base: '/my-website/'` 以对齐 GitHub Pages 部署路径
- Tailwind v4 启用手动暗色模式：在 `index.css` 增加 `@custom-variant dark`，并补齐暗色主题色板
- 清理 Vite 默认模板内容（counter、文档示例、`App.css` 中的默认样式、无用的 logo 资源引用），由 Hero 区块替换首屏

## Capabilities

### New Capabilities

- `hero`: 全屏 Hero 区块，含品牌信息展示（名字/职业/一句话介绍）、CTA 按钮（锚点跳转到 `#projects`）、静态科技感渐变背景，并支持亮/暗双主题。
- `theme`: 主题切换基础设施，两态（light/dark）模型，含状态管理、持久化、`<html>` class 注入、首屏 FOUC 修复。

### Modified Capabilities

无。当前 `openspec/specs/` 为空，本次变更为项目首个变更，所有 capability 全部新建。

## Impact

- **代码影响**：
  - 改写 `src/App.tsx`：移除 Vite 默认模板内容，挂载 `ThemeProvider` 与 `Hero` 组件，新增 `<section id="projects">` 占位
  - 改写 `src/index.css`：增加 `@custom-variant dark`、补齐暗色主题色板、全局滚动行为
  - 改写 `src/main.tsx`：无需改动（仍渲染 `<App />`）
  - 改写 `index.html`：在 `<head>` 注入主题预设 inline script
  - 改写 `vite.config.ts`：增加 `base: '/my-website/'`
  - 删除 `src/App.css`（样式迁移到 Tailwind 类名）
  - 删除 `src/assets/react.svg`、`src/assets/vite.svg`、`src/assets/hero.png` 的引用（资源本身是否删除留待 apply 阶段决定，不影响功能）
- **依赖影响**：无新增第三方依赖（纯 Tailwind + 原生 React）
- **部署影响**：`base` 修改后，本地 `vite dev` 与 `vite preview` 的资源路径会带 `/my-website/` 前缀，需注意开发体验
- **现有功能影响**：Vite 默认模板的 counter、文档链接将被移除，属于**破坏性变更**，但因项目尚未正式上线，影响可忽略
- **性能影响**：Hero 为纯静态渲染，无动画、无 Canvas，首屏加载目标（< 2 秒）不受影响
- **可访问性影响**：Hero 的 H1 将成为站内唯一 H1；后续区块需避免重复使用 H1

## Out-of-Scope

以下内容**严禁在本变更中实现**：

- **不做动画效果**：Hero 背景为静态渐变，不实现渐变位移动画、粒子动画、入场动画、滚动触发动画等任何动画效果
- **不做导航栏**：不实现顶部导航、侧边导航、移动端汉堡菜单等任何导航相关组件
- **不做后端 API**：不实现任何接口、数据获取、表单提交等后端或网络相关功能
- **不填充项目区内容**：本次仅占位空的 `<section id="projects">`，不实现项目卡片、项目列表、项目详情等内容
- **不做主题切换 UI**：本次只建主题基础设施（Provider/hooks/持久化/FOUC 修复），不实现主题切换按钮或开关 UI
- **不做响应式断点细调**：仅保证移动端可读，不做针对平板/大屏的精细布局优化
- **不做 SEO/meta 优化**：不修改 `index.html` 的 title、description、og 标签等
- **不做 i18n**：文案为硬编码中文，不做国际化抽象
