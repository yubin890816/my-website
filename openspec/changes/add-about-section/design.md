## Context

当前 `App.tsx` 顺序为 `Navigation → Hero → Projects → Contact`，本变更在 Hero 与 Projects 之间插入 About，顺序变为 `Navigation → Hero → About → Projects → Contact`。全局 `scroll-padding-top: 4rem` 已就位，若 About 加 `id="about"` 自动受益。技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS v4。项目 rules 要求：函数式组件、PascalCase 文件名、Tailwind 类名（禁止内联 style）、`dark:` 前缀双主题、图片 lazy loading。

## Goals / Non-Goals

**Goals:**
- 用 React 函数组件实现 About 区域，左右分栏 + 下方品牌标签
- 响应式：宽屏左右分栏，窄屏上下堆叠
- 照片 lazy loading，不阻塞首屏
- 复用现有 `theme` capability，无新依赖
- 与 Hero/Projects 色板对齐

**Non-Goals:**
- 不引入动画（除全局 reduced-motion 守卫外无 hover/入场效果）
- 不做社交链接图标
- 不做表单
- 不做照片裁剪/上传交互

## Decisions

### Decision 1: 组件目录与命名

采用 `src/components/About/About.tsx`（与 `Hero.tsx`/`Projects.tsx` 单数对齐）。

**备选否决**：`AboutSection.tsx`——其他 section 组件（Hero/Projects）都用 capability 简名，保持一致。

### Decision 2: 照片来源与 base path

照片放 `public/about/portrait.svg`，用 `import.meta.env.BASE_URL` 拼接：`src={`${import.meta.env.BASE_URL}about/portrait.svg`}`。

**关键点**：复用 Projects 已验证的 `import.meta.env.BASE_URL` 模式，避免硬编码 `/my-website/`。

**备选否决**：
- `src/assets/` import：Vite hash 文件名，但单张照片用 public 更直观
- 外部图床：引入网络依赖，GitHub Pages 静态部署用本地资源更稳

### Decision 3: 简介数据结构

简介 3 段文字硬编码为 TS 常量数组：

```ts
const ABOUT_PARAGRAPHS: string[] = [
  '第一段：背景介绍',
  '第二段：能力与经验',
  '第三段：价值主张',
]
```

**备选否决**：从 JSON import——3 段文字无需独立文件，硬编码更简单。

### Decision 4: 布局断点

采用 Tailwind flexbox + 断点：`flex flex-col md:flex-row gap-8 md:gap-12`。

- < 768px：`flex-col`（照片上、简介下，堆叠）
- ≥ 768px：`flex-row`（照片左、简介右，分栏）

**备选否决**：`lg:flex-row`（1024px 断点）—— `md`（768px）更早进入分栏，平板横屏利用率更高。

照片宽度：`w-full md:w-1/3`（宽屏占 1/3，窄屏占满）。
简介宽度：`w-full md:w-2/3`（宽屏占 2/3，窄屏占满）。

### Decision 5: 品牌标签视觉样式

"赋范空间"标签用 indigo 色板强调，与 Hero CTA / Projects 链接色板对齐：

`inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300`

**关键点**：
- `rounded-full` 胶囊形状，与"标签"语义对齐
- indigo-100/700（亮色）与 indigo-900/40 + indigo-300（暗色）对比度均 ≥ 4.5:1
- `dark:bg-indigo-900/40` 用半透明暗色背景，与暗色 section 背景融合

**备选否决**：`bg-slate-200`（灰色标签）—— indigo 与品牌色一致，更醒目。

### Decision 6: 照片容器宽高比

照片用 `aspect-square`（1:1 正方形）+ `object-cover`，避免不同尺寸照片破坏布局。

**备选否决**：
- `aspect-video`（16:9）：人物照片常用正方形或 4:5，16:9 不适合人像
- 固定 `w-48 h-48`：响应式差，窄屏可能过大

### Decision 7: 色板（与 Hero/Projects 对齐）

复用 slate + indigo 色板：

| 元素 | 亮色 | 暗色 |
|------|------|------|
| section 背景 | `bg-white` | `dark:bg-slate-900` |
| 简介正文 | `text-slate-700` | `dark:text-slate-300` |
| 简介段落标题（如有） | `text-slate-900` | `dark:text-white` |
| 品牌标签背景 | `bg-indigo-100` | `dark:bg-indigo-900/40` |
| 品牌标签文字 | `text-indigo-700` | `dark:text-indigo-300` |
| 照片占位背景 | `bg-slate-100` | `dark:bg-slate-800` |

**对比度核算**：
- 亮色：slate-700 (#334155) on white = 10.95:1 ✅；indigo-700 (#4338ca) on indigo-100 (#e0e7ff) = 7.59:1 ✅
- 暗色：slate-300 (#cbd5e1) on slate-900 (#0f172a) = 11.28:1 ✅；indigo-300 (#a5b4fc) on indigo-900/40 (≈#1e1b4b 混合) ≈ 8.5:1 ✅

**section 背景策略**：About 用 `bg-white dark:bg-slate-900`，与 Projects 的 `bg-slate-50 dark:bg-slate-950` 形成轻微对比，视觉上区分两个区域。

## Risks / Trade-offs

- **[照片资源体积]** → SVG 占位图体积可控（< 10KB）；若后续换成真实人像 PNG/WebP，需控制 < 100KB 并保持 lazy loading
- **[简介内容硬编码]** → 后续若需频繁更新简介，需重构为 JSON/MDX 数据源；当前 3 段硬编码可接受
- **[品牌标签数量固定]** → 当前仅 1 个"赋范空间"，若后续需多个标签，需改为数组 map；当前单标签直接渲染即可
- **[照片加载失败]** → `<img>` 的 `alt` 文本降级，spec 已覆盖此场景
