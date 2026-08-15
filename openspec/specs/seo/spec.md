## Purpose

为站点提供搜索引擎优化（SEO）基础设施与社交分享元数据，让搜索引擎与社交平台能正确索引与展示站点内容。

## Requirements

### Requirement: HTML 文档语言与标题

站点 HTML 根元素 SHALL 声明正确的文档语言为简体中文，并具有描述性的页面标题。

- **GIVEN** 浏览器加载站点 HTML
- **WHEN** 解析 `<html>` 元素与 `<head>`
- **THEN** `<html>` 元素具有 `lang="zh-CN"` 属性
- **AND** `<title>` 元素包含描述站点用途的标题文本（非默认的 "my-website"）

#### Scenario: 读屏器正确识别语言

- **GIVEN** 视障访客使用读屏器访问站点
- **WHEN** 读屏器解析 `<html lang="zh-CN">`
- **THEN** 读屏器使用中文语音引擎朗读内容
- **AND** 不出现用英文引擎朗读中文内容的错误

### Requirement: Meta Description

站点 SHALL 包含 `<meta name="description">` 标签，提供站点的简要描述。

- **GIVEN** 浏览器加载站点 HTML
- **WHEN** 解析 `<head>` 中的 meta 标签
- **THEN** 存在 `<meta name="description" content="...">` 元素
- **AND** content 属性包含描述站点用途的文本（长度 50-160 字符）

#### Scenario: 搜索引擎结果页展示描述

- **GIVEN** Google 爬虫已索引站点
- **WHEN** 用户在 Google 搜索站点相关关键词
- **THEN** 搜索结果页展示 meta description 内容作为摘要
- **AND** 摘要长度不被截断（控制在 160 字符内）

### Requirement: Open Graph 社交分享元数据

站点 SHALL 包含 Open Graph 元数据，让社交平台（Facebook/LinkedIn/微信等）分享时展示卡片预览。

- **GIVEN** 浏览器加载站点 HTML
- **WHEN** 解析 `<head>` 中的 meta 标签
- **THEN** 存在以下 Open Graph 标签：
  - `og:title`：分享卡片标题
  - `og:description`：分享卡片描述
  - `og:type`：内容类型（值为 `website`）
  - `og:url`：站点规范 URL
  - `og:image`：分享卡片预览图 URL
  - `og:locale`：内容语言（值为 `zh_CN`）

#### Scenario: 微信分享展示卡片

- **GIVEN** 访客在微信中分享站点 URL
- **WHEN** 微信爬虫抓取页面 OG 标签
- **THEN** 分享卡片展示 og:title 作为标题
- **AND** 分享卡片展示 og:description 作为描述
- **AND** 分享卡片展示 og:image 作为预览图

#### Scenario: og:image 资源缺失时的降级

- **GIVEN** og:image 指向的图片 URL 失效或未设置
- **WHEN** 社交平台抓取 OG 标签
- **THEN** 分享卡片仍展示 og:title 与 og:description 文本
- **AND** 卡片不展示预览图（社交平台自动降级为纯文本卡片）

### Requirement: robots.txt 允许爬虫索引

站点 SHALL 在根路径提供 `robots.txt` 文件，允许 Google 爬虫索引全站内容。

- **GIVEN** 站点已部署到 GitHub Pages
- **WHEN** Google 爬虫访问 `https://<username>.github.io/my-website/robots.txt`
- **THEN** 返回 HTTP 200 状态码
- **AND** 响应内容包含 `User-agent: *` 与 `Allow: /` 指令

#### Scenario: robots.txt 不屏蔽任何路径

- **GIVEN** 爬虫读取 robots.txt
- **WHEN** 解析指令
- **THEN** 不存在 `Disallow: /` 指令（不屏蔽全站）
- **AND** 不存在 `Disallow: /my-website/` 指令（不屏蔽 base path）

### Requirement: 语义化 HTML 结构

站点 SHALL 使用语义化 HTML 元素（`<nav>`/`<section>`/`<article>`/`<h1>`-`<h3>`/`<ul>`/`<li>`）构建内容结构，让搜索引擎与读屏器正确理解内容层级。

- **GIVEN** 站点页面渲染完成
- **WHEN** 检查 DOM 结构
- **THEN** 导航栏使用 `<nav>` 元素
- **AND** 导航链接使用 `<ul>/<li>` 列表结构（非 `<div>` 包装）
- **AND** 各区块使用 `<section>` 元素
- **AND** 项目卡片使用 `<article>` 元素
- **AND** 标题层级正确（`<h1>` 唯一、`<h2>` 为区块标题、`<h3>` 为子项标题）

#### Scenario: 标题层级无跳跃

- **GIVEN** 页面渲染完成
- **WHEN** 检查标题层级
- **THEN** 不存在从 `<h1>` 直接跳到 `<h3>` 的层级跳跃
- **AND** 每个 `<section>` 内的标题层级连续
