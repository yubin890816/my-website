import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, type ChatMessage as ChatMessageType, type ChatSession } from '../services/api'
import { ChatInput } from '../components/chat/ChatInput'
import { ChatMessageList } from '../components/chat/ChatMessageList'

const ERROR_CODE_MESSAGES: Record<string, string> = {
  SESSION_NOT_FOUND: '会话不存在或已失效',
  VALIDATION_ERROR: '消息内容不合法',
  LLM_NOT_CONFIGURED: 'AI 服务未配置，请联系管理员',
  LLM_UPSTREAM_ERROR: 'AI 回复失败，请重试',
  NETWORK_ERROR: '网络中断，请检查连接后重试',
  UNKNOWN: '操作失败，请稍后重试',
}

function mapErrorCode(code: string): string {
  return ERROR_CODE_MESSAGES[code] ?? ERROR_CODE_MESSAGES.UNKNOWN
}

export function ChatPage() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)

  // 用于生成临时 message id（负数避免与后端 id 冲突）
  const tempIdRef = useRef(-1)
  const nextTempId = () => tempIdRef.current--

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setHistoryError(null)
    try {
      const currentSession = await api.chat.getCurrentSession()
      setSession(currentSession)
      const { messages: history } = await api.chat.getMessages(currentSession.id)
      setMessages(history)
    } catch (e) {
      const code = e instanceof ApiError ? e.errorCode : 'UNKNOWN'
      setHistoryError(mapErrorCode(code))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSend = useCallback(
    async (content: string) => {
      if (!session || streaming) return
      setStreamError(null)

      // 乐观追加用户气泡（临时 id）
      const userTempId = nextTempId()
      const userTempMsg: ChatMessageType = {
        id: userTempId,
        role: 'user',
        content,
        is_partial: false,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userTempMsg])

      // 预创建空 assistant 气泡（临时 id）
      const assistantTempId = nextTempId()
      const assistantTempMsg: ChatMessageType = {
        id: assistantTempId,
        role: 'assistant',
        content: '',
        is_partial: false,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantTempMsg])
      setStreamingMessageId(assistantTempId)
      setStreaming(true)

      let accumulated = ''
      try {
        await api.chat.streamMessage(session.id, content, {
          onDelta: (chunk) => {
            accumulated += chunk
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId ? { ...m, content: accumulated } : m,
              ),
            )
          },
          onDone: (messageId) => {
            // 用真实 id 替换临时 id
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId
                  ? { ...m, id: messageId, is_partial: false }
                  : m,
              ),
            )
            // 同时把用户消息的临时 id 替换为真实 id（后端已写入）
            // 由于后端 done 事件只返回 assistant message_id，
            // 用户消息 id 无法精确替换，这里保留临时 id（不影响 UI）
          },
          onError: (errorCode) => {
            setStreamError(mapErrorCode(errorCode))
            // 若有部分内容，标记为 partial；否则移除空 assistant 气泡
            setMessages((prev) =>
              prev
                .map((m) =>
                  m.id === assistantTempId
                    ? {
                        ...m,
                        is_partial: m.content.length > 0,
                      }
                    : m,
                )
                .filter((m) => !(m.id === assistantTempId && m.content === '')),
            )
          },
        })
      } catch (e) {
        const code = e instanceof ApiError ? e.errorCode : 'NETWORK_ERROR'
        setStreamError(mapErrorCode(code))
        // 移除空 assistant 气泡
        setMessages((prev) =>
          prev.filter(
            (m) => !(m.id === assistantTempId && m.content === ''),
          ),
        )
      } finally {
        setStreaming(false)
        setStreamingMessageId(null)
      }
    },
    [session, streaming],
  )

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          AI 学习教练
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          基于你的学习数据，给出个性化建议
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messages={messages}
          streamingMessageId={streamingMessageId}
          loading={loading}
          error={historyError}
          onRetry={loadHistory}
        />
      </div>

      {streamError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {streamError}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={streaming || loading} />
    </div>
  )
}
