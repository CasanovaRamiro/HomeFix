import { ArrowLeft } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  children?: ReactNode
}

export default function BackButton({ children = 'Volver al panel' }: BackButtonProps): ReactElement {
  const navigate = useNavigate()

  return (
    <button className="pd-hero-back" onClick={() => { void navigate(-1) }}>
      <ArrowLeft size={15} />
      {children}
    </button>
  )
}
