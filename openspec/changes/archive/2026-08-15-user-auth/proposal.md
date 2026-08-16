## Why

StudyPal 当前是纯前端 Dashboard，所有数据来自 `src/mock/`，刷新即重置。要让学习记录、连续打卡、用户等级等核心指标真正持久化，必须引入后端与用户身份。本次变更为 StudyPal 建立 FastAPI 后端骨架与 JWT 认证体系，使每个学习者拥有独立身份与可累积的学习档案，为后续 GoalList / TrendChart / InsightPanel 接入真实数据奠基。

## What Changes

- **新增** FastAPI 后端服务（独立目录 `backend/`，与前端 `/src` 解耦，不影响 `npm run build`）
- **新增** SQLite 3 数据库 + Alembic 迁移（首期仅 `users` 表，含 `id` / `email` / `hashed_password` / `avatar_url` / `streak_days` / `level` / `created_at`）
- **新增** 用户注册端点 `POST /api/auth/register`：邮箱+密码注册，密码 bcrypt 哈希，邮箱唯一约束
- **新增** 用户登录端点 `POST /api/auth/login`：校验凭据，签发 access token（短时）+ refresh token（长时）
- **新增** Token 刷新端点 `POST /api/auth/refresh`：凭 refresh token 签发新的 access token
- **新增** 用户 Profile 端点 `GET /api/users/me`：需 Bearer access token，返回头像 / 连续学习天数 / 用户等级
- **新增** auth capability spec（认证流程的 externally observable 行为契约）
- **新增** user-profile capability spec（Profile 字段与可读性的行为契约）
- **配置** CORS 允许前端 origin（开发期 `http://localhost:5173`，生产期 `https://yubin890816.github.io`）
- **新增** 前端 API client 雏形（`src/services/api.ts`，封装 fetch + Bearer 注入 + 401 自动刷新）— **BREAKING**：`src/mock/` 暂保留，但 Dashboard 数据源将逐步切换到 API

## Capabilities

### New Capabilities

- `auth`: 用户注册、登录、JWT 签发与刷新的对外行为契约（不含前端 UI）
- `user-profile`: 用户档案的可读字段、访问授权、连续学习天数与等级的派生规则

### Modified Capabilities

（无 — 现有 `learning/*` specs 描述的是前端 Dashboard 行为，本次变更不修改其 requirement；数据源从 mock 切到 API 属于实现细节，spec 层面行为不变）

## Impact

- **新增代码**：
  - `backend/` 目录：FastAPI app、路由、models、schemas、依赖注入、Alembic 配置
  - `src/services/api.ts`：前端 API client
- **依赖**：`backend/requirements.txt` 新增 fastapi / uvicorn / sqlalchemy / alembic / python-jose / passlib[bcrypt] / pydantic-settings
- **数据库**：SQLite 文件 `backend/studypal.db`（开发期本地，不入库）
- **配置**：`backend/.env` 含 `JWT_SECRET` / `JWT_ACCESS_EXPIRE_MINUTES` / `JWT_REFRESH_EXPIRE_DAYS` / `CORS_ORIGINS`
- **前端构建**：不受影响（`backend/` 不参与 `npm run build`）
- **部署**：后端需独立部署（Vercel / Railway / Fly.io），与 GitHub Pages 前端分离 — **本变更不处理部署，仅约定 CORS**
- **回滚方案**：后端目录独立，删除 `backend/` + 还原 `src/services/` 即可恢复纯前端状态；`src/mock/` 保留不删，保证回滚后 Dashboard 仍可运行

## Out of Scope（不做）

- 后台管理（admin 后台、用户管理界面、内容审核）
- OAuth 第三方登录（Google / GitHub / 微信）
- 邮箱验证流程（注册即用，不发邮件）
- 密码重置 / 忘记密码流程
- 角色权限分级（RBAC），本期仅单一 `user` 角色
- 多设备 session 管理（不维护 session 列表，refresh token 单个即可）
- 后端部署与 CI/CD（仅本地开发，部署留待后续 change）
- 前端登录 / 注册 UI 组件（本变更仅产出后端 + API client，UI 留待后续 change `auth-ui`）
- 学习记录相关表（goals / study_logs 等）— 留待后续 change
- 单元测试 / 集成测试套件搭建（仅手动验证端点）

## Rollback Plan

本变更为"新增式"重构，无破坏性删除：

1. **代码层**：`backend/` 独立目录，删除即恢复；`src/services/api.ts` 删除后前端回退到 `src/mock/`
2. **数据库层**：SQLite 文件 `backend/studypal.db` 删除即清空，无外部依赖
3. **依赖层**：`backend/requirements.txt` 仅影响 Python 虚拟环境，不影响前端 `package.json`
4. **配置层**：`backend/.env` 删除即可

回滚步骤：`rm -rf backend/ src/services/ && git checkout src/App.tsx`（App.tsx 如有修改）
