## MODIFIED Requirements

### Requirement: 全屏高度展示

Hero 区块 SHALL 占据视口完整高度，确保首屏不出现滚动条，内容在视口内垂直居中。Hero 区块 SHALL 具有 `id="home"` 属性，作为导航栏"首页"链接的锚点目标。

- **GIVEN** 访客使用任意现代浏览器访问站点首页
- **WHEN** 页面完成首次渲染
- **THEN** Hero 区块高度等于视口可视高度（动态视口高度，非固定 `100vh`）
- **AND** 首屏不出现垂直滚动条
- **AND** 名字、职业、介绍文本、CTA 按钮均在视口可见范围内
- **AND** Hero 区块的 DOM 元素具有 `id="home"`

#### Scenario: 移动端地址栏伸缩不产生空白

- **GIVEN** 访客使用 iOS Safari 等动态地址栏浏览器
- **WHEN** 访客滚动页面导致地址栏收起或展开
- **THEN** Hero 区块高度始终跟随动态视口高度变化
- **AND** 不出现底部空白或内容被裁切

#### Scenario: 导航栏"首页"链接可达 Hero

- **GIVEN** 页面已渲染，导航栏存在"首页"链接指向 `#home`
- **WHEN** 访客点击"首页"链接
- **THEN** 页面滚动至 Hero 区块位置
- **AND** URL hash 更新为 `#home`
