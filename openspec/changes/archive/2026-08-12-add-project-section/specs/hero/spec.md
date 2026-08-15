## REMOVED Requirements

### Requirement: 项目区占位锚点

**Reason**: 本变更 `add-project-section` 用实际项目展示区取代了空占位。原占位契约（"不含任何子内容"）与新行为冲突，需移除让位给 `projects` capability 的完整契约。

**Migration**: 项目区锚点目标行为由新 `projects` capability 的"项目区位置与结构" requirement 接管。Hero CTA 与导航栏"项目"链接的 `href="#projects"` 无需修改，锚点目标从空占位变为有内容的项目区，跳转行为自动正确。
