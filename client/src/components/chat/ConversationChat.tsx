import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { DomainMessage, ConversationSummary } from '../../types/chat'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface ConversationChatProps {
  conversation: ConversationSummary
  messages: DomainMessage[]
  currentUserId: string
  onBack: () => void
  onSend: (content: string) => void
}

export default function ConversationChat({
  conversation,
  messages,
  currentUserId,
  onBack,
  onSend,
}: ConversationChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-emerald-600 px-3 py-3 text-white">
        <button
          onClick={onBack}
          className="flex items-center justify-center lg:hidden"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.otherUserName}</p>
          <p className="truncate text-xs text-emerald-100">{conversation.postTitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#E5DDD5] px-3 py-3">
        {messages.length === 0 && (
          <p className="mt-20 text-center text-sm text-gray-500">
            No hay mensajes todavía. Enviá el primero.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} />
    </div>
  )
}
