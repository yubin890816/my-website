import { GoalList } from '../components/dashboard/GoalList'

export function GoalsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          学习目标
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          勾选完成的目标，系统会自动记录学习日志
        </p>
      </div>

      <GoalList />
    </div>
  )
}
