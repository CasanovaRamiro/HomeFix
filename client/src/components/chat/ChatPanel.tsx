import { X } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import type { ConversationSummary } from '../../types/chat'
import ConversationList from './ConversationList'
import ConversationChat from './ConversationChat'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ChatPanelProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  messages: import('../../types/chat').DomainMessage[]
  isLoading: boolean
  socket: Socket | null
  currentUserId: string
  onSelect: (id: string | null) => void
  onSend: (content: string) => void
  onClose: () => void
}

export default function ChatPanel({
  conversations,
  selectedId,
  messages,
  isLoading,
  socket: _socket,
  currentUserId,
  onSelect,
  onSend,
  onClose,
}: ChatPanelProps) {
  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex h-full flex-col bg-white lg:flex-row">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 lg:hidden">
        <h2 className="text-sm font-semibold text-gray-900">Conversaciones</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="hidden border-r border-gray-200 lg:flex lg:w-20 lg:flex-col lg:items-center lg:pt-4 lg:gap-4">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <div className="h-6 w-px bg-gray-200" />
        <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Chats
        </span>
      </div>

      <div className={`flex-1 ${selectedConv ? 'hidden lg:flex' : 'flex'} flex-col`}>
        <div className="hidden border-b border-gray-200 px-4 py-3 lg:block">
          <h2 className="text-sm font-semibold text-gray-900">Conversaciones</h2>
        </div>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </div>

      <div
        className={`flex-1 flex-col ${
          selectedConv ? 'flex' : 'hidden lg:hidden'
        } lg:flex lg:border-l lg:border-gray-200`}
      >
        {selectedConv ? (
          <ConversationChat
            conversation={selectedConv}
            messages={messages}
            currentUserId={currentUserId}
            onBack={() => onSelect(null)}
            onSend={onSend}
          />
        ) : (
          <div className="hidden h-full items-center justify-center lg:flex">
            <p className="text-sm text-gray-400">Seleccioná una conversación</p>
          </div>
        )}
      </div>
    </div>
  )
}
