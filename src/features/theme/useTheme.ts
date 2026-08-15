import { useContext } from 'react'
import { ThemeContext, type Theme } from './ThemeProvider'

export interface UseThemeResult {
  theme: Theme
  toggleTheme: () => void
}

const fallback: UseThemeResult = {
  theme: 'light',
  toggleTheme: () => {},
}

export function useTheme(): UseThemeResult {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) {
    if (import.meta.env.DEV) {
      console.warn(
        'useTheme 必须在 <ThemeProvider> 内使用，当前返回默认值 light。',
      )
    }
    return fallback
  }
  return ctx
}
