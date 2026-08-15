## Phase 1: meta tags 与 OG image

- [x] 1.1 修改 `index.html`：`<html lang="en">` → `<html lang="zh-CN">`，`<title>my-website</title>` → `<title>你的名字 | 个人品牌站</title>`（占位，apply 时可改）
- [x] 1.2 在 `index.html` `<head>` 添加 `<meta name="description" content="...">`（占位描述文本，50-160 字符）
- [x] 1.3 在 `index.html` `<head>` 添加 OG tags：`og:title`/`og:description`/`og:type=website`/`og:url`（占位 `https://username.github.io/my-website/`）/`og:image`（指向 `/my-website/og-image.svg`）/`og:locale=zh_CN`
- [x] 1.4 创建 `public/og-image.svg`：1200x630px，渐变背景 + 站点标题文本，与 Hero 渐变色板对齐（slate + indigo），单图 < 10KB

## Phase 2: robots.txt 与 Navigation 语义化

- [x] 2.1 创建 `public/robots.txt`：内容为 `User-agent: *` + `Allow: /`，允许所有爬虫索引全站
- [x] 2.2 修改 `src/components/Navigation/Navigation.tsx`：链接容器 `<div class="flex items-center gap-4 ...">` → `<ul class="flex items-center gap-4 list-none ...">`，每个链接用 `<li>` 包裹
- [x] 2.3 类型检查：`npx tsc -b --noEmit` 通过
- [x] 2.4 浏览器验证：Navigation 视觉布局不变（flex + gap-4 仍生效），DOM 结构变为 `<ul>/<li>`

## Phase 3: 语义化审查与端到端验证

- [x] 3.1 语义化审查：检查 Hero/Projects/About 组件的 `<section>`/`<article>`/`<h1>`-`<h3>` 是否正确，记录审查结果（若无需修改则跳过修复）
- [x] 3.2 浏览器端到端验证：`<html lang="zh-CN">` 生效、`<title>` 与 meta description 在 DOM 中可查、OG tags 全部存在、`/my-website/robots.txt` 可访问（HTTP 200）、`/my-website/og-image.svg` 可访问（HTTP 200）
- [x] 3.3 构建验证：`npm run build` 通过，`dist/robots.txt` 与 `dist/og-image.svg` 存在，`dist/index.html` 含所有 meta 与 OG tags
