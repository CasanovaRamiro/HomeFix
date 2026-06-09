import { MessageCircle } from 'lucide-react'
import type { ConversationSummary } from '../../types/chat'

interface ConversationListProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center text-gray-400">
          <MessageCircle className="mx-auto mb-2 h-10 w-10" />
          <p className="text-sm">Sin conversaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full border-b border-gray-100 px-3 py-3 text-left transition-colors hover:bg-gray-50 ${
              isSelected ? 'bg-emerald-50' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {conv.otherUserName}
                </p>
                <p className="truncate text-xs text-gray-500">{conv.postTitle}</p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  {conv.lastMessage || 'Sin mensajes'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-gray-400">
                  {formatTime(conv.lastMessageAt)}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
