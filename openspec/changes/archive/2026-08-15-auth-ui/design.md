## Context

当前前端已有 API client（`src/services/api.ts`，单例 `api`，含 `auth.register/login/refresh` + `users.getMe`）、ThemeProvider、DashboardLayout（含 Topbar + Sidebar）。本变更新增认证 UI 层，将 API client 接入 React 树。

关键约束：
- 不引入路由库，用条件渲染实现"未登录→登录页 / 已登录→Dashboard"
- 复用现有 ThemeProvider 与 Tailwind 配置
- 不修改后端代码
- 不删除 `src/mock/*`（Dashboard 数据仍用 mock）

## Goals / Non-Goals

**Goals:**
- 用户能在浏览器完成 注册 → 登录 → 查看 Profile → 登出 完整流程
- Dashboard 受访问守卫保护，未登录看不到 Dashboard 内容
- Topbar 显示登录状态入口
- 应用启动时自动恢复会话（refresh token 有效则免登录）

**Non-Goals:**
- 不实现真实路由（无 React Router）
- 不接入 Dashboard 数据源（仍用 mock）
- 不实现头像上传
- 不实现密码重置/邮箱验证

## Decisions

### Decision 1: 用 React Context 管理认证状态，不引入状态库

- **选择**：`AuthProvider` + `useAuth()` hook，状态保存在 `useState` 中
- **理由**：认证状态是全局唯一的简单状态，无需 Redux/Zustand 的复杂订阅机制；Context + hook 模式与现有 ThemeProvider 一致
- **备选**：Zustand（更细粒度订阅，但首期无性能瓶颈）

### Decision 2: access_token 保存在 sessionStorage，不写 localStorage

- **选择**：sessionStorage
- **理由**：关闭标签页自动清除，降低 XSS 窃取后的持久化风险；与 HttpOnly cookie（refresh token）形成双层防护
- **备选**：localStorage（跨标签页共享，但持久化风险高）/ 纯内存（刷新即丢失，体验差）
- **影响**：API client 已实现此逻辑（[api.ts:36-50](file:///Users/yubin/sdd_project/my_website_project/my-website/src/services/api.ts#L36-L50)），AuthProvider 直接复用

### Decision 3: 条件渲染代替路由守卫

- **选择**：`App.tsx` 中 `{user ? <DashboardLayout/> : <LoginPage/>}`
- **理由**：当前是单页面应用，无深链需求；引入 React Router 会增加复杂度，且 GitHub Pages 部署需要额外配置 404 fallback
- **备选**：React Router v7 + `<ProtectedRoute>`（未来扩展时再引入）
- **影响**：浏览器后退键无法在"登录页 ↔ Dashboard"间导航（但 spec 明确要求"登出后后退不能返回 Dashboard"，条件渲染天然满足）

### Decision 4: 登录与注册共用单一表单页

- **选择**：`LoginPage.tsx` 内部用 `mode` state 切换"login/register"
- **理由**：两个表单字段高度重合（email + password），共用减少重复代码；切换体验比跳转新页面更流畅
- **备选**：两个独立页面（更清晰但代码重复）

### Decision 5: 头像用首字母占位符，不引入头像库

- **选择**：`avatar_url` 为 null 时，取 email 首字母大写 + indigo 圆形背景
- **理由**：后端 `avatar_url` 字段当前无写入途径，引入头像上传超出本变更 scope；首字母方案零依赖、零网络请求
- **备选**：DiceBear API（生成随机头像，但引入外部依赖）

### Decision 6: 应用启动时同步调用 `/api/users/me` 恢复会话

- **选择**：AuthProvider 在 `useEffect` 中调用 `api.users.getMe()`，失败则保持未登录
- **理由**：API client 已实现 401 自动 refresh + 重试逻辑，AuthProvider 无需重复实现刷新逻辑
- **影响**：应用启动有 1 次 API 请求（成功或失败都立即渲染，不阻塞 UI）

### Decision 7: 组件层级图

```
App.tsx
└── ThemeProvider (已有)
    └── AuthProvider (新增)
        ├── if !user:
        │   └── LoginPage (新增)
        │       ├── AuthForm (新增，内部 mode=login/register)
        │       │   ├── EmailInput
        │       │   ├── PasswordInput
        │       │   ├── ConfirmPasswordInput (仅 register 模式)
        │       │   └── SubmitButton
        │       └── ModeSwitchLink
        │
        └── if user:
            └── DashboardLayout (已有)
                ├── Topbar (修改)
                │   ├── 主题切换按钮 (已有)
                │   ├── 日期显示 (已有)
                │   └── UserMenu (新增)
                │       ├── AvatarButton (首字母占位符)
                │       └── DropdownMenu
                │           ├── Profile 项
                │           └── 登出 项
                ├── Sidebar (已有，不改动)
                └── <main>
                    └── OverviewPage (已有，不改动)
                        └── ProfileBadge (新增，嵌入到 OverviewPage 顶部)
```

### Decision 8: 错误反馈用内联文案，不引入 Toast 库

- **选择**：表单错误在输入框下方红色文字；API 错误在表单顶部红色横幅
- **理由**：首期无需全局通知系统；Toast 库（如 react-hot-toast）增加依赖
- **错误码映射**：
  - `EMAIL_ALREADY_EXISTS` → "该邮箱已被注册"
  - `INVALID_CREDENTIALS` → "邮箱或密码错误"
  - `TOKEN_EXPIRED` / `TOKEN_INVALID` → "会话已过期，请重新登录"
  - 网络错误 → "网络异常，请稍后重试"

## API 端点消费（无新增端点，复用 user-auth）

| 端点 | 消费方 | 触发时机 |
|---|---|---|
| `POST /api/auth/register` | LoginPage (register 模式) | 用户提交注册表单 |
| `POST /api/auth/login` | LoginPage (login 模式) | 用户提交登录表单 |
| `POST /api/auth/refresh` | ApiClient 内部自动调用 | access token 401 时 |
| `GET /api/users/me` | AuthProvider (启动时) + UserMenu (渲染时) | 应用启动 + 已登录状态 |

## Risks / Trade-offs

- **[无路由库导致深链失效]** → 后续若需 `/login` `/dashboard` 独立 URL，引入 React Router；当前 spec 未要求深链
- **[sessionStorage 跨标签页不共享登录]** → 用户在新标签页打开应用需重新登录（或触发 refresh 自动恢复）；spec 未要求多标签同步
- **[登出未调用后端]** → refresh token 在 cookie 中继续有效直到 7 天过期；用户在同一浏览器重新打开应用可能被自动恢复登录。spec 已明确接受此行为
- **[应用启动有 1 次 API 请求]** → 若后端未启动，AuthProvider 的 `getMe` 会失败，用户看到登录页（可接受，因为本就需要登录）

## Migration Plan

1. 新增 `src/features/auth/AuthProvider.tsx` + `useAuth.ts`
2. 新增 `src/pages/LoginPage.tsx`（含表单组件）
3. 修改 `src/App.tsx`：包裹 AuthProvider + 条件渲染
4. 新增 `src/components/auth/UserMenu.tsx`
5. 修改 `src/components/dashboard/Topbar.tsx`：嵌入 UserMenu
6. 新增 `src/components/auth/ProfileBadge.tsx`
7. 修改 `src/pages/OverviewPage.tsx`：顶部嵌入 ProfileBadge
8. 端到端验证：后端启动 → 前端注册 → 登录 → 查看 Profile → 登出

## Open Questions

- **Profile 展示位置**：ProfileBadge 放在 OverviewPage 顶部（当前决策）还是 Topbar 内？前者空间更大，后者更醒目。当前选择 OverviewPage 顶部，Topbar 仅显示头像+邮箱前缀
- **登录页背景**：是否复用品牌站的 Hero 渐变背景？当前决策是复用（与 Dashboard 色板一致）
