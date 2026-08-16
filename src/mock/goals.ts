export interface Goal {
  id: string
  title: string
  subject: string
  estimatedMinutes: number
  completed: boolean
}

export const GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: '完成数学第三章习题',
    subject: '数学',
    estimatedMinutes: 45,
    completed: true,
  },
  {
    id: 'goal-2',
    title: '背诵英语单词 List 8',
    subject: '英语',
    estimatedMinutes: 30,
    completed: true,
  },
  {
    id: 'goal-3',
    title: 'React Hooks 进阶练习',
    subject: '编程',
    estimatedMinutes: 60,
    completed: false,
  },
  {
    id: 'goal-4',
    title: '阅读《算法导论》第 5 章',
    subject: '编程',
    estimatedMinutes: 50,
    completed: false,
  },
  {
    id: 'goal-5',
    title: '听力训练 30 分钟',
    subject: '英语',
    estimatedMinutes: 30,
    completed: false,
  },
]
