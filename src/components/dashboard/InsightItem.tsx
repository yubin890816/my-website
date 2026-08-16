import type { Insight } from '../../mock/insights'

interface InsightItemProps {
  insight: Insight
}

const CATEGORY_CONFIG: Record<
  Insight['category'],
  { label: string; className: string }
> = {
  method: {
    label: '方法',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  pace: {
    label: '节奏',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  resource: {
    label: '资源',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
}

export function InsightItem({ insight }: InsightItemProps) {
  const config = CATEGORY_CONFIG[insight.category]

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          {insight.title}
        </h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        {insight.description}
      </p>
    </article>
  )
}
