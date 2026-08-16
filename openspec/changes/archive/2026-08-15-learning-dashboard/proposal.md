## Why

个人品牌站当前是静态展示型单页，无法承载学习助手的日常交互需求（目标管理、进度追踪、AI 建议反馈）。需要将应用主结构从"品牌展示"重构为"学习 Dashboard"，作为后续接入真实后端与 AI 能力的前端骨架。本期用 mock 数据先把交互骨架与视觉系统跑通。

## What Changes

- **新建**：`DashboardLayout` 三段式布局（左侧 Sidebar + 顶部 Topbar + 主内容区）
- **新建**：`Sidebar` 左侧导航，含 5 个功能入口（总览 / 目标 / 进度 / 建议 / 设置）
- **新建**：`Topbar` 顶部条，含品牌名、当前日期、主题切换按钮（复用 ThemeProvider）
- **新建**：`OverviewPage` 主内容区，集成统计卡片、每日目标清单、AI 建议面板、趋势图四个区块
- **新建**：`StatCard` 可复用统计卡片组件（指标名 / 数值 / 同比变化）
- **新建**：`GoalList` 每日目标清单（含勾选状态切换交互）
- **新建**：`InsightPanel` AI 建议学习面板（静态 mock 文本）
- **新建**：`TrendChart` 周/月学习时长趋势图（mock 数据 + SVG 渲染）
- **新建**：`mock/` 目录，集中存放所有 mock 数据（统计 / 目标 / 建议 / 趋势）
- **修改**：`App.tsx` 挂载点从 `Navigation + Hero + Projects` 切换为 `DashboardLayout`
- **保留不挂载**：原 `Hero` / `Navigation` / `Projects` 组件保留在代码库，本期不删除（供后续 landing page 复用）
- **复用**：`ThemeProvider` / `useTheme` / Tailwind 配置 / `index.html` SEO 资产 / 暗色模式策略

## Capabilities

### New Capabilities

- `learning/dashboard`: Dashboard 整体布局骨架——Sidebar + Topbar + 主内容区的三段式结构、响应式断点、暗色模式适配
- `learning/stats`: 学习数据统计——今日学习时长 / 完成目标数 / 连续打卡天数 / 周排名 4 个核心指标卡片展示
- `learning/goals`: 每日目标清单——目标项的展示、勾选状态切换、完成进度汇总
- `learning/insights`: AI 学习建议面板——建议条目的展示与分类标签

### Modified Capabilities

无（本期不修改任何已有 spec-level 行为，原品牌站 capability 暂未在 openspec/specs/ 中正式定义，且组件保留不删，无 spec 改动）。

## Out of Scope

- **不做后端 API**：所有数据使用前端 mock，不引入 fetch / axios / TanStack Query
- **不做真实 AI 功能**：AI 建议面板展示静态 mock 文本，不接入 LLM
- **不做用户认证**：无登录 / 注册 / 权限控制
- **不引入路由库**：本期 Dashboard 是单页面，不引入 react-router / TanStack Router
- **不做多页面导航**：Sidebar 5 个入口本期仅"总览"页可点击，其余为占位（视觉展示但不可跳转）
- **不删除原品牌站组件**：Hero / Navigation / Projects 保留，但不再挂载到 App
- **不做数据持久化**：勾选状态、统计数据均不写入 localStorage，刷新即重置
- **不做单元测试**：首期聚焦交互骨架与视觉系统
- **不做后端部署调整**：仍部署到 GitHub Pages（静态托管）

## Impact

### 受影响代码

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `src/App.tsx` | 修改 | 挂载点从品牌站组件切换为 `DashboardLayout` |
| `src/layouts/DashboardLayout.tsx` | 新建 | 三段式布局容器 |
| `src/components/dashboard/Sidebar.tsx` | 新建 | 左侧导航 |
| `src/components/dashboard/Topbar.tsx` | 新建 | 顶部条（复用 ThemeProvider） |
| `src/components/dashboard/StatCard.tsx` | 新建 | 统计卡片 |
| `src/components/dashboard/GoalList.tsx` | 新建 | 每日目标清单 |
| `src/components/dashboard/InsightPanel.tsx` | 新建 | AI 建议面板 |
| `src/components/dashboard/TrendChart.tsx` | 新建 | 周/月趋势图（SVG） |
| `src/pages/OverviewPage.tsx` | 新建 | 总览页（组合上述组件） |
| `src/mock/*.ts` | 新建 | mock 数据集中目录 |
| `src/components/Hero/`, `Navigation/`, `Projects/` | 保留不动 | 不挂载但保留 |

### 依赖关系

- **新增 npm 依赖**：无（TrendChart 用原生 SVG，不引入图表库）
- **复用依赖**：React 19 / Tailwind v4 / ThemeProvider

### 高风险变更回滚方案

本次变更替换 `App.tsx` 主挂载点，属高风险。回滚步骤：

1. `git revert` 本次提交即可恢复 App.tsx 挂载
2. 新增的 `src/layouts/` / `src/components/dashboard/` / `src/pages/` / `src/mock/` 目录可整体删除，无副作用
3. 原品牌站组件未被修改，revert 后立即恢复可用
4. 无数据库 / API 副作用，回滚零成本
