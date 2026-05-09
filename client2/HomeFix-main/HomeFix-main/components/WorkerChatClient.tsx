'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface WorkerChatClientProps {
  workerName: string
}

export function WorkerChatClient({ workerName }: WorkerChatClientProps) {
  const [showChat, setShowChat] = useState(false)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'worker'; text: string }>>([])

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([
        ...chatMessages,
        { sender: 'user', text: message }
      ])
      setMessage('')

      // Simulate response
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { sender: 'worker', text: `Hola! Gracias por tu mensaje. ¿En qué puedo ayudarte hoy?` }
        ])
      }, 800)
    }
  }

  if (showChat) {
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => setShowChat(false)}
        >
          Cerrar Chat
        </Button>

        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground">Chat con {workerName}</h2>

          <div className="bg-background border border-border rounded-lg p-4 h-64 overflow-y-auto space-y-3 mb-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Inicia una conversación...</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary/90"
            >
              Enviar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Button
      size="lg"
      className="w-full bg-primary hover:bg-primary/90"
      onClick={() => setShowChat(true)}
    >
      Chat Ahora
    </Button>
  )
}
