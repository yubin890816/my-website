import { useEffect, useRef, useState } from 'react'
import type { ChatMessage as ChatMessageType } from '../../services/api'
import { ChatMessage } from './ChatMessage'

interface ChatMessageListProps {
  messages: ChatMessageType[]
  streamingMessageId: number | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ChatMessageList({
  messages,
  streamingMessageId,
  loading,
  error,
  onRetry,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  // 监听滚动位置，判断是否显示"新消息"按钮
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const isNearBottom = distanceFromBottom < 100
      setShowJumpButton(!isNearBottom && messages.length > 0)
      setUserScrolledUp(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messages.length])

  // 新消息或流式增量到达时自动滚动到底部（除非用户主动上滑）
  useEffect(() => {
    if (userScrolledUp) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, userScrolledUp])

  const jumpToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          加载历史消息中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          重试
        </button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">💬</div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            和你的 AI 学习教练开始对话吧
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="h-full space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            streaming={msg.id === streamingMessageId}
          />
        ))}
        <div ref={endRef} />
      </div>
      {showJumpButton && (
        <button
          type="button"
          onClick={jumpToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1.5 text-xs text-white shadow-lg hover:bg-indigo-700"
        >
          新消息 ↓
        </button>
      )}
    </div>
  )
}
