import { useState, type FormEvent } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../services/api'

type Mode = 'login' | 'register'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_CODE_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: '该邮箱已被注册',
  INVALID_CREDENTIALS: '邮箱或密码错误',
  TOKEN_EXPIRED: '会话已过期，请重新登录',
  TOKEN_INVALID: '会话已过期，请重新登录',
  VALIDATION_ERROR: '输入数据不合法',
  NETWORK_ERROR: '网络异常，请稍后重试',
  UNKNOWN: '操作失败，请稍后重试',
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return ERROR_CODE_MESSAGES[err.errorCode] ?? err.message
  }
  return ERROR_CODE_MESSAGES.NETWORK_ERROR
}

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setApiError(null)
    setPassword('')
    setConfirmPassword('')
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!EMAIL_REGEX.test(email)) {
      next.email = '请输入合法邮箱地址'
    }
    if (password.length < 8) {
      next.password = '密码至少 8 位'
    }
    if (mode === 'register' && password !== confirmPassword) {
      next.confirmPassword = '两次输入的密码不一致'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      // 成功后无需手动跳转，AuthProvider 状态变化触发 App 重渲染
    } catch (err) {
      setApiError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 px-4 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-md dark:bg-slate-900/80">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              StudyPal
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {mode === 'login' ? '欢迎回来，请登录继续学习' : '创建账号，开启学习之旅'}
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再输入一次密码"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {submitting ? '提交中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <span className="text-slate-600 dark:text-slate-400">
                还没有账号？{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  切换到注册
                </button>
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">
                已有账号？{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  切换到登录
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
