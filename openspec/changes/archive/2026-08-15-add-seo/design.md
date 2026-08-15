## Context

当前 `index.html` 仅有 `<title>my-website</title>` 与 `<html lang="en">`，无 meta description、无 OG tags、无 robots.txt。Navigation 组件链接容器为 `<div>`，语义上应为 `<ul>/<li>`。Hero/Projects/About 组件语义化已正确（`<section>`/`<article>`/`<h1>`-`<h3>`）。技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS v4，部署 GitHub Pages base path `/my-website/`。

## Goals / Non-Goals

**Goals:**
- 在 `index.html` 静态写入 meta tags + OG tags（无需运行时注入）
- 创建 `public/robots.txt` 允许爬虫索引
- 修复 Navigation 链接容器为 `<ul>/<li>` 语义化列表
- 保持视觉样式不变（`<ul>/<li>` 用 Tailwind 类名复刻原 `<div>` 布局）

**Non-Goals:**
- 不引入 `react-helmet` 或运行时 meta 注入（静态 HTML 足够，避免运行时开销）
- 不做 sitemap.xml、canonical、Twitter Card、JSON-LD（已在 proposal out-of-scope）
- 不做 SEO 内容策略与关键词研究
- 不修改 Hero/Projects/About 组件（审查后确认语义已正确）

## Decisions

### Decision 1: meta tags 静态写入 index.html

所有 meta tags 直接写在 `index.html` 的 `<head>` 中，不通过 React 运行时注入。

**备选否决**：`react-helmet-async` 动态注入——站点是单页静态站（无路由），所有页面 meta 相同，静态写入更简单、更可靠（搜索引擎爬虫不执行 JS 时仍可读取）、零运行时开销。

### Decision 2: 文档语言改为 zh-CN

`<html lang="en">` → `<html lang="zh-CN">`。

**关键点**：站点内容为简体中文，`zh-CN` 是 BCP 47 标准语言标签，搜索引擎与读屏器据此选择语言引擎。

**备选否决**：`lang="zh"`——`zh-CN` 更精确（区分简体/繁体），是 GitHub Pages 中文站点的惯例。

### Decision 3: OG tags 完整集合

```
og:title       = 站点标题（与 <title> 一致）
og:description = 站点描述（与 meta description 一致）
og:type        = website
og:url         = https://<username>.github.io/my-website/
og:image       = <base path>/og-image.svg
og:locale      = zh_CN
```

**关键点**：
- `og:url` 用完整 GitHub Pages URL（非相对路径）
- `og:image` 用 `${base path}/og-image.svg`，放 `public/og-image.svg`，SVG 体积小且矢量清晰
- `og:locale` 用下划线分隔（`zh_CN`），区别于 `<html lang>` 的连字符（`zh-CN`）—— 这是 OG 标准与 BCP 47 的历史差异

**备选否决**：用 PNG og:image——SVG 体积更小（< 5KB），且 GitHub Pages 静态部署无兼容问题；若社交平台不支持 SVG 预览（如微信），后续可换 PNG，但本变更先用 SVG 占位。

### Decision 4: robots.txt 内容

```
User-agent: *
Allow: /
```

**关键点**：最简策略，允许所有爬虫索引全站。不含 `Disallow: /`，不屏蔽任何路径。

**备选否决**：
- 添加 `Sitemap: https://.../sitemap.xml`——sitemap 在 out-of-scope，本变更不引用
- 屏蔽 `/assets/` 等构建资源——无意义，爬虫需要索引 CSS/JS 来理解页面

### Decision 5: OG image 占位图

创建 `public/og-image.svg`（1200x630，OG 标准尺寸），内容为站点标题 + 渐变背景，与 Hero 渐变色板对齐。

**关键点**：OG 标准推荐 1200x630px，这是 Facebook/Twitter/LinkedIn 卡片预览的最佳尺寸。

### Decision 6: Navigation 链接容器 `<div>` → `<ul>/<li>`

原结构：
```html
<div class="flex items-center gap-4 ...">
  <a>首页</a>
  <a>项目</a>
  <a>联系我</a>
</div>
```

新结构：
```html
<ul class="flex items-center gap-4 list-none ...">
  <li><a>首页</a></li>
  <li><a>项目</a></li>
  <li><a>联系我</a></li>
</ul>
```

**关键点**：
- `<ul>` 加 `list-none`（Tailwind `list-none`）移除默认列表样式
- `<li>` 不需要额外类（默认无样式干扰）
- 视觉布局完全不变（`flex` + `gap-4` 仍在 `<ul>` 上）
- 读屏器会宣布"列表，3 项"，提升可访问性

**备选否决**：保留 `<div>` 但加 `role="list"`——原生 `<ul>` 语义更强，无需 ARIA 补丁。

## Risks / Trade-offs

- **[OG image SVG 兼容性]** → 部分社交平台（如微信）可能不支持 SVG 预览，降级为纯文本卡片；后续若需兼容可换 PNG/WebP，但本变更先用 SVG 占位
- **[meta description 文案待定]** → 占位文本"个人品牌站"过于简短，apply 时需提供具体描述（50-160 字符）；若不提供，搜索引擎会自动从页面内容提取摘要（降级可接受）
- **[OG url 域名待定]** → 用占位 `https://username.github.io/my-website/`，apply 时需替换为真实 GitHub 用户名；若不替换，社交平台抓取的 URL 会失效
- **[语义化修改影响 Navigation spec]** → 已通过 MODIFIED delta 处理，归档时 sync 到主 spec
