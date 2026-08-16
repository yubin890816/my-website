## Context

当前 `App.tsx` 挂载品牌站组件（Hero / Navigation / Projects），ThemeProvider 与 Tailwind v4 配置已就绪。本期将 App 主挂载点替换为 `DashboardLayout`，原品牌站组件保留在 `src/components/` 但不再挂载。所有数据使用 mock，不引入后端依赖。技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS v4，部署 GitHub Pages（base `/my-website/`）。

## Goals / Non-Goals

**Goals:**
- 建立 Dashboard 三段式布局骨架，承载后续功能模块
- 用 mock 数据跑通 4 个核心区块的交互（统计 / 目标 / 建议 / 趋势）
- 复用 ThemeProvider / Tailwind 暗色模式 / index.html SEO 资产
- 不引入路由库，单页面承载所有区块

**Non-Goals:**
- 不接入真实后端 API（用 mock）
- 不引入图表库（TrendChart 用原生 SVG）
- 不引入状态管理库（用 React useState）
- 不做数据持久化（不写 localStorage）
- 不删除原品牌站组件（保留备用）

## Decisions

### Decision 1: 不引入路由库

本期 Dashboard 是单页面（总览页），所有区块在同一页面纵向排列。Sidebar 的 5 个入口中仅"总览"可点击，其余为占位。

**备选否决**：React Router v7——单页面无需路由，引入会增加体积与复杂度。后续接入第二页面（如 `/goals` 独立页）时再评估。

### Decision 2: DashboardLayout 三段式布局

```
┌──────────────────────────────────────────────────────────┐
│ Topbar  (h-16, sticky top-0, frosted glass 复用 Navigation 样式)│
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  Sidebar   │           Main Content Area                 │
│  (w-64)    │           (flex-1, overflow-y-auto)         │
│            │                                             │
│  - 总览    │   ┌─────────────────────────────────────┐   │
│  - 目标    │   │  StatCard × 4  (grid-cols-4)        │   │
│  - 进度    │   └─────────────────────────────────────┘   │
│  - 建议    │   ┌─────────────────────────────────────┐   │
│  - 设置    │   │  GoalList + TrendChart (grid-cols-3)│   │
│            │   └─────────────────────────────────────┘   │
│            │   ┌─────────────────────────────────────┐   │
│            │   │  InsightPanel                       │   │
│            │   └─────────────────────────────────────┘   │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

布局用 CSS Grid 实现：外层 `grid grid-cols-[256px_1fr] grid-rows-[64px_1fr]`，Topbar 跨两列。

### Decision 3: 组件层级图

```
App
└── ThemeProvider (复用)
    └── DashboardLayout
        ├── Sidebar
        │   └── NavItem × 5  (仅"总览"active)
        ├── Topbar
        │   ├── BrandLogo
        │   ├── DateDisplay
        │   └── ThemeToggle (复用 useTheme)
        └── OverviewPage
            ├── StatGrid
            │   └── StatCard × 4
            │       ├── MetricLabel
            │       ├── MetricValue
            │       └── ChangeBadge
            ├── GoalSection
            │   ├── ProgressSummary
            │   │   ├── ProgressText
            │   │   └── ProgressBar
            │   └── GoalList
            │       └── GoalItem × N
            │           ├── Checkbox
            │           ├── GoalTitle
            │           ├── SubjectTag
            │           └── Duration
            ├── TrendChart (SVG)
            │   ├── XAxis (周/月标签)
            │   ├── YAxis (时长刻度)
            │   └── Bars (每日柱状)
            └── InsightPanel
                ├── PanelHeader (标题 + 图标)
                └── InsightItem × N
                    ├── CategoryTag
                    ├── InsightTitle
                    └── InsightDescription
```

### Decision 4: 色板复用策略

复用品牌站 indigo 渐变色板，迁移到 Dashboard：
- 主色：`indigo-600`（按钮、进度条、active 状态）
- 背景渐变：`from-slate-100 via-blue-50 to-indigo-200`（亮）/ `from-slate-950 via-slate-900 to-indigo-950`（暗）
- 卡片背景：`bg-white` / `dark:bg-slate-900`
- 边框：`border-slate-200` / `dark:border-slate-800`

### Decision 5: TrendChart 用原生 SVG

不引入 recharts / chart.js，用原生 SVG 绘制柱状图。

**关键点**：
- 数据点 ≤ 7 个（周）或 ≤ 30 个（月），SVG 完全胜任
- 无额外依赖，bundle 体积零增长
- 暗色模式通过 CSS 变量切换柱子颜色

**备选否决**：recharts——功能强大但体积 80KB+，本期只需柱状图，过度设计。

### Decision 6: 响应式断点策略

| 断点 | Sidebar | StatCard | GoalSection + TrendChart |
|---|---|---|---|
| ≥1024px (lg) | 固定 w-64 展开 | 4 列 grid-cols-4 | 3 列 grid-cols-3（GoalList 占 2 列，TrendChart 占 1 列） |
| 768-1023px (md) | 收起为 w-16 图标条 | 2 列 grid-cols-2 | 1 列堆叠 |
| <768px (sm) | 隐藏 + 汉堡按钮 | 1 列 grid-cols-1 | 1 列堆叠 |

### Decision 7: mock 数据集中管理

所有 mock 数据放在 `src/mock/` 目录，按域分文件：

```
src/mock/
├── stats.ts        # 4 个统计指标数据
├── goals.ts        # 当日目标清单
├── insights.ts     # AI 建议条目
└── trends.ts       # 周/月趋势数据
```

每个文件导出强类型常量，便于后续替换为真实 API 调用时统一修改。

## API 端点规范

本期无后端 API。所有数据来自 `src/mock/` 下的静态常量。为后续接入后端预留的数据结构定义如下（仅类型，不实现）：

### Mock 数据结构

```typescript
// src/mock/stats.ts
interface Stat {
  key: 'study_time' | 'goals_completed' | 'streak_days' | 'weekly_rank'
  label: string           // "今日学习时长"
  value: number            // 120
  unit: string             // "分钟"
  change: number | null    // 12 (同比百分比，null 表示无数据)
}

// src/mock/goals.ts
interface Goal {
  id: string               // "goal-1"
  title: string            // "完成数学第三章习题"
  subject: string          // "数学"
  estimatedMinutes: number // 45
  completed: boolean       // false
}

// src/mock/insights.ts
interface Insight {
  id: string               // "insight-1"
  category: 'method' | 'pace' | 'resource'
  priority: number         // 1 (越小越优先)
  title: string            // "建议采用番茄工作法"
  description: string      // "你的平均专注时长偏短..."
  createdAt: string        // ISO 时间戳
}

// src/mock/trends.ts
interface TrendDataPoint {
  date: string             // "2026-08-15"
  minutes: number          // 120
}
type TrendPeriod = 'week' | 'month'
```

### 未来 API 端点预留（本期不实现）

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/stats/today` | GET | 获取今日统计指标 |
| `/api/goals/today` | GET | 获取当日目标清单 |
| `/api/goals/{id}/complete` | PATCH | 切换目标完成状态 |
| `/api/insights` | GET | 获取 AI 建议列表 |
| `/api/trends` | GET | 获取学习时长趋势（query: `?period=week\|month`） |

## Risks / Trade-offs

- **[TrendChart 自实现复杂度]** → 限制为柱状图单类型，不实现折线/饼图；SVG 模板 < 50 行
- **[mock 数据切换真实 API 的成本]** → mock 数据结构与未来 API 响应结构保持一致，切换时仅改 import 源
- **[Sidebar 占位入口可能误导用户]** → 占位项显示为灰色 + "即将上线" tooltip
- **[无路由库限制后续扩展]** → 本期单页面够用；接入第二页面时引入 React Router v7，迁移成本低（仅包裹 DashboardLayout）
- **[App.tsx 主结构替换的风险]** → 已在 proposal.md 写入回滚方案，git revert 即可恢复

## Migration Plan

1. 新建 `src/layouts/`、`src/components/dashboard/`、`src/pages/`、`src/mock/` 目录
2. 实现 mock 数据文件（4 个）
3. 实现基础组件（StatCard / GoalList / InsightPanel / TrendChart）
4. 实现 Sidebar / Topbar / DashboardLayout
5. 实现 OverviewPage 组合基础组件
6. 修改 `App.tsx` 挂载 DashboardLayout（最后一步，确保所有子组件就绪）
7. `npm run build` 验证 + 浏览器人工验证

**回滚**：`git revert` 本次提交，新增目录可整体删除，零副作用。
