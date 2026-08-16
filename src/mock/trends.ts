export interface TrendDataPoint {
  date: string
  minutes: number
}

export type TrendPeriod = 'week' | 'month'

function generateDates(days: number): string[] {
  const dates: string[] = []
  const today = new Date('2026-08-15')
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function generateMinutes(days: number, base: number, variance: number): number[] {
  const result: number[] = []
  for (let i = 0; i < days; i++) {
    const seed = (i * 37 + 13) % 100
    const offset = Math.floor((seed / 100) * variance * 2) - variance
    result.push(Math.max(0, base + offset))
  }
  return result
}

const weekDates = generateDates(7)
const weekMinutes = generateMinutes(7, 110, 40)

export const WEEKLY_TREND: TrendDataPoint[] = weekDates.map((date, i) => ({
  date,
  minutes: weekMinutes[i],
}))

const monthDates = generateDates(30)
const monthMinutes = generateMinutes(30, 100, 50)

export const MONTHLY_TREND: TrendDataPoint[] = monthDates.map((date, i) => ({
  date,
  minutes: monthMinutes[i],
}))
