export interface Insight {
  id: string
  category: 'method' | 'pace' | 'resource'
  priority: number
  title: string
  description: string
  createdAt: string
}

export const INSIGHTS: Insight[] = [
  {
    id: 'insight-1',
    category: 'method',
    priority: 1,
    title: '建议采用番茄工作法',
    description: '你的平均专注时长偏短，建议每 25 分钟专注后休息 5 分钟，提升单位时间产出。',
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'insight-2',
    category: 'pace',
    priority: 2,
    title: '数学学习节奏过快',
    description: '近 3 天数学任务完成率下降，建议放慢进度，确保每章吸收后再推进。',
    createdAt: '2026-08-15T09:30:00Z',
  },
  {
    id: 'insight-3',
    category: 'resource',
    priority: 3,
    title: '推荐《Eloquent JavaScript》',
    description: '基于你的编程学习轨迹，这本书对你的 JS 进阶会很有帮助。',
    createdAt: '2026-08-15T10:00:00Z',
  },
]
