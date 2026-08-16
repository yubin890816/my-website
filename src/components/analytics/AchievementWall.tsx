import type { Achievement } from '../../services/api'

interface AchievementWallProps {
  achievements: Achievement[]
}

export function AchievementWall({ achievements }: AchievementWallProps) {
  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          成就墙
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          已解锁 {unlocked.length} / {achievements.length}
        </span>
      </div>

      {achievements.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          暂无成就数据
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...unlocked, ...locked].map((ach) => (
            <div
              key={ach.code}
              className={`flex flex-col items-center rounded-lg border p-3 text-center ${
                ach.unlocked
                  ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950'
                  : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {ach.icon}
              </span>
              <p
                className={`mt-2 text-sm font-medium ${
                  ach.unlocked
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {ach.title}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {ach.description}
              </p>
              {ach.unlocked && ach.unlocked_at && (
                <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                  {new Date(ach.unlocked_at).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
