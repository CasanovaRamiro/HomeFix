import { useState, useRef, useEffect } from 'react'
import { sendMessage, type AiMessage, type AiSuggestionData } from '../services/diagnostico'

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useDiagnosisChat(onSuggestion?: (data: AiSuggestionData) => void) {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AiSuggestionData | null>(null)
  const [conversationDone, setConversationDone] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (chatEndRef.current?.parentElement) {
      chatEndRef.current.parentElement.scrollTop = chatEndRef.current.parentElement.scrollHeight
    }
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

  const handleSend = async (imageFile?: File) => {
    const text = input.trim()
    if ((!text && !imageFile) || loading) return

    let imageBase64: string | undefined
    let mimeType: string | undefined
    if (imageFile) {
      const result = await fileToBase64(imageFile)
      imageBase64 = result.base64
      mimeType = result.mimeType
    }

    setInput('')
    const userMsg: AiMessage = {
      role: 'user',
      text,
      ...(imageBase64 && mimeType ? { imageBase64, mimeType } : {}),
    }
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

  const handleKeyDown = (e: React.KeyboardEvent, imageFile?: File) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(imageFile)
    }
  }

  return {
    messages, input, setInput,
    loading, suggestion, conversationDone,
    chatEndRef, handleSend, handleKeyDown,
  }
}
