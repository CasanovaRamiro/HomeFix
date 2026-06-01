import { useRef } from 'react'
import { ImagePlus, X, FileVideo } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
}

export default function FileUpload({ files, onFilesChange, maxFiles = 5 }: Props) {
  const theme = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = () => {
    if (files.length >= maxFiles) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const remaining = maxFiles - files.length
    onFilesChange([...files, ...selected.slice(0, remaining)])
    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleChange} />

      {files.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}>
          {files.map((file, i) => (
            <div key={i} style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '1',
              background: theme.background,
              border: `1px solid ${theme.border}`,
            }}>
              {file.type.startsWith('video/') ? (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '4px', padding: '8px',
                  color: theme.muted, fontSize: '12px', textAlign: 'center',
                }}>
                  <FileVideo style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: '100%',
                  }}>{file.name}</span>
                </div>
              ) : (
                <img src={URL.createObjectURL(file)} alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <button type="button" onClick={() => handleRemove(i)}
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
          ))}
        </div>
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
