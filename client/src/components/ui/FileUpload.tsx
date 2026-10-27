import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, X, Maximize2 } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import ImageModal from './ImageModal'

const MAX_FILE_SIZE_MB = 100
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface Props {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
}

export default function FileUpload({ files, onFilesChange, maxFiles = 5 }: Props) {
  const theme = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sizeError, setSizeError] = useState('')
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleSelect = () => {
    if (files.length >= maxFiles) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE_BYTES)
    const valid = selected.filter((f) => f.size <= MAX_FILE_SIZE_BYTES)

    if (oversized.length > 0) {
      setSizeError(`El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE_MB} MB.`)
    } else {
      setSizeError('')
    }

    if (valid.length > 0) {
      const remaining = maxFiles - files.length
      onFilesChange([...files, ...valid.slice(0, remaining)])
    }
    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    setSizeError('')
    if (previewIndex === index) setPreviewIndex(null)
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleChange} />

      {sizeError && (
        <p style={{
          margin: '0 0 12px', padding: '10px 12px', borderRadius: '8px',
          fontSize: '13px', background: '#FEF2F2', color: '#DC2626',
          border: '1px solid #FECACA',
        }}>
          {sizeError}
        </p>
      )}

      {files.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}>
          {files.map((file, i) => {
            const isVideo = file.type.startsWith('video/')
            return (
              <div key={`${file.name}-${file.lastModified}-${i}`} style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '1',
                background: isVideo ? '#000' : theme.background,
                border: `1px solid ${theme.border}`,
              }}>
                {isVideo ? (
                  <>
                    <video
                      src={previewUrls[i]}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      aria-label="Ampliar video"
                      style={{
                        position: 'absolute', top: '4px', left: '4px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: 'none', background: 'rgba(0,0,0,0.55)',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        padding: 0, lineHeight: 1,
                      }}
                    >
                      <Maximize2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  </>
                ) : (
                  <img
                    src={previewUrls[i]}
                    alt={file.name}
                    onClick={() => setPreviewIndex(i)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                  />
                )}
                <button type="button" onClick={() => handleRemove(i)}
                  aria-label="Eliminar archivo"
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.55)',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1,
                  }}>
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {previewIndex !== null && files[previewIndex] && (
        <ImageModal
          src={previewUrls[previewIndex]}
          alt={files[previewIndex].name}
          type={files[previewIndex].type.startsWith('video/') ? 'video' : 'image'}
          onClose={() => setPreviewIndex(null)}
          onPrev={previewIndex > 0 ? () => setPreviewIndex(previewIndex - 1) : undefined}
          onNext={previewIndex < files.length - 1 ? () => setPreviewIndex(previewIndex + 1) : undefined}
        />
      )}

      {files.length < maxFiles && (
        <button type="button" onClick={handleSelect}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px',
            border: `2px dashed ${theme.border}`,
            background: theme.card, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', fontSize: '14px', color: theme.muted,
            transition: 'all 0.3s', boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
        >
          <ImagePlus style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          Agregar fotos / videos
        </button>
      )}
    </div>
  )
}
