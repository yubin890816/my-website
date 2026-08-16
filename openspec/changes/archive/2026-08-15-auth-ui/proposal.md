## Why

当前 StudyPal Dashboard 已上线（learning-dashboard 归档），user-auth 后端 API + 前端 API client 已就绪（user-auth 归档），但两者**未整合**：

- Dashboard 直接读 `src/mock/*.ts` 静态数据，与用户身份无关
- API client（`src/services/api.ts`）的 `auth.register/login/refresh` 与 `users.getMe` 方法已实现，但**无任何 UI 消费方**
- 用户无法在前端注册/登录/查看自己的 Profile

本变更的目标：在前端新增认证 UI（登录/注册表单）+ 用户上下文 Provider + 在 Topbar 显示用户身份入口，让用户能通过浏览器完成注册→登录→查看 Profile 的完整流程。

## What Changes

### New Capabilities

- **`auth/ui`**：前端认证 UI 层，含登录/注册表单、用户上下文 Provider、受保护路由守卫、Topbar 用户入口
- **`profile/ui`**：用户档案展示 UI，含头像、邮箱、连续学习天数、等级徽章

### Modified Capabilities

- **`learning/dashboard`**：Topbar 在右侧新增"用户入口"区域（未登录时显示"登录"按钮，已登录时显示头像+下拉菜单）；DashboardLayout 接入 AuthProvider，未登录时重定向到登录页

### Out of Scope（不做）

1. **后端 API 改动**：所有后端端点已在 user-auth 变更完成，本变更不改后端代码
2. **路由库引入**：仍不引入 React Router，用条件渲染（`isAuthenticated ? <Dashboard/> : <LoginPage/>`）实现"受保护页面"
3. **密码重置/忘记密码流程**：user-auth 后端未实现这些端点
4. **OAuth 第三方登录**：user-auth 后端未实现
5. **邮箱验证流程**：user-auth 后端未实现
6. **用户头像上传**：后端 `avatar_url` 字段只读，本变更用首字母占位符
7. **登出端点**：后端未实现 `/api/auth/logout`，前端登出仅清除本地 token（refresh token 等待自然过期）
8. **多角色/权限控制**：当前单角色，不做 RBAC
9. **Profile 编辑**：本变更只读展示 Profile，不支持修改邮箱/密码
10. **学习数据接入**：Dashboard 的统计卡片/目标清单/趋势图仍用 mock 数据，不接入后端

## Impact

### 受影响的代码

| 区域 | 影响 |
|---|---|
| `src/App.tsx` | 新增 AuthProvider 包裹，根据登录状态条件渲染 LoginPage 或 DashboardLayout |
| `src/layouts/DashboardLayout.tsx` | 无需改动（Topbar 通过 useUser hook 自适应） |
| `src/components/dashboard/Topbar.tsx` | 右侧新增用户入口区域 |
| `src/services/api.ts` | 无需改动（已就绪） |
| `src/mock/*` | 保留不删（Dashboard 仍用 mock 数据） |

### 新增的代码

| 路径 | 说明 |
|---|---|
| `src/features/auth/AuthProvider.tsx` | 用户上下文 Provider，管理登录状态与 Profile |
| `src/features/auth/useAuth.ts` | 自定义 hook，暴露 `user` / `login` / `register` / `logout` |
| `src/pages/LoginPage.tsx` | 登录/注册双模式表单页 |
| `src/components/auth/UserMenu.tsx` | Topbar 右侧用户菜单（头像 + 下拉） |
| `src/components/auth/ProfileBadge.tsx` | Profile 展示组件（streak + level 徽章） |

### 依赖

- 复用 `src/services/api.ts`（ApiClient 单例）
- 复用 `src/features/theme/ThemeProvider`（双主题）
- 复用 Tailwind 配置（表单样式沿用现有色板）

## Rollback Plan

本变更仅新增文件 + 修改 App.tsx / Topbar.tsx。回滚步骤：

1. `git revert` 本变更的所有 commit
2. 或手动：删除 `src/features/auth/` / `src/pages/LoginPage.tsx` / `src/components/auth/`，恢复 App.tsx 与 Topbar.tsx 到变更前状态

无数据库迁移、无后端改动，回滚零风险。
