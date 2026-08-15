## MODIFIED Requirements

### Requirement: 导航链接集合

导航栏右侧 SHALL 包含 3 个锚点链接：首页（`#home`）、项目（`#projects`）、联系我（`#contact`），按此顺序排列，并使用语义化的无序列表结构。

- **GIVEN** 导航栏渲染完成
- **WHEN** 查看导航栏右侧
- **THEN** 出现 3 个链接，从左到右依次为"首页"、"项目"、"联系我"
- **AND** 每个链接的 `href` 分别指向 `#home`、`#projects`、`#contact`
- **AND** 链接集合使用 `<ul>` 元素包裹，每个链接用 `<li>` 元素包裹（语义化列表结构）

#### Scenario: 锚点目标全部存在

- **GIVEN** 页面 DOM 中同时存在 `#home`、`#projects`、`#contact` 三个元素
- **WHEN** 访客点击任一导航链接
- **THEN** 页面平滑滚动至对应锚点位置
- **AND** 滚动行为遵循 `prefers-reduced-motion`（启用时直接跳转，不平滑）
- **AND** URL hash 更新为对应锚点

#### Scenario: 锚点目标缺失时的降级

- **GIVEN** 因渲染异常导致某个锚点目标（如 `#contact`）不存在于 DOM
- **WHEN** 访客点击对应导航链接
- **THEN** 浏览器 URL 不更新为无效锚点（点击处理拦截默认行为）
- **AND** 不抛出 JavaScript 错误
- **AND** 页面不发生滚动

#### Scenario: 语义化列表结构对读屏器可访问

- **GIVEN** 视障访客使用读屏器访问导航栏
- **WHEN** 读屏器遇到导航链接集合
- **THEN** 读屏器宣布这是一个列表（因 `<ul>/<li>` 语义）
- **AND** 读屏器报告列表项数量（3 项）
