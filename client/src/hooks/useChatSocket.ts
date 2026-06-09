import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { env } from '../lib/envConfig'

export function useChatSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('token'))
    window.addEventListener('auth-change', handler)
    return () => window.removeEventListener('auth-change', handler)
  }, [])

  useEffect(() => {
    if (!token) return

    const s = io(env.VITE_API_URL, {
      auth: { token },
      transports: ['polling'],
    })

    s.on('connect', () => {
      setIsConnected(true)
      setSocket(s)
    })
    s.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      s.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [token])

  return { socket, isConnected }
}
