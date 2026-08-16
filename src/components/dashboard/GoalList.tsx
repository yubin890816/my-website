import { useState } from 'react'
import { api } from '../../services/api'
import { GOALS, type Goal } from '../../mock/goals'
import { GoalItem } from './GoalItem'

export function GoalList() {
  const [goals, setGoals] = useState<Goal[]>(GOALS)

  const handleToggle = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g
        const nextCompleted = !g.completed
        // 仅在切到完成时写入 study log（取消完成不回扣）
        if (nextCompleted) {
          const today = new Date().toISOString().slice(0, 10)
          // 乐观更新：失败不回滚 UI
          api.studyLogs
            .create({
              date: today,
              study_minutes: g.estimatedMinutes,
              goals_completed: 1,
            })
            .catch(() => {
              // 静默失败：保持 UI 已勾选状态
            })
        }
        return { ...g, completed: nextCompleted }
      }),
    )
  }

  const completedCount = goals.filter((g) => g.completed).length
  const totalCount = goals.length
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const allCompleted = totalCount > 0 && completedCount === totalCount

  if (totalCount === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          今日目标
        </h3>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          今日暂无目标
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          今日目标
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          今日进度：{completedCount}/{totalCount}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${
            allCompleted
              ? 'bg-emerald-500'
              : 'bg-indigo-600 dark:bg-indigo-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} onToggle={handleToggle} />
        ))}
      </ul>
    </section>
  )
}
