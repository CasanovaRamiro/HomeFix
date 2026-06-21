import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt?: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export default function ImageModal({ src, alt, onClose, onPrev, onNext }: ImageModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
  }, [onClose, onPrev, onNext])

  return (
    <div className="img-modal-backdrop" onClick={onClose}>
      <button className="img-modal-close" onClick={onClose} aria-label="Cerrar">
        <X size={20} />
      </button>

      {onPrev && (
        <button className="img-modal-arrow img-modal-arrow--prev" onClick={(e) => { e.stopPropagation(); onPrev() }} aria-label="Anterior">
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        className="img-modal-img"
        src={src}
        alt={alt ?? 'Imagen'}
        onClick={(e) => e.stopPropagation()}
      />

      {onNext && (
        <button className="img-modal-arrow img-modal-arrow--next" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="Siguiente">
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  )
}
