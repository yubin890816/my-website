## MODIFIED Requirements

### Requirement: 三段式布局结构

Dashboard SHALL 由左侧 Sidebar、顶部 Topbar、主内容区三段构成，主内容区填充 Sidebar 右侧、Topbar 下方的剩余空间。Topbar 右侧新增用户入口区域，展示登录状态与用户菜单。Sidebar 提供"总览"与"AI 助手"两个可用导航项，其他项保留为禁用占位。

- **GIVEN** 访客打开 Dashboard 页面
- **WHEN** 页面渲染完成
- **THEN** 左侧显示 Sidebar 导航
- **AND** 顶部显示 Topbar 横条
- **AND** Topbar 右侧显示用户入口区域（未登录显示"登录"按钮，已登录显示头像+菜单）
- **AND** 主内容区位于 Sidebar 右侧、Topbar 下方
- **AND** 三段不重叠
- **AND** Sidebar 中"总览"与"AI 助手"为可用状态，其余为禁用占位（点击无效）

#### Scenario: 主内容区滚动独立

- **GIVEN** 主内容区内容超出视口高度
- **WHEN** 访客在主内容区滚动鼠标
- **THEN** 仅主内容区滚动
- **AND** Sidebar 与 Topbar 保持固定可见

#### Scenario: 暗色模式适配

- **GIVEN** 站点当前处于暗色模式
- **WHEN** Dashboard 渲染
- **THEN** Sidebar / Topbar / 主内容区均使用暗色背景与浅色文字
- **AND** Topbar 用户入口区域同步使用暗色样式
- **AND** 文字与背景对比度 ≥ 4.5:1（WCAG AA）

#### Scenario: 主题切换即时响应

- **GIVEN** Dashboard 已渲染，当前为亮色模式
- **WHEN** 访客点击 Topbar 中的主题切换按钮
- **THEN** Sidebar / Topbar / 主内容区 / 用户入口区域背景与文字颜色立即切换为暗色版本
- **AND** 切换过程不产生视觉闪烁

#### Scenario: 主内容区渲染异常

- **GIVEN** 主内容区子组件抛出渲染异常
- **WHEN** Dashboard 渲染失败
- **THEN** Sidebar 与 Topbar（含用户入口）仍正常显示
- **AND** 主内容区显示错误占位符（"内容加载失败"文本）
- **AND** 不出现整页白屏

## ADDED Requirements

### Requirement: 主内容区视图切换

系统 SHALL 通过 Sidebar 导航项切换主内容区的视图，仅支持"总览"（overview）与"AI 助手"（chat）两种视图，不引入客户端路由库。

- **GIVEN** 已登录用户在 Dashboard 中
- **WHEN** 用户点击 Sidebar 中的"AI 助手"项
- **THEN** 主内容区切换为 ChatPage
- **AND** "AI 助手"项变为激活态（高亮）
- **AND** "总览"项变为非激活态
- **AND** 浏览器地址栏不变化

#### Scenario: 切换回总览

- **GIVEN** 当前视图为 chat
- **WHEN** 用户点击 Sidebar 中的"总览"项
- **THEN** 主内容区切换为 OverviewPage
- **AND** "总览"项变为激活态

#### Scenario: 视图状态不持久化

- **GIVEN** 用户刷新浏览器
- **WHEN** Dashboard 重新加载
- **THEN** 主内容区默认显示 OverviewPage
- **AND** 不记忆刷新前的视图选择
