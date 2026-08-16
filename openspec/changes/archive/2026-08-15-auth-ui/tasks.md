## Phase 1: AuthProvider 与会话恢复

- [x] 1.1 检查复用：确认 `src/features/auth/` 目录不存在，无已有 AuthProvider 可复用（预期无，新建）
- [x] 1.2 创建 `src/features/auth/AuthProvider.tsx`：React Context + Provider，state 含 `user: UserProfile | null` / `loading: boolean` / `error: string | null`
- [x] 1.3 实现 `AuthProvider` 的 `useEffect` 启动逻辑：调用 `api.users.getMe()`，成功则 set user，失败则 set user=null（API client 内部自动 refresh）
- [x] 1.4 实现 `login(email, password)` 方法：调用 `api.auth.login()` → 成功后调用 `api.users.getMe()` 获取 Profile → set user
- [x] 1.5 实现 `register(email, password)` 方法：调用 `api.auth.register()` → 成功后调用 `api.users.getMe()` → set user
- [x] 1.6 实现 `logout()` 方法：清除 `api` 内部 access_token（调用 `api.auth.logout()` 若有，否则直接清 sessionStorage）+ set user=null
- [x] 1.7 创建 `src/features/auth/useAuth.ts`：自定义 hook，从 Context 读取，未在 Provider 内使用时抛错
- [x] 1.8 类型检查：`npx tsc -b --noEmit` 通过

**验证**：AuthProvider 能在 React DevTools 中看到 Context 值；启动时若后端未启动，`user` 为 null 且 `loading` 为 false

## Phase 2: 登录注册表单页

- [x] 2.1 检查复用：确认 `src/pages/LoginPage.tsx` 不存在（预期无，新建）
- [x] 2.2 创建 `src/pages/LoginPage.tsx`：含 `mode: 'login' | 'register'` state，默认 'login'
- [x] 2.3 实现表单 UI：email 输入框、password 输入框、（register 模式）confirm password 输入框、提交按钮、模式切换链接
- [x] 2.4 实现客户端校验：email 格式（用 `input type="email"` + `required` + 正则）、password 长度 ≥8、两次密码一致
- [x] 2.5 实现提交逻辑：调用 `useAuth().login()` 或 `register()`，成功后无需手动跳转（AuthProvider 状态变化自动触发重渲染）
- [x] 2.6 实现 API 错误反馈：捕获 `ApiError`，根据 `errorCode` 映射为中文文案，显示在表单顶部红色横幅
- [x] 2.7 实现加载状态：提交中按钮禁用 + 显示"提交中..."文案
- [x] 2.8 样式：复用 Tailwind 色板（indigo 主色 + slate 中性色），表单居中，背景使用渐变（slate-100 → indigo-100，暗色模式 slate-950 → indigo-950）
- [x] 2.9 类型检查：`npx tsc -b --noEmit` 通过

**验证**：浏览器访问应用，未登录时显示 LoginPage；切换模式时 confirm 密码框出现/消失；输入错误格式时显示校验提示

## Phase 3: App.tsx 整合与访问守卫

- [x] 3.1 修改 `src/App.tsx`：用 `AuthProvider` 包裹 `ThemeProvider` 内部，根据 `useAuth()` 的 `user` 与 `loading` 条件渲染
- [x] 3.2 实现条件渲染：`loading` 时显示全屏加载占位符；`!user` 时显示 `<LoginPage/>`；`user` 时显示 `<DashboardLayout><OverviewPage/></DashboardLayout>`
- [x] 3.3 类型检查：`npx tsc -b --noEmit` 通过

**验证**：未登录访问应用 → 显示 LoginPage；登录成功 → 自动切换到 Dashboard；登出 → 自动切换回 LoginPage

## Phase 4: Topbar 用户入口

- [x] 4.1 创建 `src/components/auth/UserMenu.tsx`：含头像按钮（圆形，indigo 背景，首字母大写）+ 下拉菜单
- [x] 4.2 实现下拉菜单：含"Profile"项（跳转到 OverviewPage 顶部，无路由则滚动到 ProfileBadge）+ "登出"项（调用 `useAuth().logout()`）
- [x] 4.3 实现点击外部关闭：用 `useEffect` + `document.addEventListener('click')` 检测点击是否在菜单 ref 外
- [x] 4.4 实现首字母派生：从 `user.email` 取首字符，`toUpperCase()`，空值降级为 "?"
- [x] 4.5 修改 `src/components/dashboard/Topbar.tsx`：在主题切换按钮左侧嵌入 `<UserMenu/>`
- [x] 4.6 类型检查：`npx tsc -b --noEmit` 通过

**验证**：登录后 Topbar 右侧显示头像+邮箱前缀；点击头像展开菜单；点击外部收起；点击"登出"回到 LoginPage

## Phase 5: ProfileBadge 组件

- [x] 5.1 检查复用：确认 `src/components/auth/ProfileBadge.tsx` 不存在（预期无，新建）
- [x] 5.2 创建 `src/components/auth/ProfileBadge.tsx`：从 `useAuth()` 读 `user`，显示 streak_days + level
- [x] 5.3 实现加载中骨架屏：`user` 为 null 时显示 `animate-pulse` 占位符
- [x] 5.4 实现 level 降级：`user.level` 为 null/undefined 时显示 "Lv 1"
- [x] 5.5 修改 `src/pages/OverviewPage.tsx`：在页面顶部嵌入 `<ProfileBadge/>`
- [x] 5.6 类型检查：`npx tsc -b --noEmit` 通过

**验证**：登录后 OverviewPage 顶部显示 ProfileBadge（🔥 N 天 + Lv N）；刷新页面时短暂显示骨架屏

## Phase 6: 端到端验证

- [x] 6.1 启动后端：`cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`
- [x] 6.2 启动前端：`npm run dev`
- [x] 6.3 验证未登录守卫：访问 `http://localhost:5173/my-website/` → 显示 LoginPage（不显示 Dashboard）
- [x] 6.4 验证注册流程：切换到 register 模式 → 填写表单 → 提交 → 自动登录 → 显示 Dashboard
- [x] 6.5 验证登录流程：登出 → 切换到 login 模式 → 填写已注册凭据 → 提交 → 显示 Dashboard
- [x] 6.6 验证表单校验：输入非法邮箱 / 短密码 / 不一致密码 → 显示错误提示且不提交
- [x] 6.7 验证 API 错误反馈：用已注册邮箱注册 → 显示"该邮箱已被注册"；用错误密码登录 → 显示"邮箱或密码错误"
- [x] 6.8 验证会话恢复：登录后刷新页面 → 自动恢复登录状态（无需重新登录）
- [x] 6.9 验证登出：点击 Topbar 头像 → 登出 → 回到 LoginPage → 浏览器后退键不能返回 Dashboard
- [x] 6.10 验证 ProfileBadge：OverviewPage 顶部显示 streak_days 与 level；首字母头像显示正确
- [x] 6.11 验证暗色模式：切换暗色模式 → LoginPage / Dashboard / UserMenu / ProfileBadge 样式同步
- [x] 6.12 构建验证：`npm run build` 通过，`dist/` 产物完整
