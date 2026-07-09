import { useEffect, useState } from 'react'
import ImageViewer from '../components/ImageViewer'
import { useParams, useNavigate } from 'react-router-dom'
import { getWorker, updateWorkerProfile, uploadImages, getWorkerReviews, downloadMatricula, type Worker, type WorkerReview } from '../services/api'
import { useCategories } from '../hooks/useCategories'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth, emitAuthChange } from '../hooks/useAuth'
import WorkerActions from '../components/worker/WorkerActions'
import {
  ArrowLeft, Camera, Save, X, Mail, Phone, Calendar,
  Briefcase, Star, CheckCircle, Timer, Edit3, Plus,
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
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
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [certPreviews, setCertPreviews] = useState<string[]>([])
  const [certTitle, setCertTitle] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certSaving, setCertSaving] = useState(false)
  const [editingCert, setEditingCert] = useState<string | null>(null)
  const [editCertTitle, setEditCertTitle] = useState('')
  const [editCertIssuer, setEditCertIssuer] = useState('')
  const [galFiles, setGalFiles] = useState<File[]>([])
  const [galPreviews, setGalPreviews] = useState<string[]>([])
  const [galSaving, setGalSaving] = useState(false)
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [matriculaSaving, setMatriculaSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.allSettled([
      getWorker(id),
      getWorkerReviews(id),
    ])
      .then(([workerResult, reviewsResult]) => {
        if (workerResult.status === 'rejected') {
          setError('No se encontró el trabajador.')
          return
        }
        const w = workerResult.value
        setWorker(w)
        setForm({ name: w.name, phone: w.phone ?? '', bio: w.bio ?? '' })
        setSelectedCategories(w.categories.map((c) => c.id))
        setFormAvailability(w.availability)
        setPhotoPreview(w.photo)
        if (reviewsResult.status === 'fulfilled') setReviews(reviewsResult.value)
      })
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

  const handleCertFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      const newFiles = Array.from(files)
      setCertFiles((prev) => [...prev, ...newFiles])
      setCertPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))])
    }
    e.target.value = ''
  }

  const getCertThumbnail = (url: string) => {
    if (url.endsWith('.pdf')) {
      return url.replace('/upload/', '/upload/w_120,h_120,c_fill/')
    }
    return url
  }

  const removeCertFile = (index: number) => {
    URL.revokeObjectURL(certPreviews[index])
    setCertFiles((prev) => prev.filter((_, i) => i !== index))
    setCertPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      const newFiles = Array.from(files)
      setGalFiles((prev) => [...prev, ...newFiles])
      setGalPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))])
    }
    e.target.value = ''
  }

  const removeGalFile = (index: number) => {
    URL.revokeObjectURL(galPreviews[index])
    setGalFiles((prev) => prev.filter((_, i) => i !== index))
    setGalPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadCert = async () => {
    if (!certFiles.length || !certTitle.trim() || !worker) return
    setCertSaving(true)
    try {
      const urls = await uploadImages(certFiles)
      const newCerts = urls.map((url) => ({ id: crypto.randomUUID(), title: certTitle.trim(), issuer: certIssuer.trim() || undefined, imageUrl: url }))
      const updated = await updateWorkerProfile(worker.id, { certificates: [...worker.certificates, ...newCerts] })
      setWorker(updated)
      setCertFiles([])
      setCertPreviews([])
      setCertTitle('')
      setCertIssuer('')
    } catch { setError('Error al subir certificados') }
    finally { setCertSaving(false) }
  }

  const startEditCert = (cert: { id: string; title: string; issuer: string | null }) => {
    setEditingCert(cert.id)
    setEditCertTitle(cert.title)
    setEditCertIssuer(cert.issuer ?? '')
  }

  const saveEditCert = async () => {
    if (!worker || !editingCert || !editCertTitle.trim()) return
    try {
      const updated = await updateWorkerProfile(worker.id, {
        certificates: worker.certificates.map((c) =>
          c.id === editingCert
            ? { ...c, title: editCertTitle.trim(), issuer: editCertIssuer.trim() || undefined }
            : c
        ),
      })
      setWorker(updated)
      setEditingCert(null)
    } catch { setError('Error al editar certificado') }
  }

  const cancelEditCert = () => setEditingCert(null)

  const removeCert = async (certId: string) => {
    if (!worker) return
    try {
      const updated = await updateWorkerProfile(worker.id, { certificates: worker.certificates.filter((c) => c.id !== certId) })
      setWorker(updated)
    } catch { setError('Error al eliminar certificado') }
  }

  const uploadGal = async () => {
    if (!galFiles.length || !worker) return
    setGalSaving(true)
    try {
      const urls = await uploadImages(galFiles)
      const newImages = urls.map((url) => ({ id: crypto.randomUUID(), imageUrl: url, caption: undefined as string | undefined }))
      const updated = await updateWorkerProfile(worker.id, { gallery: [...worker.gallery, ...newImages] })
      setWorker(updated)
      setGalFiles([])
      setGalPreviews([])
    } catch { setError('Error al subir imágenes') }
    finally { setGalSaving(false) }
  }

  const removeGal = async (imageId: string) => {
    if (!worker) return
    try {
      const updated = await updateWorkerProfile(worker.id, { gallery: worker.gallery.filter((g) => g.id !== imageId) })
      setWorker(updated)
    } catch { setError('Error al eliminar imagen') }
  }

  const handleMatriculaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setMatriculaFile(file)
    }
    e.target.value = ''
  }

  const uploadMatricula = async () => {
    if (!matriculaFile || !worker) return
    setMatriculaSaving(true)
    try {
      const urls = await uploadImages([matriculaFile])
      const updated = await updateWorkerProfile(worker.id, { matriculaUrl: urls[0] })
      setWorker(updated)
      setMatriculaFile(null)
    } catch {
      setError('Error al subir matrícula')
    } finally {
      setMatriculaSaving(false)
    }
  }

  const removeMatricula = async () => {
    if (!worker) return
    try {
      const updated = await updateWorkerProfile(worker.id, { matriculaUrl: null })
      setWorker(updated)
    } catch {
      setError('Error al eliminar matrícula')
    }
  }

  const handleDownloadMatricula = async () => {
    if (!worker?.matriculaUrl) return
    try {
      const blob = await downloadMatricula(worker.matriculaUrl)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'matricula.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      setError('Error al descargar matrícula')
    }
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
    if (selectedCategories.length === 0) {
      setError('Debes seleccionar al menos un rubro de trabajo.')
      return
    }
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

            {/* Documentos y Validaciones */}
            {isOwner && (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Documentos y Validaciones</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 12 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Domicilio</span>
                    <button
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#10B981', border: 'none',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                        padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                        minWidth: 160,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
                    >
                      Editar
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 12 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Antecedentes</span>
                    <button
                      type="button"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#10B981', border: 'none',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                        padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                        minWidth: 160,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
                    >
                      Cargar Antecedentes
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 12 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Matrícula</span>
                    {worker.matriculaUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                           onClick={handleDownloadMatricula}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#EFF6FF', border: '1px solid #BFDBFE',
                            color: '#2563EB', fontSize: 13, fontWeight: 600,
                            padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                          }}
                        >
                          Descargar PDF
                        </button>
                        <button
                          type="button"
                          onClick={removeMatricula}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#FEE2E2', border: 'none',
                            color: '#DC2626', fontSize: 13, fontWeight: 600,
                            padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : matriculaFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>{matriculaFile.name}</span>
                        <button
                          type="button"
                          onClick={uploadMatricula}
                          disabled={matriculaSaving}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: '#10B981', border: 'none',
                            color: '#fff', fontSize: 13, fontWeight: 600,
                            padding: '9px 16px', borderRadius: 10,
                            cursor: matriculaSaving ? 'not-allowed' : 'pointer',
                            opacity: matriculaSaving ? 0.6 : 1,
                          }}
                        >
                          {matriculaSaving ? 'Subiendo...' : 'Subir'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatriculaFile(null)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#F3F4F6', border: 'none',
                            color: '#374151', fontSize: 13, fontWeight: 600,
                            padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <label
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          background: '#10B981', border: 'none',
                          color: '#fff', fontSize: 13, fontWeight: 600,
                          padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                          minWidth: 160,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
                      >
                        Cargar Matrícula
                        <input type="file" accept="application/pdf" onChange={handleMatriculaFile} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {(worker.categories.length > 0 || isEditing) && (
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

            {!isEditing && (
              <WorkerActions workerId={worker.id} initialEnabled={worker.emergenciesEnabled} />
            )}

            {/* Gallery */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Galería de Trabajos</h3>
              {worker.gallery?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {worker.gallery.map((img) => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img src={img.imageUrl} alt={img.caption ?? ''} onClick={() => setZoomedImage(img.imageUrl)} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }} />
                      {img.caption && <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>{img.caption}</p>}
                      {isEditing && (
                        <button onClick={() => removeGal(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <label style={{
                      width: 80, height: 80, borderRadius: 10, border: '2px dashed #D1D5DB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: '#F9FAFB',
                    }}>
                      <Plus size={24} color="#9CA3AF" />
                      <input type="file" accept="image/*" multiple onChange={handleGalFiles} style={{ display: 'none' }} />
                    </label>
                    {galPreviews.map((preview, i) => (
                      <div key={preview} style={{ position: 'relative', width: 80, height: 80 }}>
                        <img src={preview} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                        <button onClick={() => removeGalFile(i)} style={{
                          position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                          background: '#EF4444', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                  {galFiles.length > 0 && (
                    <button onClick={uploadGal} disabled={galSaving} style={{
                      alignSelf: 'flex-start', padding: '8px 20px', background: '#10B981', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: galSaving ? 'not-allowed' : 'pointer', opacity: galSaving ? 0.6 : 1,
                    }}>
                      {galSaving ? 'Subiendo...' : `Subir ${galFiles.length} imagen${galFiles.length > 1 ? 'es' : ''}`}
                    </button>
                  )}
                </div>
              )}
              {!isEditing && worker.gallery?.length === 0 && (
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0, padding: '12px 0' }}>Sin imágenes</p>
              )}
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

            {/* Certificates */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Certificaciones</h3>
              {worker.certificates?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {worker.certificates.map((c) => {
                    const isPdf = c.imageUrl?.endsWith('.pdf')
                    const isEditingCert = editingCert === c.id
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, background: '#F9FAFB', borderRadius: 12 }}>
                        <img src={getCertThumbnail(c.imageUrl)} alt={c.title} onClick={() => !isPdf && setZoomedImage(c.imageUrl)} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: isPdf ? 'default' : 'pointer' }} />
                        <div style={{ flex: 1 }}>
                          {isEditing && isEditingCert ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input value={editCertTitle} onChange={(e) => setEditCertTitle(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }} />
                              <input value={editCertIssuer} onChange={(e) => setEditCertIssuer(e.target.value)} placeholder="Institución" style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }} />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={saveEditCert} disabled={!editCertTitle.trim()} style={{ padding: '4px 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                                <button onClick={cancelEditCert} style={{ padding: '4px 12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p style={{ fontWeight: 600, color: '#111827', fontSize: 14, margin: 0 }}>{c.title}</p>
                              {c.issuer && <p style={{ color: '#6B7280', fontSize: 13, margin: '2px 0 0' }}>{c.issuer}</p>}
                            </>
                          )}
                        </div>
                        {isEditing && !isEditingCert && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => startEditCert(c)} style={{ background: '#EFF6FF', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#2563EB', fontSize: 12, fontWeight: 600 }}>
                              Editar
                            </button>
                            <button onClick={() => removeCert(c.id)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {isEditing && editingCert === null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <label style={{
                      width: 80, height: 80, borderRadius: 10, border: '2px dashed #D1D5DB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: '#F9FAFB',
                    }}>
                      <Plus size={24} color="#9CA3AF" />
                      <input type="file" accept="image/*,application/pdf" multiple onChange={handleCertFiles} style={{ display: 'none' }} />
                    </label>
                    {certPreviews.map((preview, i) => {
                      const isPdf = certFiles[i]?.type === 'application/pdf'
                      return (
                        <div key={preview} style={{ position: 'relative', width: 80, height: 80 }}>
                          {isPdf ? (
                            <div style={{ width: '100%', height: '100%', borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#DC2626' }}>PDF</div>
                          ) : (
                            <img src={preview} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                          )}
                          <button onClick={() => removeCertFile(i)} style={{
                            position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                            background: '#EF4444', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}>×</button>
                        </div>
                      )
                    })}
                  </div>
                  <input type="text" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Título del certificado" style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }} />
                  <input type="text" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} placeholder="Institución (opcional)" style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }} />
                  <button onClick={uploadCert} disabled={!certFiles.length || !certTitle.trim() || certSaving} style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: certSaving ? 'not-allowed' : 'pointer', opacity: certSaving ? 0.6 : 1 }}>
                    {certSaving ? 'Subiendo...' : `Subir ${certFiles.length} certificado${certFiles.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
              {!isEditing && worker.certificates?.length === 0 && (
                <p style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', margin: 0, padding: '12px 0' }}>Sin certificaciones</p>
              )}
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
      {zoomedImage && <ImageViewer src={zoomedImage} alt="Galería" onClose={() => setZoomedImage(null)} />}
    </div>
  )
}
