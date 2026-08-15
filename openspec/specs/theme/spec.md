## Purpose

为站点提供两态（light/dark）主题切换基础设施，包含状态管理、持久化、DOM class 注入与首屏 FOUC 修复，作为所有区块共享的主题上下文。

## Requirements

### Requirement: 两态主题模型

系统 SHALL 提供两态主题模型（light、dark），不包含 "system" 状态。默认主题为 light。

- **GIVEN** 站点首次被访客加载，且 `localStorage` 中无主题记录
- **WHEN** 主题初始化
- **THEN** 主题被设为 light
- **AND** `<html>` 元素的 class 列表不含 `dark`

- **GIVEN** 当前主题为 light
- **WHEN** 主题被切换为 dark
- **THEN** `<html>` 元素的 class 列表新增 `dark`
- **AND** 所有使用 `dark:` 前缀的 Tailwind 样式生效

- **GIVEN** 当前主题为 dark
- **WHEN** 主题被切换为 light
- **THEN** `<html>` 元素的 class 列表移除 `dark`
- **AND** 所有使用 `dark:` 前缀的 Tailwind 样式失效

### Requirement: 主题状态持久化

系统 SHALL 将用户选择的主题持久化到 `localStorage`，确保跨会话与跨刷新的一致性。

- **GIVEN** 用户将主题从 light 切换为 dark
- **WHEN** 切换动作完成
- **THEN** `localStorage` 中 `theme` 字段被写入 `dark`

- **GIVEN** `localStorage` 中 `theme` 字段为 `dark`
- **WHEN** 用户刷新页面或在新会话中打开站点
- **THEN** 页面以 dark 主题加载

#### Scenario: localStorage 不可用时的降级

- **GIVEN** 浏览器禁用 `localStorage`（隐私模式或存储配额满）
- **WHEN** 用户切换主题
- **THEN** 主题切换在当前会话内生效
- **AND** 不抛出 JavaScript 错误
- **AND** 刷新后主题回退为默认值 light（因无法持久化）

### Requirement: 首屏无 FOUC（Flash of Unstyled Content）

系统 SHALL 在 React 应用 hydrate 之前，通过 `index.html` 中的 inline script 预设 `<html>` 的主题 class，避免首屏出现亮→暗或暗→亮的视觉闪烁。

- **GIVEN** `localStorage` 中 `theme` 字段为 `dark`
- **WHEN** 浏览器开始解析 `index.html`，执行 `<head>` 中的 inline script
- **THEN** 在 React 渲染之前，`<html>` 已被添加 `dark` class
- **AND** 首屏不出现主题闪烁

#### Scenario: 首次访问无主题记录

- **GIVEN** `localStorage` 中无 `theme` 字段
- **WHEN** inline script 执行
- **THEN** `<html>` 不被添加 `dark` class（保持默认 light）
- **AND** 首屏不出现主题闪烁

### Requirement: 主题状态可被消费

系统 SHALL 通过 React Context 暴露当前主题与切换函数，供任意子组件消费。

- **GIVEN** 应用已挂载 `ThemeProvider`
- **WHEN** 子组件调用主题 hook
- **THEN** 可读取当前主题值（`light` 或 `dark`）
- **AND** 可获取一个切换函数，调用后在 light 与 dark 之间切换

#### Scenario: Provider 外调用 hook 的边界处理

- **GIVEN** 某组件未包裹在 `ThemeProvider` 内
- **WHEN** 该组件调用主题 hook
- **THEN** hook 返回默认主题 light 与 no-op 切换函数
- **AND** 不抛出 JavaScript 错误
- **AND** 控制台输出一条警告信息（仅在开发模式下）
