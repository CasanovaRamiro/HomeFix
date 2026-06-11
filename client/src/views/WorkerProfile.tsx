import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorker, updateWorkerProfile, uploadImages, getWorkerReviews, type Worker, type WorkerReview } from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth, emitAuthChange } from '../hooks/useAuth'
import {
  ArrowLeft, Camera, Save, X, Mail, Phone, Calendar,
  Briefcase, Star, CheckCircle, Timer, Edit3,
} from 'lucide-react'

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { categories: allCategories } = useCategories()
  const isOwner = user?.id === id

  const [worker, setWorker] = useState<Worker | null>(null)
  const [reviews, setReviews] = useState<WorkerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [formAvailability, setFormAvailability] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      getWorker(id),
      getWorkerReviews(id),
    ])
      .then(([w, r]) => {
        setWorker(w)
        setReviews(r)
        setForm({ name: w.name, phone: w.phone ?? '', bio: w.bio ?? '' })
        setSelectedCategories(w.categories.map((c) => c.id))
        setFormAvailability(w.availability)
        setPhotoPreview(w.photo)
      })
      .catch(() => setError('No se encontró el trabajador.'))
      .finally(() => setLoading(false))
  }, [id])

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const toggleDay = (day: string) => {
    setFormAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!worker) return
    setSaving(true)
    setError(null)
    try {
      let photoUrl: string | null = worker.photo
      if (photoFile) {
        const urls = await uploadImages([photoFile])
        photoUrl = urls[0]
      }
      const updated = await updateWorkerProfile(worker.id, {
        name: form.name,
        phone: form.phone || null,
        bio: form.bio || null,
        photo: photoUrl,
        categoryIds: selectedCategories,
        availability: formAvailability,
      })
      setWorker(updated)
      setPhotoFile(null)
      setIsEditing(false)
      const stored = localStorage.getItem('user')
      if (stored) {
        const userData = JSON.parse(stored)
        if (form.name !== worker.name) userData.name = form.name
        if (photoUrl !== worker.photo) userData.photo = photoUrl
        localStorage.setItem('user', JSON.stringify(userData))
        emitAuthChange()
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al guardar cambios.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (!worker) return
    setForm({ name: worker.name, phone: worker.phone ?? '', bio: worker.bio ?? '' })
    setSelectedCategories(worker.categories.map((c) => c.id))
    setFormAvailability(worker.availability)
    setPhotoPreview(worker.photo)
    setPhotoFile(null)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#6B7280' }}>Cargando...</p>
      </div>
    )
  }

  if (error && !worker) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error}</p>
      </div>
    )
  }

  if (!worker) return null

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = new Date(worker.createdAt).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui, sans-serif' }}>

      {/* Dark header */}
      <div style={{ background: '#0F172A', width: '100%' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: isMobile ? '14px 16px' : '20px 24px' }}>
          <button
            onClick={() => navigate(isOwner ? '/worker' : -1 as never)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
              padding: 0, marginBottom: 12, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            {isOwner ? 'Volver al Dashboard' : 'Volver'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: '#fff', margin: 0 }}>
              {isOwner ? 'Mi Perfil' : 'Perfil'}
            </h1>
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                }}
              >
                <Edit3 size={15} />
                Editar Perfil
              </button>
            )}
            {isOwner && isEditing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={cancelEdit}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: 13, fontWeight: 500,
                    padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#10B981', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    padding: '9px 16px', borderRadius: 10,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Save size={14} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 1024, margin: '16px auto 0', padding: '0 16px' }}>
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 16px', borderRadius: 10, fontSize: 14 }}>
            {error}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Basic info card */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start', gap: 20 }}>
                {/* Profile image */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={worker.name}
                      style={{ width: 112, height: 112, borderRadius: 16, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 112, height: 112, borderRadius: 16,
                      background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, fontWeight: 700, color: '#374151',
                    }}>
                      {initials}
                    </div>
                  )}
                  {isEditing && (
                    <label style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#10B981', border: '3px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>
                      <Camera size={14} color="#fff" />
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                  )}
                  {!isEditing && worker.photo && (
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 24, height: 24, borderRadius: '50%',
                      background: '#10B981', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CheckCircle size={12} color="#fff" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, width: '100%' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre completo</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            border: '1px solid #D1D5DB', fontSize: 14, color: '#111827',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Teléfono</label>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            border: '1px solid #D1D5DB', fontSize: 14, color: '#111827',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{worker.name}</h2>
                      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 16px', textTransform: 'capitalize' }}>Trabajador</p>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={14} color="#6B7280" />
                          </div>
                          {worker.email}
                        </div>
                        {worker.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280' }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Phone size={14} color="#6B7280" />
                            </div>
                            {worker.phone}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={14} color="#6B7280" />
                          </div>
                          Miembro desde {memberSince}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            {worker.categories.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Categorías</h3>
                {isEditing && (
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>Seleccioná las categorías en las que trabajás.</p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(isEditing ? allCategories : worker.categories).map((cat: { id: string; name: string }) => {
                    const catId = cat.id
                    const catName = cat.name
                    const selected = isEditing ? selectedCategories.includes(catId) : true
                    return (
                      <span
                        key={catId}
                        onClick={() => isEditing && toggleCategory(catId)}
                        style={{
                          padding: '8px 16px', borderRadius: 999,
                          border: selected ? '1px solid #10B981' : '1px solid #D1D5DB',
                          background: selected ? '#D1FAE5' : '#fff',
                          color: selected ? '#065F46' : '#374151',
                          fontSize: 13, fontWeight: 600,
                          cursor: isEditing ? 'pointer' : 'default',
                        }}
                      >
                        {catName}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bio */}
            {(isEditing || worker.bio) && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Sobre mí</h3>
                {isEditing ? (
                  <>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Contale a los clientes sobre tu experiencia, especialidad y servicios..."
                      style={{
                        width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 10,
                        border: '1px solid #D1D5DB', fontSize: 14, color: '#111827',
                        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0', textAlign: 'right' }}>{form.bio.length} caracteres</p>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{worker.bio}</p>
                )}
              </div>
            )}

            {/* Availability */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Disponibilidad</h3>
              {isEditing && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>Seleccioná los días que trabajás.</p>
              )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                    const available = worker.availability.includes(day)
                    const selected = isEditing ? formAvailability.includes(day) : available
                    return (
                      <div
                        key={day}
                        onClick={() => isEditing && toggleDay(day)}
                        style={{
                          padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                          fontSize: 12, fontWeight: 600,
                          background: selected ? '#10B981' : '#F3F4F6',
                          color: selected ? '#fff' : '#9CA3AF',
                          cursor: isEditing ? 'pointer' : 'default',
                          transition: 'all 0.15s',
                        }}
                      >
                        {day.substring(0, 3)}
                      </div>
                    )
                  })}
                </div>
              </div>

            {/* Reviews */}
            {!isEditing && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Reseñas Recientes</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={16} color="#10B981" fill="#10B981" />
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{avgRating.toFixed(1)}</span>
                    <span style={{ color: '#9CA3AF', fontSize: 13 }}>({reviews.length})</span>
                  </div>
                </div>
                {reviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {reviews.slice(0, 5).map((r) => (
                      <div key={r.id} style={{ paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ fontWeight: 600, color: '#111827', fontSize: 14, margin: 0 }}>{r.reviewer.name}</p>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} size={12} color={i <= r.rating ? '#10B981' : '#D1D5DB'} fill={i <= r.rating ? '#10B981' : 'none'} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{r.description}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>{new Date(r.createdAt).toLocaleDateString('es-AR')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0, padding: '24px 0' }}>
                    No hay reseñas aún
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats card */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Estadísticas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Trabajos Completados', value: reviews.length > 0 ? String(reviews.length) : '—', icon: Briefcase },
                  { label: 'Calificación', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star },
                  { label: 'Tasa de Respuesta', value: '—', icon: CheckCircle },
                  { label: 'Tiempo de Respuesta', value: '—', icon: Timer },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color="#6B7280" />
                      </div>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card (only for owner) */}
            {isOwner && !isEditing && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Vista previa</h3>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>Así ven los clientes tu perfil público.</p>
                <button
                  onClick={() => navigate(`/profile/worker/${worker.id}`)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    border: '1px solid #D1D5DB', background: '#fff',
                    color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Ver mi perfil público
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
