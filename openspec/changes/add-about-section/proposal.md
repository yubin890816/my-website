## Why

当前站点缺少作者自我介绍区域，访客落地后只见 Hero 标语与项目卡片，无法了解作者背景与价值主张。需要在 Hero 与 Projects 之间插入"关于我"区域，让访客在浏览作品前先建立对作者的认知。

## What Changes

- 新增"关于我"区域组件，渲染在 Hero 区块之后、Projects 区块之前
- 左侧：一张作者照片（lazy loading，复用 project_rules.md 代码标准）
- 右侧：个人简介（3 段文字）
- 下方：品牌标签"赋范空间"（作为视觉化的关键词标签呈现）
- 适配亮/暗双主题
- 响应式布局：宽屏左右分栏，窄屏上下堆叠

## Out of Scope

- **不做联系表单**：本变更不含任何表单元素（input/textarea/submit）
- **不做社交链接图标**：照片与简介下方仅品牌标签，不放 GitHub/Twitter 等社交图标
- **不做照片裁剪/上传交互**：照片为静态资源，无用户交互
- **不做简介内容管理**：简介文字硬编码在前端，不接 CMS/API
- **不做动画效果**：除已有的全局 reduced-motion 守卫外，本区域无入场/hover 动画

## Capabilities

### New Capabilities

- `about`: 关于我区域——左侧照片 + 右侧 3 段简介 + 下方品牌标签"赋范空间"

### Modified Capabilities

（无）— 本变更新增独立 capability，不修改现有 hero/navigation/projects/theme 的 spec-level 行为。

## Impact

### 对现有功能的影响评估

- **页面顺序**：现有 `App.tsx` 顺序为 `Navigation → Hero → Projects → Contact`，本变更在 Hero 与 Projects 之间插入 About，顺序变为 `Navigation → Hero → About → Projects → Contact`。不影响任何现有锚点（`#home`/`#projects`/`#contact` 仍可达）。
- **导航栏**：导航栏链接集（首页/项目/联系我）不含"关于我"锚点，无需修改 navigation spec。若后续需要在导航栏加入"关于我"链接，属另一变更。
- **Hero CTA**：Hero CTA 指向 `#projects`，About 插入不改变该锚点目标，CTA 行为不变。
- **全局 scroll-padding-top**：已有 `4rem` 偏移，若 About 加 `id="about"` 并被未来导航链接引用，自动受益于该偏移。本变更暂不引用该 id。
- **首屏性能**：About 位于 Hero 下方，不在首屏视口内，照片用 lazy loading，不影响首屏 < 2s 目标。
- **主题切换**：About 复用 `theme` capability 的 `dark:` class 机制，无需改动主题基础设施。

### 受影响代码

- `src/App.tsx`：在 `<Hero />` 与 `<Projects />` 之间插入 `<About />`
- `src/components/About/`：新建目录（新组件）
- `public/about/`：新建目录放作者照片占位图
