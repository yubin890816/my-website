interface StatCardProps {
  stat: {
    key: 'study_time' | 'goals_completed' | 'streak_days' | 'weekly_rank'
    label: string
    value: number | null
    unit: string
  }
  loading: boolean
}

export function StatCard({ stat, loading }: StatCardProps) {
  const { label, value, unit } = stat

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {value === null ? '--' : value}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </>
        )}
      </div>
    </article>
  )
}
