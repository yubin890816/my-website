import { useAuth } from '../../features/auth/useAuth'

export function ProfileBadge() {
  const { user } = useAuth()

  // 加载中：骨架屏（不显示 0 天 / Lv 1 默认值）
  if (!user) {
    return (
      <div
        id="profile-badge"
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-2">
            <div className="h-5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  const streak = user.streak_days ?? 0
  // level 为 null/undefined 时降级为 Lv 1
  const level = user.level ?? 1

  return (
    <div
      id="profile-badge"
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-semibold text-white dark:bg-indigo-500">
        {(user.email?.trim()?.charAt(0) ?? '?').toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {user.email}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
            <span aria-hidden>🔥</span>
            <span>{streak} 天</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            <span>Lv {level}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
