## Context

当前项目为 Vite 默认模板，`src/App.tsx` 是 counter + 文档示例，`src/index.css` 仅定义了浅色主题变量，无 dark 模式基础设施，`vite.config.ts` 未配置 `base`。Tailwind v4 通过 `@import "tailwindcss"` 引入，暗色模式默认跟随 `prefers-color-scheme`，需手动切换为 class 策略。详见 proposal.md 的 Why 与 What Changes 部分。

## Goals / Non-Goals

**Goals:**

- 用最小代码量完成 Hero 与主题基础设施，不引入任何第三方依赖
- 主题方案符合 Tailwind v4 官方推荐的手动暗色模式实践
- 主题初始化早于 React 渲染，彻底消除 FOUC
- Hero 的视觉层级与可访问性（H1 唯一、对比度 AA）通过结构化 HTML + Tailwind 工具类实现，不依赖 JS

**Non-Goals:**

- 不实现主题切换按钮的 UI（仅建基础设施）
- 不为渐变色板做设计 token 抽象（颜色直接写在 Tailwind 类名中，后续变更再统一）
- 不处理 SSR 场景（GitHub Pages 是纯静态）
- 不做性能基准测试（首屏 < 2s 由"无动画、无第三方库"自然保证）

## Decisions

### Decision 1: 主题策略采用 Tailwind v4 的 `@custom-variant dark` + class 选择器

**选择**：在 `src/index.css` 顶部添加：

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

并通过在 `<html>` 上增删 `dark` class 实现切换。

**理由**：
- Tailwind v4 默认 dark variant 跟随 `prefers-color-scheme`，无法满足"手动切换 + 持久化"需求
- `@custom-variant dark (&:where(.dark, .dark *))` 是官方文档明确推荐的手动暗色模式写法，`:where()` 保持 0 特异性，不污染用户样式
- 不需要 `tailwind.config.js`（v4 已移除该文件），CSS-first 配置更轻

**备选方案**：
- ❌ 用 `@media (prefers-color-scheme: dark)`：无法手动覆盖，与持久化需求冲突
- ❌ 引入 `next-themes` 等第三方库：超出"无新增依赖"目标，且本站非 Next.js
- ❌ 自定义 data 属性 `data-theme="dark"`：需要重写所有 dark variant，不如官方写法省事

### Decision 2: 主题状态用 React Context + `useTheme` hook 暴露

**选择**：`ThemeProvider` 内部用 `useState<'light' | 'dark'>` 管理主题，通过 `useEffect` 同步到 `<html>` class 与 `localStorage`；通过 Context 暴露 `{ theme, toggleTheme }`。

**理由**：
- React 19 的 Context 已足够轻量，无需 Zustand 等外部状态库
- 单一 source of truth（Context state），DOM class 与 localStorage 都是它的副作用，避免状态不一致
- `toggleTheme` 而非 `setTheme`：两态模型只需切换语义，简化消费方 API

**备选方案**：
- ❌ 直接操作 DOM 不走 React state：无法触发重渲染，子组件无法响应主题变化
- ❌ 引入 Zustand：单一全局状态用 Context 足够，不必新增依赖

### Decision 3: FOUC 修复用 `index.html` inline script

**选择**：在 `index.html` 的 `<head>` 中、所有 CSS 之前注入同步 inline script：

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
</script>
```

**理由**：
- 必须在 React 渲染前完成 class 注入，inline script 是最早可执行时机
- `try/catch` 包裹 `localStorage` 访问，兼容隐私模式
- 不读取 `prefers-color-scheme`：本变更主题是两态模型，默认 light，不跟随系统（见 spec: theme - 两态主题模型）
- 脚本极小（< 200 字节），不影响首屏性能

**备选方案**：
- ❌ 把脚本放到外部 `.js` 文件：会引入网络请求延迟，错过最佳注入时机
- ❌ 在 React `useEffect` 中设 class：太晚，首屏已渲染完成，必然闪烁

### Decision 4: Hero 用 `<section>` + 语义化标签，样式全部走 Tailwind 类名

**选择**：Hero 组件结构：

```tsx
<section className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-... to-... dark:from-... dark:to-...">
  <div className="relative z-10 flex flex-col items-center px-4 text-center">
    <h1 className="...">{name}</h1>
    <p className="...">{profession}</p>
    <p className="...">{tagline}</p>
    <a href="#projects" className="...">查看我的项目</a>
  </div>
</section>
```

**理由**：
- `min-h-dvh` 而非 `h-screen`：iOS Safari 地址栏伸缩时 `dvh` 跟随变化，避免空白（spec: hero - 全屏高度展示）
- 用 `min-h-dvh` 而非 `h-dvh`：内容超长时允许向下溢出而非裁切
- 背景渐变直接放在 `<section>` 上，省一层 DOM
- 内容层 `relative z-10` 确保在背景之上（即使背景将来扩展为多层）
- CTA 用 `<a href="#projects">` 而非 `<button onClick>`：天然支持中键新标签打开、右键复制链接，可访问性更好

**备选方案**：
- ❌ 用 `<div>` + `role="banner"`：不如直接用 `<section>` + `aria-label` 语义化
- ❌ CTA 用 `<button>` + `scrollIntoView`：丢失锚点原生行为，且需要手动处理 reduced-motion

### Decision 5: 平滑滚动用全局 CSS，不写 JS

**选择**：在 `index.css` 加：

```css
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

**理由**：
- 用 `@media (prefers-reduced-motion: no-preference)` 包裹，自动满足 spec: hero - CTA 按钮锚点跳转 中"启用减少动效时不平滑滚动"的要求
- 0 行 JS，浏览器原生支持，性能最佳
- 对所有锚点跳转生效，后续区块也能复用

**备选方案**：
- ❌ 用 JS `scrollIntoView({ behavior: 'smooth' })`：需要手动判断 reduced-motion，且 CTA 是 `<a>` 标签天然走浏览器行为，多此一举

### Decision 6: Vite `base` 配置为 `/my-website/`

**选择**：`vite.config.ts` 增加 `base: '/my-website/'`。

**理由**：
- GitHub Pages 项目站点 URL 为 `https://<user>.github.io/my-website/`，所有静态资源需带 `/my-website/` 前缀
- 锚点 `#projects` 是 fragment，不受 `base` 影响

**副作用与缓解**：
- 本地 `vite dev` 访问路径变为 `http://localhost:5173/my-website/`，与默认 `/` 不同
- 不做缓解：这是 GitHub Pages 部署的固有约束，提前对齐可避免部署后才发现资源 404

### Decision 7: 文案硬编码在 Hero 组件内

**选择**：名字、职业、一句话介绍直接作为字符串字面量写在 `Hero.tsx` 中，或作为组件 props 的默认值。

**理由**：
- 本变更 out-of-scope 明确不做 i18n
- 单一使用点，无需抽 config 文件
- 后续如需改文案，直接改组件即可

## Risks / Trade-offs

- **[Risk] 暗色模式色板对比度不达标** → 在 apply 阶段用浏览器 DevTools 的对比度检查器验证；若不达标，调整色板而非改结构
- **[Risk] `min-h-dvh` 在旧浏览器不支持** → 目标浏览器（Chrome/Edge/Safari/Firefox 最新两个稳定版本）均已支持 `dvh`；不做 polyfill
- **[Risk] inline script 在 CSP 严格策略下被拦截** → GitHub Pages 默认无 CSP 限制；若后续加 CSP，需改用 nonce 或 hash
- **[Trade-off] `localStorage` 主题不跨域名** → GitHub Pages 同 `github.io` 域下不同项目之间不共享主题，符合预期（不同项目是不同站点）
- **[Trade-off] 文案硬编码** → 牺牲灵活性换最小实现，符合 out-of-scope 的 i18n 约束
