## Phase 1: Mock 数据层与类型定义

- [x] 1.1 创建 `src/mock/stats.ts`：定义 `Stat` 接口 + 导出 `STATS` 常量（4 项指标：今日学习时长 120 分钟 ↑12% / 完成目标数 3 个 ↑50% / 连续打卡 7 天 持平 / 本周排名 第 2 名 ↑1）
- [x] 1.2 创建 `src/mock/goals.ts`：定义 `Goal` 接口 + 导出 `GOALS` 常量（5 项目标，含数学/英语/编程 3 个科目，2 项已完成）
- [x] 1.3 创建 `src/mock/insights.ts`：定义 `Insight` 接口 + 导出 `INSIGHTS` 常量（3 条建议，覆盖 method/pace/resource 三类，含 priority 字段）
- [x] 1.4 创建 `src/mock/trends.ts`：定义 `TrendDataPoint` / `TrendPeriod` 接口 + 导出 `WEEKLY_TREND`（7 天数据）和 `MONTHLY_TREND`（30 天数据）常量

**验证**：`npx tsc -b --noEmit` 通过，mock 文件类型完整无错误。

## Phase 2: 基础展示组件

- [x] 2.1 检查复用：确认 `src/components/Projects/Projects.tsx` 的 ProjectCard 卡片骨架样式可否复用为 StatCard 底板（已确认：参考其 border + rounded-lg + dark 类名模式，但不直接复用代码）
- [x] 2.2 创建 `src/components/dashboard/StatCard.tsx`：接收 `Stat` props，渲染指标名 / 数值+单位 / 同比变化标签（↑绿 ↓红 持平灰，null 时隐藏）
- [x] 2.3 创建 `src/components/dashboard/GoalItem.tsx`：接收 `Goal` props + `onToggle` 回调，渲染勾选框 + 标题 + 科目标签 + 时长，支持 completed 状态样式（删除线）
- [x] 2.4 创建 `src/components/dashboard/InsightItem.tsx`：接收 `Insight` props，渲染分类标签（method 蓝 / pace 橙 / resource 紫）+ 标题 + 描述
- [x] 2.5 创建 `src/components/dashboard/TrendChart.tsx`：接收 `TrendDataPoint[]` + `period` props，用原生 SVG 绘制柱状图（含 X 轴标签 / Y 轴刻度 / 柱子），暗色模式柱子颜色适配

**验证**：`npm run build` 通过；Storybook 不可用，用临时测试页或 `npm run dev` + 浏览器手动检查各组件渲染。

## Phase 3: 复合组件

- [x] 3.1 创建 `src/components/dashboard/StatGrid.tsx`：导入 `STATS` mock，渲染 4 个 StatCard 的响应式网格（grid-cols-1 sm:grid-cols-2 lg:grid-cols-4）
- [x] 3.2 创建 `src/components/dashboard/GoalList.tsx`：导入 `GOALS` mock，用 `useState` 管理 goals 状态，渲染顶部 ProgressSummary（X/Y 文本 + 进度条）+ GoalItem 列表，全部完成时进度条变绿
- [x] 3.3 创建 `src/components/dashboard/InsightPanel.tsx`：导入 `INSIGHTS` mock，按 priority 排序后渲染 InsightItem 列表 + 面板标题（"AI 学习建议"）+ 灯泡图标
- [x] 3.4 检查复用：确认 `src/features/theme/useTheme.ts` 可在 Topbar 中复用（已确认：直接 import useTheme）

**验证**：`npm run build` 通过；`npm run dev` 浏览器检查各复合组件交互（勾选切换、进度更新、排序）。

## Phase 4: Dashboard 布局骨架

- [x] 4.1 创建 `src/components/dashboard/Sidebar.tsx`：渲染 5 个 NavItem（总览 / 目标 / 进度 / 建议 / 设置），仅"总览"为 active 状态，其余显示灰色 + "即将上线" tooltip；响应式：lg 展开 w-64 / md 收起 w-16 / sm 隐藏
- [x] 4.2 创建 `src/components/dashboard/Topbar.tsx`：渲染品牌名 "StudyPal" + 当前日期 + 主题切换按钮（复用 useTheme），frosted glass 样式（复用 Navigation.tsx 的 bg-white/70 backdrop-blur-md 类名）
- [x] 4.3 创建 `src/layouts/DashboardLayout.tsx`：用 CSS Grid 实现三段式布局（grid-cols-[256px_1fr] grid-rows-[64px_1fr]），含 Sidebar + Topbar + 主内容区（overflow-y-auto），移动端 Sidebar 浮层逻辑
- [x] 4.4 创建 `src/pages/OverviewPage.tsx`：组合 StatGrid + GoalList + TrendChart + InsightPanel，纵向排列，响应式适配

**验证**：`npm run build` 通过；浏览器检查三段式布局、响应式断点、暗色模式切换。

## Phase 5: App 集成与端到端验证

- [x] 5.1 修改 `src/App.tsx`：将挂载点从 `Navigation + Hero + Projects + section#contact` 替换为 `DashboardLayout` 包裹 `OverviewPage`，保留 ThemeProvider
- [x] 5.2 浏览器端到端验证：Dashboard 完整渲染 / 4 张统计卡片显示 / 目标清单可勾选且进度实时更新 / AI 建议面板显示 3 条 / 趋势图柱状渲染
- [x] 5.3 响应式验证：检查 lg（≥1024px）/ md（768-1023px）/ sm（<768px）三档断点下布局正确
- [x] 5.4 暗色模式验证：切换主题，所有区块颜色正确切换，对比度 ≥ 4.5:1
- [x] 5.5 构建验证：`npm run build` 通过，`dist/index.html` 含原 SEO meta tags（未破坏）
