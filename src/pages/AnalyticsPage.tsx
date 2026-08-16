import { useEffect, useState } from 'react'
import { api, ApiError, type Achievement, type AnalyticsOverview, type CalendarDay } from '../services/api'
import { StatGrid } from '../components/dashboard/StatGrid'
import { CalendarHeatmap } from '../components/analytics/CalendarHeatmap'
import { AchievementWall } from '../components/analytics/AchievementWall'
import { ProfileBadge } from '../components/auth/ProfileBadge'

interface AnalyticsState {
  overview: AnalyticsOverview | null
  calendar: CalendarDay[]
  achievements: Achievement[]
  loading: boolean
  error: string | null
}

export function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsState>({
    overview: null,
    calendar: [],
    achievements: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    Promise.all([
      api.analytics.getOverview(),
      api.analytics.getCalendar(90),
      api.analytics.getAchievements(),
    ])
      .then(([overview, calendar, achievements]) => {
        if (cancelled) return
        setState({
          overview,
          calendar,
          achievements,
          loading: false,
          error: null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof ApiError ? err.message : '加载失败，请稍后重试'
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          学习数据
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          掌握你的学习进度与成就
        </p>
      </div>

      <ProfileBadge />

      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {state.error}
        </div>
      )}

      <StatGrid overview={state.overview} loading={state.loading} />

      <CalendarHeatmap data={state.calendar} />

      <AchievementWall achievements={state.achievements} />
    </div>
  )
}
