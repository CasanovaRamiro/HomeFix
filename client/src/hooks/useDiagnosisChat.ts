import { useState, useRef, useEffect } from 'react'
import { sendMessage, type AiMessage, type AiSuggestionData } from '../services/diagnostico'

export function useDiagnosisChat(onSuggestion?: (data: AiSuggestionData) => void) {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AiSuggestionData | null>(null)
  const [conversationDone, setConversationDone] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const init = async () => {
      setLoading(true)
      try {
        const msgs: AiMessage[] = [{ role: 'user', text: 'Hola, necesito ayuda con un problema en mi hogar' }]
        setMessages(msgs)
        const res = await sendMessage(msgs)
        if (res.type === 'question') {
          setMessages(p => [...p, { role: 'model', text: res.text }])
        }
      } catch {
        setMessages(p => [...p, { role: 'model', text: 'Lo siento, hubo un error al conectar con el asistente.' }])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: AiMessage = { role: 'user', text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await sendMessage(updated)
      if (res.type === 'question') {
        setMessages(p => [...p, { role: 'model', text: res.text }])
      } else {
        setMessages(p => [...p, { role: 'model', text: '¡Genial! He identificado tu problema. Revisá el resultado abajo.' }])
        setSuggestion(res.data)
        setConversationDone(true)
        onSuggestion?.(res.data)
      }
    } catch {
      setMessages(p => [...p, { role: 'model', text: 'Lo siento, hubo un error. Intentá de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return {
    messages, input, setInput,
    loading, suggestion, conversationDone,
    chatEndRef, handleSend, handleKeyDown,
  }
}
