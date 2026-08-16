## Purpose

定义部署上线能力的对外行为契约：前端 GitHub Pages + 后端 Railway 的部署流程、环境变量管理、CORS 配置、健康检查。覆盖生产环境配置、密钥管理、回滚场景。

## ADDED Requirements

### Requirement: 前端 GitHub Pages 部署

系统 SHALL 通过 GitHub Actions 自动部署前端构建产物到 GitHub Pages，部署在 `main` 分支 push 时触发。

- **GIVEN** 开发者向 `main` 分支推送代码
- **WHEN** GitHub Actions workflow 触发
- **THEN** 执行 `npm run build` 构建前端
- **AND** 构建时注入 `VITE_API_BASE_URL` 环境变量指向后端生产域名
- **AND** 构建产物部署到 GitHub Pages
- **AND** 访问 `https://<username>.github.io/my-website/` 返回 200

#### Scenario: 构建失败中断部署

- **GIVEN** 前端构建过程报错（如 TypeScript 编译失败）
- **WHEN** GitHub Actions 执行构建步骤
- **THEN** workflow 失败并停止
- **AND** 不更新 GitHub Pages 内容
- **AND** 保留上一次成功部署的版本

#### Scenario: base path 配置

- **GIVEN** GitHub Pages 项目名为 `my-website`
- **WHEN** 前端构建
- **THEN** Vite `base` 配置为 `/my-website/`
- **AND** 所有静态资源路径以 `/my-website/` 前缀加载

### Requirement: 后端 Railway 部署

系统 SHALL 通过 Railway 从 GitHub 仓库自动部署后端服务，部署在 `main` 分支 push 时触发。

- **GIVEN** 开发者向 `main` 分支推送代码（含 backend/ 变更）
- **WHEN** Railway 检测到仓库更新
- **THEN** 使用 `backend/Dockerfile` 构建镜像
- **AND** 启动容器并暴露端口
- **AND** 访问 `https://<railway-domain>/health` 返回 200 与 `{"status":"ok"}`

#### Scenario: 环境变量注入

- **GIVEN** Railway 项目已配置环境变量（`JWT_SECRET`、`DEEPSEEK_API_KEY`、`CORS_ORIGINS`）
- **WHEN** 后端容器启动
- **THEN** 应用从 `os.environ` 读取上述变量
- **AND** `CORS_ORIGINS` 包含 GitHub Pages 域名
- **AND** 未配置的变量使用安全默认值（如 `JWT_SECRET` 缺失时启动失败）

#### Scenario: SQLite 持久化卷

- **GIVEN** Railway 容器配置了持久化卷挂载到 `/data`
- **WHEN** 容器重启或重新部署
- **THEN** `DATABASE_URL` 指向 `/data/studypal.db`
- **AND** 数据库内容保留，不丢失

#### Scenario: 关键变量缺失启动失败

- **GIVEN** `JWT_SECRET` 环境变量未配置
- **WHEN** 后端容器启动
- **THEN** 应用抛出启动错误并退出
- **AND** Railway 标记部署为失败
- **AND** 保留上一次成功部署的容器

### Requirement: 生产环境健康检查

系统 SHALL 提供 `/health` 端点供 Railway 进行健康检查，无需鉴权。

- **GIVEN** Railway 周期性探测容器健康状态
- **WHEN** 调用 `GET /health`
- **THEN** 返回 200 与 `{"status":"ok"}` JSON
- **AND** 不查询数据库、不校验 token
- **AND** 响应时间 < 100ms

#### Scenario: 健康检查不暴露敏感信息

- **GIVEN** 攻击者探测 `/health` 端点
- **WHEN** 查看响应内容
- **THEN** 仅返回 `{"status":"ok"}`
- **AND** 不包含版本号、数据库连接信息、环境变量
