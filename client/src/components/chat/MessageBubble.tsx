import type { DomainMessage } from '../../types/chat'

interface MessageBubbleProps {
  message: DomainMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isOwn
            ? 'bg-[#DCF8C6] text-gray-900 rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-gray-400">{time}</span>
          {isOwn && message.readAt && (
            <svg className="w-3.5 h-3.5 text-[#34B7F1]" viewBox="0 0 16 11" fill="currentColor">
              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.337.153.531.531 0 0 0-.139.356c0 .136.047.254.14.356l2.405 2.508a.523.523 0 0 0 .355.153.452.452 0 0 0 .349-.178l6.506-8.027a.554.554 0 0 0 .115-.336.53.53 0 0 0-.152-.349zm-2.47 0a.457.457 0 0 0-.305-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.01-2.095a.463.463 0 0 0-.337-.153.457.457 0 0 0-.337.153.531.531 0 0 0-.139.356c0 .136.047.254.14.356l2.405 2.508a.523.523 0 0 0 .355.153.452.452 0 0 0 .349-.178l6.506-8.027a.554.554 0 0 0 .115-.336.53.53 0 0 0-.152-.349z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
