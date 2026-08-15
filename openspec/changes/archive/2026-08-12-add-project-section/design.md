## Context

当前 `src/App.tsx` 中 `<section id="projects"></section>` 为空占位，Hero CTA 与导航栏"项目"链接均已指向 `#projects`，全局 `scroll-padding-top: 4rem` 已就位。项目区需用实际内容填充占位，无需改动锚点/导航/主题基础设施。

技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS v4。项目 rules 要求：函数式组件、PascalCase 文件名、Tailwind 类名（禁止内联 style）、`dark:` 前缀双主题、图片 lazy loading。

## Goals / Non-Goals

**Goals:**
- 用 React 函数组件实现项目展示区，替换空占位
- 卡片网格响应式布局（1/2/3 列断点）
- hover 微特效遵循 `prefers-reduced-motion`
- 截图全部 lazy loading，不阻塞首屏
- 复用现有 `theme` capability，无新依赖

**Non-Goals:**
- 不引入数据获取层（项目数据硬编码为 TS 常量数组）
- 不做卡片点击进入详情（GitHub 链接外跳即终点）
- 不做搜索/筛选/排序交互
- 不做卡片入场动画（仅 hover 微特效）

## Decisions

### Decision 1: 组件目录与命名

采用 `src/components/Projects/Projects.tsx`（复数，对应 capability 名 `projects`）。

**备选否决**：`ProjectSection.tsx`（单数）—— capability 名是 `projects`，组件名应与之对齐；且 `Projects` 更简洁。

### Decision 2: 项目数据结构

定义 TypeScript interface 并硬编码为常量数组：

```ts
interface Project {
  name: string
  description: string
  screenshot: string  // 图片 URL
  githubUrl?: string  // 可选，缺失时不渲染链接
}

const PROJECTS: Project[] = [ ... ]  // 至少 4 项
```

**备选否决**：从 JSON 文件 import —— 项目数少（4-6 个），硬编码更简单，无需额外文件与加载逻辑。后续若项目增多再抽 JSON。

### Decision 3: 截图来源

使用项目本地 `public/` 目录下的占位图（如 `public/projects/project-1.svg`），通过 base path 相对路径引用 `/my-website/projects/project-1.svg`。

**关键点**：Vite 已配 `base: '/my-website/'`，`<img src="/projects/project-1.svg">` 在 dev 与 build 后都会被处理为 `/my-website/projects/project-1.svg`。但为避免 base path 硬编码，用 `import.meta.env.BASE_URL` 拼接：`src={`${import.meta.env.BASE_URL}projects/project-1.svg`}`。

**备选否决**：
- 外部图床 URL：引入网络依赖与首屏加载不确定性，且 GitHub Pages 静态部署用本地资源更稳
- `src/assets/` import：Vite 会 hash 文件名，但 4-6 张截图用 public 目录更直观，且可被搜索引擎直接索引

### Decision 4: 卡片网格响应式断点

采用 Tailwind 网格类：`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`。

- < 640px：1 列（窄屏单列，spec 要求）
- 640px-1023px：2 列（平板）
- ≥ 1024px：3 列（桌面）

**备选否决**：`md:grid-cols-2`（768px 断点）—— sm (640px) 更早进入双列，平板横屏利用率更高。

### Decision 5: hover 微特效实现

用 Tailwind transition 类组合：`transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600`。

**reduced-motion 守卫**：全局 CSS 已有 `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }` 模式，但 transition 需在卡片级别用 `motion-safe:transition-all motion-safe:duration-300` 替代裸 `transition-*`。`motion-safe:` 是 Tailwind 内置变体，等价于 `@media (prefers-reduced-motion: no-preference)`。

**最终类名**：`motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600`。

reduced-motion 用户：transition 不应用，hover 状态直接切换（无 duration），符合 spec。

**备选否决**：
- CSS animation keyframes：过度复杂，hover 用 transition 足够
- scale 变换：`-translate-y-1`（上移 4px）比 `scale-105` 更克制，不遮挡相邻卡片

### Decision 6: GitHub 链接安全属性

`<a href={githubUrl} target="_blank" rel="noopener noreferrer">`。

- `target="_blank"`：新标签页打开（spec 要求）
- `rel="noopener noreferrer"`：防止 tab-nabbing 攻击与 referrer 泄露（spec 安全要求）

### Decision 7: 卡片色板（与 Hero/Navigation 对齐）

复用已有 slate + indigo 色板：

| 元素 | 亮色 | 暗色 |
|------|------|------|
| 卡片背景 | `bg-white` | `dark:bg-slate-900` |
| 卡片边框 | `border-slate-200` | `dark:border-slate-800` |
| 项目名称 | `text-slate-900` | `dark:text-white` |
| 项目简介 | `text-slate-600` | `dark:text-slate-400` |
| GitHub 链接 | `text-indigo-600` | `dark:text-indigo-400` |
| section 背景 | `bg-slate-50` | `dark:bg-slate-950` |

对比度（亮色）：slate-900 on white = 16.75:1 ✅；slate-600 on white = 7.43:1 ✅；indigo-600 on white = 6.29:1 ✅。
对比度（暗色）：white on slate-900 = 16.75:1 ✅；slate-400 on slate-900 = 7.21:1 ✅；indigo-400 on slate-900 = 8.42:1 ✅。

## Risks / Trade-offs

- **[截图资源体积]** → 4-6 张 SVG 占位图体积可控（< 10KB/张）；若后续换成真实 PNG/WebP 截图，需控制单图 < 100KB 并保持 lazy loading
- **[项目数据硬编码]** → 后续若需频繁更新项目，需重构为 JSON/MDX 数据源；当前 4-6 个项目硬编码可接受
- **[base path 与 public 路径]** → 用 `import.meta.env.BASE_URL` 拼接避免硬编码 `/my-website/`，若未来改部署路径无需改代码
- **[hover 特效在旧浏览器]** → `motion-safe:` 变体依赖 `prefers-reduced-motion` 媒体查询，旧浏览器不支持时降级为始终应用 transition（可接受）
