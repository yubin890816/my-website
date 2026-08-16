import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, UnauthorizedError, type UserProfile } from '../../services/api'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 启动时尝试恢复会话：调用 /api/users/me，API client 内部自动 refresh
  useEffect(() => {
    let cancelled = false
    api.users
      .getMe()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          // refresh token 也已过期，保持未登录
          setUser(null)
        } else {
          // 网络错误或后端未启动，保持未登录
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await api.auth.login(email, password)
      const profile = await api.users.getMe()
      setUser(profile)
    } catch (err) {
      if (err instanceof ApiError) {
        throw err
      }
      throw new ApiError(0, 'NETWORK_ERROR', '网络异常，请稍后重试')
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await api.auth.register(email, password)
      const profile = await api.users.getMe()
      setUser(profile)
    } catch (err) {
      if (err instanceof ApiError) {
        throw err
      }
      throw new ApiError(0, 'NETWORK_ERROR', '网络异常，请稍后重试')
    }
  }, [])

  const logout = useCallback(() => {
    // 后端未实现 logout 端点，仅清除本地 token
    // refresh token 在 HttpOnly cookie 中等待自然过期
    api.clearAccessToken()
    setUser(null)
    setError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
