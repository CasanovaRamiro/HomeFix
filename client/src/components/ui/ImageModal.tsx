import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt?: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

const isVideoUrl = (url: string) => {
  const lower = url.toLowerCase()
  return lower.includes('/video/upload/') || lower.match(/\.(mp4|webm|mov|mkv|avi|m4v|ogg)(\?|#|$)/) !== null
}

export default function ImageModal({ src, alt, onClose, onPrev, onNext }: ImageModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const [isVideo, setIsVideo] = useState(isVideoUrl(src))

  useEffect(() => {
    setIsVideo(isVideoUrl(src))
  }, [src])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const videos = Array.from(document.querySelectorAll('video'))
    videos.forEach((v) => {
      try {
        if (!v.paused) v.pause()
      } catch {
        // ignore
      }
    })
    if (isVideo && videoRef.current) {
      try {
        void videoRef.current.play().catch(() => {
          // ignore
        })
      } catch {
        // ignore
      }
    }
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    document.addEventListener('keydown', handler)
    const videoEl = videoRef.current
    return (): void => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
      if (videoEl) {
        try {
          videoEl.pause()
        } catch {
          // ignore
        }
      }
    }
  }, [onClose, onPrev, onNext, isVideo, src])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    if (distance > minSwipeDistance) {
      onNext?.()
    } else if (distance < -minSwipeDistance) {
      onPrev?.()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="img-modal-backdrop" onClick={onClose} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <button className="img-modal-close" onClick={onClose} aria-label="Cerrar">
        <X size={20} />
      </button>

      {onPrev && (
        <button className="img-modal-arrow img-modal-arrow--prev" onClick={(e) => { e.stopPropagation(); onPrev() }} aria-label="Anterior">
          <ChevronLeft size={28} />
        </button>
      )}

      {isVideo ? (
        <video
          ref={videoRef}
          className="img-modal-img"
          src={src}
          controls
          playsInline
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: 'calc(100vw - 160px)' }}
        />
      ) : (
      <img
        className="img-modal-img"
        src={src}
        alt={alt ?? 'Imagen'}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: 'calc(100vw - 160px)' }}
      />
      )}

      {onNext && (
        <button className="img-modal-arrow img-modal-arrow--next" onClick={(e) => { e.stopPropagation(); onNext() }} aria-label="Siguiente">
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  )
}
