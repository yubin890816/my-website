## Why

当前站点 `<section id="projects">` 为空占位，访客点击 Hero CTA 或导航栏"项目"后看到空白，无法了解作者的作品。需要填充项目展示区，让访客落地后能快速浏览作者的代表性项目。

## What Changes

- 新增项目展示区组件，渲染在 Hero 区块下方（取代当前空占位 `<section id="projects">`）
- 卡片式布局展示项目，每张卡片包含：项目截图、项目名称、项目简介、GitHub 链接
- 最少展示 4 个项目
- 卡片支持鼠标 hover 微特效（轻量 transform/filter 过渡，遵循 `prefers-reduced-motion`）
- 所有项目截图使用 lazy loading（落实 project_rules.md 代码标准）
- 适配亮/暗双主题
- **移除** hero spec 的"项目区占位锚点" requirement（占位契约被实际内容取代）

## Out of Scope

- **不做项目详情页**：卡片仅展示摘要信息，点击 GitHub 链接跳外站，不在本站内渲染详情
- **不做项目搜索/筛选**：所有项目平铺展示，无搜索框、无分类筛选、无排序
- **不做项目数据管理后台**：项目列表硬编码在前端，不接 API、不接 CMS

## Capabilities

### New Capabilities

- `projects`: 项目展示区——卡片式布局展示项目集合，每张卡片含截图/名称/简介/GitHub 链接，支持 hover 微特效

### Modified Capabilities

- `hero`: 移除"项目区占位锚点" requirement（原占位契约被实际内容取代）。Hero CTA 的 `href="#projects"` 不变，但锚点目标从"空占位"变为"有内容的项目区"

## Impact

### 对现有功能的影响评估

- **Hero CTA 按钮锚点跳转**：`href="#projects"` 无需修改。锚点目标从"空占位（0 高度）"变为"有内容的项目区（非零高度）"，原 hero spec 中"锚点目标存在但无可滚动空间"场景将不再触发（因为 `#projects` 现在有内容、body 高度将大于视口高度）。CTA 点击后会真实滚动到项目区顶部。
- **Navigation 导航链接**：导航栏"项目"链接 `href="#projects"` 无需修改，行为自动正确（滚动到有内容的项目区）。
- **全局 `scroll-padding-top`**：已有 `4rem` 偏移让锚点跳转后目标不被固定导航栏遮挡，本项目区复用此机制，无需额外改动。
- **主题切换**：项目区卡片复用 `theme` capability 的 `dark:` class 机制，无需改动主题基础设施。
- **首屏性能**：项目区在 Hero 下方，不在首屏视口内，且所有图片用 lazy loading，不影响首屏 < 2s 目标。

### 受影响代码

- `src/App.tsx`：移除空 `<section id="projects"></section>`，挂载 `<Projects />` 组件
- `src/components/Projects/`：新建目录（新组件）
- `openspec/specs/hero/spec.md`：移除"项目区占位锚点" requirement（归档时 sync）
