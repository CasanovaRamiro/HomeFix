import { useState, useCallback, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useConversations } from '../../hooks/useConversations'
import ChatPanel from './ChatPanel'

export default function ChatWidget() {
  const { isLoggedIn, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const { socket } = useChatSocket()

  const {
    conversations,
    selectedId,
    messages,
    isLoading,
    totalUnread,
    selectConversation,
    sendMessage,
    refetch,
  } = useConversations(isLoggedIn ? socket : null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conversationId: string }
      setIsOpen(true)
      selectConversation(detail.conversationId)
      refetch()
    }
    window.addEventListener('chat:open', handler)
    return () => window.removeEventListener('chat:open', handler)
  }, [selectConversation, refetch])

  const handleSend = useCallback(
    async (content: string) => {
      sendMessage(content)
    },
    [sendMessage],
  )

  if (!isLoggedIn || !user) return null

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end lg:items-end">
          <div
            className="fixed inset-0 bg-black/30 lg:bg-transparent"
            onClick={() => {
              setIsOpen(false)
              selectConversation(null)
            }}
          />

          <div className="relative z-10 flex h-full w-full flex-col bg-white shadow-xl lg:mb-20 lg:mr-4 lg:h-[600px] lg:max-h-[80vh] lg:w-[800px] lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-2xl">
            <ChatPanel
              conversations={conversations}
              selectedId={selectedId}
              messages={messages}
              isLoading={isLoading}
              socket={socket}
              currentUserId={user.id}
              onSelect={selectConversation}
              onSend={handleSend}
              onClose={() => {
                setIsOpen(false)
                selectConversation(null)
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </>
  )
}
