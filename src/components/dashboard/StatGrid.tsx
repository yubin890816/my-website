import type { AnalyticsOverview } from '../../services/api'
import { StatCard } from './StatCard'

interface StatGridProps {
  overview: AnalyticsOverview | null
  loading: boolean
}

interface StatItem {
  key: 'study_time' | 'goals_completed' | 'streak_days' | 'weekly_rank'
  label: string
  value: number | null
  unit: string
}

function buildStats(overview: AnalyticsOverview | null): StatItem[] {
  if (overview === null) {
    return [
      { key: 'study_time', label: '今日学习时长', value: null, unit: '分钟' },
      { key: 'goals_completed', label: '完成目标数', value: null, unit: '个' },
      { key: 'streak_days', label: '连续打卡', value: null, unit: '天' },
      { key: 'weekly_rank', label: '本周排名', value: null, unit: '名' },
    ]
  }
  return [
    {
      key: 'study_time',
      label: '今日学习时长',
      value: overview.today_minutes,
      unit: '分钟',
    },
    {
      key: 'goals_completed',
      label: '完成目标数',
      value: overview.today_goals_completed,
      unit: '个',
    },
    {
      key: 'streak_days',
      label: '连续打卡',
      value: overview.streak_days,
      unit: '天',
    },
    {
      key: 'weekly_rank',
      label: '本周排名',
      value: overview.weekly_rank,
      unit: '名',
    },
  ]
}

export function StatGrid({ overview, loading }: StatGridProps) {
  const stats = buildStats(overview)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} loading={loading} />
      ))}
    </div>
  )
}
