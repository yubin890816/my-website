/**
 * StudyPal API client
 *
 * 单文件封装所有后端调用。refresh token 通过 HttpOnly cookie 自动携带，
 * access token 在内存中保存（不写 localStorage，避免 XSS 窃取）。
 */

const ACCESS_TOKEN_KEY = 'studypal_access_token'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: number
  email: string
  avatar_url: string | null
  streak_days: number
  level: number
  created_at: string
}

export interface ChatSession {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  is_partial: boolean
  created_at: string
}

export interface AnalyticsOverview {
  today_minutes: number
  week_minutes: number
  today_goals_completed: number
  streak_days: number
  weekly_rank: number
}

export interface CalendarDay {
  date: string // YYYY-MM-DD
  level: number // 0-4
}

export interface Achievement {
  code: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at: string | null
}

export interface StudyLogPayload {
  date: string // YYYY-MM-DD
  study_minutes: number
  goals_completed: number
}

export interface StudyLog {
  id: number
  user_id: number
  date: string
  study_minutes: number
  goals_completed: number
}

interface ApiErrorResponse {
  detail?: { error_code?: string; message?: string } | string
}

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.accessToken = this.loadToken()
  }

  private loadToken(): string | null {
    try {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  }

  private saveToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
      } else {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      }
    } catch {
      // 静默失败：隐私模式或 storage 被禁用
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const headers = new Headers(options.headers)
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include', // 携带 HttpOnly cookie（refresh token）
    })

    // 401 自动刷新一次后重试
    if (response.status === 401 && !isRetry) {
      const refreshed = await this.refresh()
      if (refreshed) {
        return this.request<T>(path, options, true)
      }
      throw new UnauthorizedError('Session expired')
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse
      const errorCode =
        typeof errorBody.detail === 'object' ? errorBody.detail?.error_code : undefined
      const errorMsg =
        typeof errorBody.detail === 'string' ? errorBody.detail : errorBody.detail?.message
      throw new ApiError(response.status, errorCode ?? 'UNKNOWN', errorMsg ?? 'Request failed')
    }

    return response.json().catch(() => null) as Promise<T>
  }

  auth = {
    register: (email: string, password: string) =>
      this.request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then((res) => {
        this.accessToken = res.access_token
        this.saveToken(res.access_token)
        return res
      }),

    login: (email: string, password: string) =>
      this.request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then((res) => {
        this.accessToken = res.access_token
        this.saveToken(res.access_token)
        return res
      }),

    refresh: () => this.refresh(),
  }

  users = {
    getMe: () => this.request<UserProfile>('/api/users/me'),
  }

  analytics = {
    getOverview: () =>
      this.request<AnalyticsOverview>('/api/analytics/overview'),

    getCalendar: (days = 90) =>
      this.request<CalendarDay[]>(
        `/api/analytics/calendar?days=${encodeURIComponent(days)}`,
      ),

    getAchievements: () =>
      this.request<Achievement[]>('/api/analytics/achievements'),
  }

  studyLogs = {
    create: (payload: StudyLogPayload) =>
      this.request<StudyLog>('/api/study-logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  }

  chat = {
    getCurrentSession: () =>
      this.request<ChatSession>('/api/chat/sessions/current'),

    createSession: (title?: string) =>
      this.request<ChatSession>('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: title ?? '新对话' }),
      }),

    getMessages: async (
      sessionId: number,
      params: { limit?: number; offset?: number } = {},
    ): Promise<{ messages: ChatMessage[]; total: number }> => {
      const query = new URLSearchParams()
      if (params.limit !== undefined) query.set('limit', String(params.limit))
      if (params.offset !== undefined) query.set('offset', String(params.offset))
      const qs = query.toString()
      const path = `/api/chat/sessions/${sessionId}/messages${qs ? `?${qs}` : ''}`

      // 不走 request（需要读 header），直接 fetch + 401 重试一次
      const doFetch = async (): Promise<Response> => {
        const headers = new Headers()
        if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`)
        return fetch(`${this.baseUrl}${path}`, {
          headers,
          credentials: 'include',
        })
      }

      let response = await doFetch()
      if (response.status === 401) {
        const refreshed = await this.refresh()
        if (refreshed) response = await doFetch()
      }
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse
        const errorCode =
          typeof errorBody.detail === 'object' ? errorBody.detail?.error_code : undefined
        throw new ApiError(
          response.status,
          errorCode ?? 'UNKNOWN',
          'Failed to load messages',
        )
      }
      const messages = (await response.json()) as ChatMessage[]
      const total = Number(response.headers.get('X-Total-Count') ?? '0')
      return { messages, total }
    },

    /**
     * 流式发送消息，通过 SSE 接收 AI 回复。
     * 流式开始前若 401 会自动 refresh 重试一次；流式开始后不重试。
     */
    streamMessage: async (
      sessionId: number,
      content: string,
      callbacks: {
        onDelta: (chunk: string) => void
        onDone: (messageId: number) => void
        onError: (errorCode: string) => void
      },
    ): Promise<void> => {
      const path = `/api/chat/sessions/${sessionId}/messages/stream`

      const doFetch = (): Promise<Response> => {
        const headers = new Headers({
          'Content-Type': 'application/json',
        })
        if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`)
        return fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content }),
          credentials: 'include',
        })
      }

      let response = await doFetch()
      if (response.status === 401) {
        const refreshed = await this.refresh()
        if (refreshed) response = await doFetch()
      }

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse
        const errorCode =
          typeof errorBody.detail === 'object' ? errorBody.detail?.error_code : undefined
        throw new ApiError(
          response.status,
          errorCode ?? 'UNKNOWN',
          'Stream request failed',
        )
      }
      if (!response.body) {
        throw new ApiError(500, 'UNKNOWN', 'No response body')
      }

      // 解析 SSE 流
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // SSE 事件以双换行分隔
          let separatorIndex: number
          while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, separatorIndex)
            buffer = buffer.slice(separatorIndex + 2)
            if (!frame.trim()) continue

            // 解析 event: 与 data: 行
            let eventType = 'message'
            let dataLine = ''
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim()
              } else if (line.startsWith('data:')) {
                dataLine = line.slice(5).trim()
              }
            }

            if (!dataLine) continue
            try {
              const payload = JSON.parse(dataLine) as {
                content?: string
                message_id?: number
                error_code?: string
              }
              if (eventType === 'delta' && payload.content !== undefined) {
                callbacks.onDelta(payload.content)
              } else if (eventType === 'done' && payload.message_id !== undefined) {
                callbacks.onDone(payload.message_id)
              } else if (eventType === 'error' && payload.error_code) {
                callbacks.onError(payload.error_code)
              }
            } catch {
              // 跳过无法解析的帧
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    },
  }

  /**
   * 清除内存与 sessionStorage 中的 access token。
   * 用于前端主动登出（后端无 logout 端点时）。
   */
  clearAccessToken(): void {
    this.accessToken = null
    this.saveToken(null)
  }

  private async refresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 携带 HttpOnly cookie
      })
      if (!response.ok) {
        this.accessToken = null
        this.saveToken(null)
        return false
      }
      const data = (await response.json()) as AuthResponse
      this.accessToken = data.access_token
      this.saveToken(data.access_token)
      return true
    } catch {
      this.accessToken = null
      this.saveToken(null)
      return false
    }
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly errorCode: string

  constructor(status: number, errorCode: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
  }
}

// 单例：baseUrl 从 Vite 环境变量读取，开发期 fallback 到 localhost:8000
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
export const api = new ApiClient(baseUrl)
