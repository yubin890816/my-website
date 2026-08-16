import type { Goal } from '../../mock/goals'

interface GoalItemProps {
  goal: Goal
  onToggle: (id: string) => void
}

const SUBJECT_TAG_CLASS: Record<string, string> = {
  数学: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  英语: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  编程: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

export function GoalItem({ goal, onToggle }: GoalItemProps) {
  const tagClass =
    SUBJECT_TAG_CLASS[goal.subject] ||
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

  return (
    <li className="flex items-center gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={goal.completed}
        onClick={() => onToggle(goal.id)}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
          goal.completed
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
        }`}
      >
        {goal.completed && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path
              d="M3 8L6.5 11.5L13 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          goal.completed
            ? 'text-slate-400 line-through dark:text-slate-500'
            : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {goal.title}
      </span>
      <span
        className={`rounded px-2 py-0.5 text-xs font-medium ${tagClass}`}
      >
        {goal.subject}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {goal.estimatedMinutes} 分钟
      </span>
    </li>
  )
}
