import { useState } from 'react'
import type { TrendDataPoint, TrendPeriod } from '../../mock/trends'
import { WEEKLY_TREND, MONTHLY_TREND } from '../../mock/trends'

interface TrendChartProps {
  period?: TrendPeriod
}

const CHART_WIDTH = 600
const CHART_HEIGHT = 240
const PADDING_X = 32
const PADDING_Y = 24
const LABEL_INTERVAL_MONTH = 5

function formatLabel(date: string, period: TrendPeriod): string {
  const [, month, day] = date.split('-')
  return period === 'week' ? `${parseInt(day, 10)}` : `${parseInt(month, 10)}/${parseInt(day, 10)}`
}

export function TrendChart({ period: initialPeriod = 'week' }: TrendChartProps) {
  const [period, setPeriod] = useState<TrendPeriod>(initialPeriod)
  const data: TrendDataPoint[] =
    period === 'week' ? WEEKLY_TREND : MONTHLY_TREND

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 60)
  const yMax = Math.ceil(maxMinutes / 30) * 30

  const barCount = data.length
  const chartWidth = CHART_WIDTH - PADDING_X * 2
  const chartHeight = CHART_HEIGHT - PADDING_Y * 2
  const barWidth = chartWidth / barCount
  const barInnerWidth = Math.max(barWidth * 0.6, 2)

  const yTicks = [0, yMax / 2, yMax]

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          学习时长趋势
        </h3>
        <div className="flex gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {p === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label={`${period === 'week' ? '周' : '月'}学习时长柱状图`}
      >
        {yTicks.map((tick) => {
          const y = PADDING_Y + chartHeight - (tick / yMax) * chartHeight
          return (
            <g key={tick}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={CHART_WIDTH - PADDING_X}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
              />
              <text
                x={PADDING_X - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] dark:fill-slate-400"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {data.map((point, i) => {
          const barHeight = (point.minutes / yMax) * chartHeight
          const x = PADDING_X + i * barWidth + (barWidth - barInnerWidth) / 2
          const y = PADDING_Y + chartHeight - barHeight
          const showLabel =
            period === 'week' || i % LABEL_INTERVAL_MONTH === 0 || i === barCount - 1

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barInnerWidth}
                height={barHeight}
                rx={2}
                className="fill-indigo-500 dark:fill-indigo-400"
              />
              {showLabel && (
                <text
                  x={PADDING_X + i * barWidth + barWidth / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] dark:fill-slate-400"
                >
                  {formatLabel(point.date, period)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </section>
  )
}
