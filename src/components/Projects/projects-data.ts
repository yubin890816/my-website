export interface Project {
  name: string
  description: string
  screenshot: string
  githubUrl?: string
}

export const PROJECTS: Project[] = [
  {
    name: '项目一',
    description: '这是一个示例项目，展示个人品牌站的项目卡片样式与交互。',
    screenshot: `${import.meta.env.BASE_URL}projects/project-1.svg`,
    githubUrl: 'https://github.com/user/project-1',
  },
  {
    name: '项目二',
    description: '第二个示例项目，用于验证卡片网格布局的响应式表现。',
    screenshot: `${import.meta.env.BASE_URL}projects/project-2.svg`,
    githubUrl: 'https://github.com/user/project-2',
  },
  {
    name: '项目三',
    description: '第三个示例项目，验证 lazy loading 与暗色模式适配。',
    screenshot: `${import.meta.env.BASE_URL}projects/project-3.svg`,
    githubUrl: 'https://github.com/user/project-3',
  },
  {
    name: '项目四',
    description: '第四个示例项目，验证 hover 微特效与 reduced-motion 降级。',
    screenshot: `${import.meta.env.BASE_URL}projects/project-4.svg`,
    githubUrl: 'https://github.com/user/project-4',
  },
]
