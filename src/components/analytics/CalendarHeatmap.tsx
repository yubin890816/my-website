import type { CalendarDay } from '../../services/api'

interface CalendarHeatmapProps {
  data: CalendarDay[]
}

// level 0-4 颜色映射（亮色 / 暗色）
const LEVEL_COLORS: Record<number, string> = {
  0: 'fill-slate-100 dark:fill-slate-800',
  1: 'fill-emerald-200 dark:fill-emerald-900',
  2: 'fill-emerald-400 dark:fill-emerald-700',
  3: 'fill-emerald-600 dark:fill-emerald-500',
  4: 'fill-emerald-800 dark:fill-emerald-400',
}

const LEVEL_LABELS: Record<number, string> = {
  0: '无记录',
  1: '1-15 分钟',
  2: '16-30 分钟',
  3: '31-60 分钟',
  4: '60+ 分钟',
}

const CELL_SIZE = 11
const GAP = 3
const CELL_STEP = CELL_SIZE + GAP

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          学习日历
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          暂无数据
        </p>
      </div>
    )
  }

  // 按周分组（7 行），第一列对齐到周日
  const firstDate = new Date(data[0].date)
  const firstDayOfWeek = firstDate.getDay() // 0=周日
  const padded: (CalendarDay | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...data,
  ]
  const weeks: (CalendarDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const width = weeks.length * CELL_STEP
  const height = 7 * CELL_STEP

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          学习日历
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          近 {data.length} 天
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="学习日历热力图"
          className="min-w-full"
        >
          {weeks.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              if (day === null) return null
              const x = weekIdx * CELL_STEP
              const y = dayIdx * CELL_STEP
              const dateLabel = new Date(day.date).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
              })
              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  className={LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}
                >
                  <title>{`${dateLabel}: ${LEVEL_LABELS[day.level]}`}</title>
                </rect>
              )
            }),
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`inline-block h-3 w-3 rounded-sm ${LEVEL_COLORS[level]}`}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
