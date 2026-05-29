import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  initialLat: number
  initialLng: number
  initialRadius: number
  onApply: (lat: number, lng: number, radius: number) => void
  onClear: () => void
  onClose: () => void
}

function DraggableMarker({
  position,
  onMove,
}: {
  position: L.LatLng
  onMove: (pos: L.LatLng) => void
}) {
  const markerRef = useRef<L.Marker>(null)
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current
      if (marker) onMove(marker.getLatLng())
    },
  }
  return <Marker ref={markerRef} position={position} draggable eventHandlers={eventHandlers} />
}

function MapClickHandler({ onClick }: { onClick: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function LocationFilterModal({
  initialLat,
  initialLng,
  initialRadius,
  onApply,
  onClear,
  onClose,
}: Props): JSX.Element {
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [radius, setRadius] = useState(initialRadius)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const center = L.latLng(lat, lng)

  const searchAddress = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=ar`,
      )
      const data: NominatimResult[] = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(val), 400)
  }

  const selectSuggestion = (result: NominatimResult) => {
    setLat(Number(result.lat))
    setLng(Number(result.lon))
    setQuery(result.display_name)
    setSuggestions([])
  }

  const handleMarkerMove = (pos: L.LatLng) => {
    setLat(pos.lat)
    setLng(pos.lng)
  }

  const handleMapClick = (pos: L.LatLng) => {
    setLat(pos.lat)
    setLng(pos.lng)
  }

  const handleClear = () => {
    onClear()
    onClose()
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="card modal-card location-filter-modal"
        role="dialog"
        aria-label="Filtro de ubicación"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="location-modal-header">
          <h2>Buscar por ubicación</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </div>

        <div className="location-search-box">
          <input
            type="text"
            placeholder="Buscar dirección…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
          {searching && <span className="location-searching">Buscando…</span>}
          {suggestions.length > 0 && (
            <ul className="location-suggestions">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => selectSuggestion(s)}>
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="location-map-container">
          <MapContainer center={center} zoom={12} style={{ height: '300px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={center} onMove={handleMarkerMove} />
            <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#2563eb', fillOpacity: 0.1 }} />
            <MapClickHandler onClick={handleMapClick} />
            <RecenterMap lat={lat} lng={lng} />
          </MapContainer>
        </div>

        <div className="location-radius-row">
          <label>
            Radio: <strong>{radius} km</strong>
          </label>
          <input
            type="range"
            min={1}
            max={200}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={handleClear}>
            Limpiar filtro
          </button>
          <button type="button" className="btn-accent" onClick={() => onApply(lat, lng, radius)}>
            Aplicar filtro
          </button>
        </div>
      </div>
    </div>
  )
}
