import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { MapPin, Loader } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  value: string
  onChange: (address: string, lat: number | null, lng: number | null) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
}

export default function AddressAutocomplete({ value, onChange, onFocus, onBlur, style }: Props) {
  const theme = useTheme()
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 4) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=5&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const handleSelect = (result: NominatimResult) => {
    onChange(result.display_name, parseFloat(result.lat), parseFloat(result.lon))
    setSuggestions([])
    setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px 12px 40px',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    border: `1px solid ${theme.border}`,
    background: theme.background,
    color: theme.primaryDark,
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    ...style,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: theme.muted, pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value, null, null)
            search(e.target.value)
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
          required
          style={inputStyle}
          autoComplete="off"
        />
        {loading && (
          <Loader style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: theme.muted, animation: 'spin 1s linear infinite' }} />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: theme.card, border: `1px solid ${theme.border}`,
          borderRadius: '12px', listStyle: 'none', margin: 0, padding: '4px',
          zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '220px', overflowY: 'auto',
        }}>
          {suggestions.map(s => (
            <li
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
                color: theme.primaryDark, cursor: 'pointer', display: 'flex',
                alignItems: 'flex-start', gap: '8px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = theme.hover }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <MapPin style={{ width: '14px', height: '14px', color: theme.accent, flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: '1.4' }}>{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
