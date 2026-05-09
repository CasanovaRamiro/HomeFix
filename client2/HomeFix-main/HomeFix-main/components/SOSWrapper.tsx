'use client'

import { useEffect, useState } from 'react'
import { SOS } from '@/components/SOS'

export function SOSWrapper() {
  const [showSOS, setShowSOS] = useState(true)

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem('homefix_session') || '{}')
      // Ocultar SOS si el usuario es trabajador
      if (session.role === 'trabajador') {
        setShowSOS(false)
      }
    } catch {
      // Si no hay sesión, mostrar SOS (cliente público)
      setShowSOS(true)
    }
  }, [])

  return <SOS showForTrabajador={showSOS} />
}
