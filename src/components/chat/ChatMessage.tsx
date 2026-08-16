import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage as ChatMessageType } from '../../services/api'

interface ChatMessageProps {
  message: ChatMessageType
  streaming?: boolean
}

export function ChatMessage({ message, streaming }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-slate-100 prose-pre:text-slate-800 dark:prose-pre:bg-slate-900 dark:prose-pre:text-slate-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (streaming ? '' : '')}
            </ReactMarkdown>
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-middle dark:bg-slate-500" />
            )}
          </div>
        )}
        {message.is_partial && !streaming && (
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            （回复中断）
          </div>
        )}
      </div>
    </div>
  )
}
