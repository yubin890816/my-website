export interface Stat {
  key: 'study_time' | 'goals_completed' | 'streak_days' | 'weekly_rank'
  label: string
  value: number
  unit: string
  change: number | null
}

export const STATS: Stat[] = [
  {
    key: 'study_time',
    label: '今日学习时长',
    value: 120,
    unit: '分钟',
    change: 12,
  },
  {
    key: 'goals_completed',
    label: '完成目标数',
    value: 3,
    unit: '个',
    change: 50,
  },
  {
    key: 'streak_days',
    label: '连续打卡',
    value: 7,
    unit: '天',
    change: 0,
  },
  {
    key: 'weekly_rank',
    label: '本周排名',
    value: 2,
    unit: '名',
    change: 1,
  },
]
