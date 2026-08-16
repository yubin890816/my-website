import { INSIGHTS } from '../../mock/insights'
import { InsightItem } from './InsightItem'

export function InsightPanel() {
  const sorted = [...INSIGHTS].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 text-indigo-500 dark:text-indigo-300"
          aria-hidden="true"
        >
          <path d="M10 1a6 6 0 00-4 10.5V13a1 1 0 001 1h6a1 1 0 001-1v-1.5A6 6 0 0010 1zm-2 16a1 1 0 001 1h2a1 1 0 001-1v-1H8v1z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          AI 学习建议
        </h3>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          暂无建议
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((insight) => (
            <InsightItem key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </section>
  )
}
