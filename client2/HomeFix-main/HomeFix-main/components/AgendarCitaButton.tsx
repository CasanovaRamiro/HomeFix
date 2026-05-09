'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface AgendarCitaButtonProps {
  workerId: string
  workerName: string
  size?: 'sm' | 'lg' | 'default'
}

export function AgendarCitaButton({ workerId, workerName, size = 'default' }: AgendarCitaButtonProps) {
  const router = useRouter()

  return (
    <Button
      size={size}
      className="w-full bg-accent hover:bg-accent/90 text-white font-semibold gap-2"
      onClick={() => router.push(`/agendar/${workerId}?nombre=${encodeURIComponent(workerName)}`)}
    >
      <Calendar className="w-4 h-4" />
      Agendar Cita
    </Button>
  )
}
