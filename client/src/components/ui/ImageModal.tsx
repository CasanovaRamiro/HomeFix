import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { isVideoUrl } from '../../lib/post'

interface ImageModalProps {
  src: string
  alt?: string
  type?: 'image' | 'video'
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export default function ImageModal({ src, alt, type, onClose, onPrev, onNext }: ImageModalProps) {
  const resolvedType = type ?? (isVideoUrl(src) ? 'video' : 'image')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    document.querySelectorAll('video').forEach((v) => {
      if (v !== videoRef.current) v.pause()
    })
  }, [src])

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

  return createPortal(
    <div className="img-modal-backdrop" onClick={onClose}>
      <button className="img-modal-close" onClick={onClose} aria-label="Cerrar">
        <X size={20} />
      </button>

      {onPrev && (
        <button className="img-modal-arrow img-modal-arrow--prev" onClick={(e) => { e.stopPropagation(); onPrev() }} aria-label="Anterior">
          <ChevronLeft size={28} />
        </button>
      )}

      {resolvedType === 'video' ? (
        <video
          ref={videoRef}
          className="img-modal-img"
          src={src}
          aria-label={alt ?? 'Video'}
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'block',
            margin: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: 12,
            objectFit: 'contain',
          }}
        />
      ) : (
        <img
          className="img-modal-img"
          src={src}
          alt={alt ?? 'Imagen'}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {onNext && (
        <button className="img-modal-arrow img-modal-arrow--next" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="Siguiente">
          <ChevronRight size={28} />
        </button>
      )}
    </div>,
    document.body,
  )
}
