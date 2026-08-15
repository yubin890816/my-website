## Why

当前站点 `index.html` 仅有 `<title>my-website</title>`，无 meta description、无 Open Graph tags、无 robots.txt，搜索引擎与社交平台分享时无法展示有效信息。同时 `<html lang="en">` 与站点实际语言（中文）不符，影响搜索引擎与读屏器正确识别。需要补齐 SEO 基础设施并审查语义化 HTML。

## What Changes

- **index.html meta tags**：设置 `<title>`、`<meta name="description">`、`<html lang="zh-CN">`
- **Open Graph tags**：添加 `og:title`、`og:description`、`og:type`、`og:url`、`og:image`、`og:locale` 等社交分享元数据
- **robots.txt**：在 `public/robots.txt` 添加，允许 Google 爬虫索引全站
- **语义化 HTML 审查 + 修复**：审查现有 Hero/Navigation/Projects/About 组件的 HTML 语义，修复发现的问题

## Out of Scope

- **不做站点地图（sitemap.xml）**：本变更仅做 robots.txt，sitemap 属独立工作
- **不做 Twitter Card tags**：用户已确认本次仅做 Open Graph，Twitter Card 属另一变更
- **不做 canonical URL**：本次不添加 `<link rel="canonical">`
- **不做 JSON-LD 结构化数据**：本次不添加 Schema.org 结构化数据
- **不做性能优化**：meta tags 不影响性能，本变更不含性能相关改动
- **不做 SEO 内容策略**：meta description 文案由用户提供或用占位，不做关键词研究

## Capabilities

### New Capabilities

- `seo`: 站点 SEO 基础设施——meta tags、Open Graph 社交分享元数据、robots.txt

### Modified Capabilities

- `navigation`: 语义化修复——导航链接容器从 `<div>` 改为 `<ul>/<li>` 语义化列表（spec-level 行为不变，仅 DOM 结构语义化）

## Impact

### 对现有功能的影响评估

- **index.html**：修改 `<title>`、`<html lang>`，添加多个 `<meta>` 标签。不影响现有 inline script（主题 FOUC 修复）与 `<div id="root">`。
- **Navigation 组件**：链接容器从 `<div>` 改为 `<ul>/<li>`，视觉样式不变（Tailwind 类名调整保持原布局），不影响导航功能与锚点跳转。
- **Hero/Projects/About 组件**：审查后若无语义问题不改动；Hero 的 `<section>` + `<h1>` 已正确，Projects 的 `<section>` + `<article>` + `<h2>/<h3>` 已正确。
- **构建产物**：`public/robots.txt` 会被 Vite 复制到 `dist/robots.txt`，部署到 GitHub Pages 后 `https://username.github.io/my-website/robots.txt` 可访问。
- **主题切换**：本变更不涉及主题，无影响。
- **首屏性能**：meta tags 是静态 HTML，不阻塞渲染；robots.txt 体积 < 1KB，无影响。

### 受影响代码

- `index.html`：修改 `<title>`、`<html lang>`，添加 meta + OG tags
- `public/robots.txt`：新建
- `src/components/Navigation/Navigation.tsx`：链接容器 `<div>` → `<ul>/<li>`
- `openspec/specs/navigation/spec.md`：MODIFIED 导航链接集合 requirement（语义化列表）
