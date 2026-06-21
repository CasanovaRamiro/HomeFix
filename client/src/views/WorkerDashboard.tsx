import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, Send, CalendarCheck, TrendingUp, Star,
  CheckCircle2, User, MapPin, AlertCircle, X, Clock, XCircle,
  ChevronRight, Shield, MessageSquare, FileText, GitBranch,
  Navigation,
} from 'lucide-react'
import api from '../services/api'
import LandingFooter from '../components/landing/LandingFooter'
import { fetchEmergencyPosts, searchPostsByLocation } from '../services/posts'
import { applyToPost } from '../services/applications'
import type { Post } from '../types/post'
import { useAuth } from '../hooks/useAuth'
import { postToTrabajo } from '../lib/post'
import ApplyModal, { type ApplicationFormData } from '../components/worker/ApplyModal'
import TrabajoCard from '../components/worker/TrabajoCard'
import { fetchKycStatus, type KycStatus } from '../services/kyc'
import type { LocationFilter } from '../components/worker/types'
import TelegramLinkCard from '../components/dashboard/TelegramLinkCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardProfile {
  id: string
  name: string
  surname: string
  email: string
  phone: string | null
  bio: string | null
  photo: string | null
  createdAt: string
  location: string | null
  categories: { id: string; name: string }[]
  emergenciesEnabled: boolean
}

interface DashboardStats {
  totalJobs: number
  reviewCount: number
  avgRating: number
  newJobs: number
  pendingApplications: number
  upcomingAppointments: number
  responseRate: number
}

interface DashboardData {
  profile: DashboardProfile
  stats: DashboardStats
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string, surname?: string): string {
  const first = name?.charAt(0) ?? ''
  const last = surname?.charAt(0) ?? ''
  return (first + last).toUpperCase() || 'U'
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ProfileHeader({ profile, stats }: { profile: DashboardProfile; stats: DashboardStats }) {
  const navigate = useNavigate()
  const firstName = profile.name.split(' ')[0]
  const categoryText = profile.categories.length > 0
    ? profile.categories.map((c) => c.name).join(' · ')
    : 'Profesional'
  const locationText = profile.location?.trim().replace(/,+$/, '').trim() || null

  return (
    <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
      <div className="wd-header-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div className="wd-header-row">

          {/* Left: Avatar + Info */}
          <div className="wd-left-info">
            {/* Avatar */}
            <div className="wd-profile-avatar">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  border: '3px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                }}>
                  {getInitials(profile.name, profile.surname)}
                </div>
              )}
            </div>

            {/* Name & details */}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Hola, {firstName}
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                {categoryText}{locationText ? ` · ${locationText}` : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {/* Verified badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                }}>
                  <CheckCircle2 size={13} />
                  Verificado
                </span>
                {/* Rating */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
                  <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                  <span style={{ color: '#64748B', fontWeight: 400 }}>
                    ({stats.reviewCount} reseñas)
                  </span>
                </span>
                {/* Total jobs */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 13 }}>
                  <Briefcase size={13} />
                  {stats.totalJobs} trabajos
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="wd-action-buttons">
            <button
              onClick={() => navigate(`/worker/${profile.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#E2E8F0', fontSize: 13, fontWeight: 600,
                padding: '10px 18px', borderRadius: 10,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <User size={15} />
              Mi Perfil
            </button>
            <button
              onClick={() => navigate('/worker/available-jobs')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#10B981', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 600,
                padding: '10px 18px', borderRadius: 10,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
            >
              <Briefcase size={15} />
              Ver Trabajos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: typeof Briefcase
  iconColor: string
  iconBg: string
  value: number | string
  label: string
}) {
  return (
    <div className="wd-metric-card"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'default',
      }}
    >
      <div className="wd-metric-icon" style={{
        width: 48, height: 48, borderRadius: 12,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={iconColor} className="wd-metric-icon-svg" />
      </div>
      <div>
        <p className="wd-metric-value" style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
        <p className="wd-metric-label" style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function MetricsStrip({ stats }: { stats: DashboardStats }) {
  return (
    <div className="wd-section" style={{
      maxWidth: 1280, margin: '0 auto', padding: '0 32px',
      marginTop: -28, position: 'relative', zIndex: 10,
    }}>
      <div className="wd-metrics-grid">
        <MetricCard
          icon={Briefcase}
          iconColor="#10B981"
          iconBg="rgba(16, 185, 129, 0.1)"
          value={stats.newJobs}
          label="Trabajos Nuevos"
        />
        <MetricCard
          icon={Send}
          iconColor="#6366F1"
          iconBg="rgba(99, 102, 241, 0.1)"
          value={stats.pendingApplications}
          label="Postulaciones"
        />
        <MetricCard
          icon={CalendarCheck}
          iconColor="#F59E0B"
          iconBg="rgba(245, 158, 11, 0.1)"
          value={stats.upcomingAppointments}
          label="Citas Próximas"
        />
        <MetricCard
          icon={TrendingUp}
          iconColor="#3B82F6"
          iconBg="rgba(59, 130, 246, 0.1)"
          value={`${stats.responseRate}%`}
          label="Tasa Respuesta"
        />
      </div>
    </div>
  )
}

function EmergencyCard({ post, isApplied, onPostular }: { post: Post; isApplied: boolean; onPostular: (post: Post) => void }) {
  const timeAgo = 'Reciente' // Simplified for now
  const distance = '2.5'
  const clientName = post.user.name
  const clientSurname = post.user.surname
  const clientRating = post.clientRating ?? 0
  const title = post.title
  const description = post.description
  const location = post.address

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 16,
      padding: 20,
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Top row: badge + time + distance */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#FEE2E2', color: '#DC2626',
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
            Urgente
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo}</span>
        </div>
        <div style={{
          background: '#F1F5F9', borderRadius: 10, padding: '6px 10px',
          fontSize: 14, fontWeight: 700, color: '#0F172A',
          display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1,
        }}>
          {distance}
          <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8' }}>km</span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      {/* Client + location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to={`/profile/client/${post.userId}`}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', textDecoration: 'none' }}
        >
          <User size={12} color="#94A3B8" />
          {clientName} {clientSurname}
        </Link>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#F59E0B', fontSize: 12 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i}>{i < Math.round(clientRating) ? '★' : '☆'}</span>
          ))}
          <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 2 }}>{clientRating}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
          <MapPin size={12} />
          {location}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {isApplied ? (
          <div style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            border: '1.5px solid #10B981', background: '#ECFDF5',
            color: '#059669', fontSize: 13, fontWeight: 600,
            textAlign: 'center',
          }}>
            Postulado
          </div>
        ) : (
          <>
            <button style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: '#fff',
              color: '#475569', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
            >
              Rechazar
            </button>
            <button
              onClick={() => onPostular(post)}
              style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: 'none', background: '#EF4444',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#DC2626' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#EF4444' }}
            >
              Postularse
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function EmergencySection({ workerId, emergenciesEnabled: initialEnabled }: { workerId: string; emergenciesEnabled: boolean }) {
  const [isActive, setIsActive] = useState(initialEnabled)
  const [emergencies, setEmergencies] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmergency, setSelectedEmergency] = useState<Post | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [appliedIds, setAppliedIds] = useState<string[]>([])

  const loadAppliedIds = useCallback(async () => {
    try {
      const res = await api.get<{ postId: string }[]>('/applications/my-applications')
      setAppliedIds(res.data.map((a) => a.postId))
    } catch {
      setAppliedIds([])
    }
  }, [])

  useEffect(() => {
    void loadAppliedIds()
  }, [loadAppliedIds])

  const isApplied = (postId: string): boolean => appliedIds.includes(postId)

  const handleToggle = async () => {
    const newValue = !isActive
    try {
      await api.patch(`/users/${workerId}/emergencies`, { enabled: newValue })
      setIsActive(newValue)
    } catch (error) {
      console.error('Error updating emergency notifications:', error)
    }
  }

  const handlePostular = async (formData: ApplicationFormData) => {
    if (!selectedEmergency) return
    setEnviando(true)
    try {
      await applyToPost({
        postId: selectedEmergency.id,
        message: formData.message || undefined,
        availableDays: formData.availableDays,
        availableTimeFrom: formData.availableTimeFrom,
        availableTimeTo: formData.availableTimeTo,
        chargesVisit: formData.chargesVisit,
        visitCost: formData.visitCost,
      })
      setAppliedIds((prev) => [...prev, selectedEmergency.id])
      setExito(true)
      setTimeout(() => {
        setSelectedEmergency(null)
        setExito(false)
      }, 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al postularse'
      alert(msg)
    } finally {
      setEnviando(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedEmergency(null)
    setExito(false)
  }

  useEffect(() => {
    if (!isActive) {
      setEmergencies([])
      return
    }

    const loadEmergencies = async () => {
      setLoading(true)
      try {
        const { data } = await fetchEmergencyPosts()
        setEmergencies(data)
      } catch (error) {
        console.error('Error fetching emergencies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEmergencies()
  }, [isActive])

  return (
    <div className="wd-section" style={{
      maxWidth: 1280, margin: '0 auto', padding: '0 32px',
      marginTop: 36,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        background: '#0F172A', borderRadius: 20, padding: '28px 28px 32px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        maxHeight: isActive ? '2000px' : '100px'
      }}>
        {/* Header / Label */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: isActive ? 24 : 0, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <AlertCircle size={isActive ? 24 : 20} color="#94A3B8" />
              {emergencies.length > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#EF4444', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {emergencies.length}
                </span>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: isActive ? 20 : 16, fontWeight: 700, color: '#fff', margin: 0, transition: 'all 0.3s' }}>
                {isActive ? 'Urgencias Entrantes' : 'Urgencias Ocultas'}
              </h2>
              {isActive && (
                <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
                  Emergencias de clientes cerca de tu ubicacion
                </p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#10B981' : '#64748B' }}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
            <button
              onClick={handleToggle}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: isActive ? '#10B981' : '#334155',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
                padding: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3, left: isActive ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>

        {/* Emergency cards grid */}
        {isActive ? (
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Cargando urgencias...</div>
          ) : emergencies.length > 0 ? (
            <div className="wd-emergency-grid" style={{ marginTop: 24 }}>
              {emergencies.map((post) => (
                <EmergencyCard key={post.id} post={post} isApplied={isApplied(post.id)} onPostular={setSelectedEmergency} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16,
              marginTop: 24
            }}>
              <X size={32} color="#475569" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                No hay urgencias disponibles en este momento.
              </p>
            </div>
          )
        ) : (
          <div style={{
            textAlign: 'center', padding: '10px 20px',
            color: '#64748B', fontSize: 13,
          }}>
            Activa el switch para para ver las solicitudes urgentes.
          </div>
        )}
      </div>

      {/* Apply Modal for emergencies */}
      {selectedEmergency && (
        exito ? (
          <div className="modal-overlay" role="presentation">
            <div className="card modal-card" role="dialog" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Postulacion enviada</h2>
              <p style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>Te postulaste exitosamente a la urgencia</p>
            </div>
          </div>
        ) : (
          <ApplyModal
            selected={postToTrabajo(selectedEmergency)}
            onEnviar={handlePostular}
            onClose={handleCloseModal}
            enviando={enviando}
          />
        )
      )}
    </div>
  )
}
// ─── Application type (from /applications/my-applications) ───────────────────
// ─── Application type (from /applications/my-applications) ───────────────────

interface Application {
  id: string
  postId: string
  title: string
  client: string
  location: string
  appliedAt: string
  serviceDate: string
  status: 'Accepted' | 'Rejected' | 'Pending' | 'Completed'
  clientPhone: string | null
}

// ─── Jobs In Zone ─────────────────────────────────────────────────────────────

const LOCATION_FILTER_KEY = 'homefix_dashboard_location_filter'

function loadStoredLocationFilter(): LocationFilter | null {
  try {
    const raw = localStorage.getItem(LOCATION_FILTER_KEY)
    if (raw) return JSON.parse(raw) as LocationFilter
  } catch { /* ignore */ }
  return null
}

function JobsInZoneSection({
  posts,
  loading,
  locationFilter,
  onToggleLocation,
  userId,
}: {
  posts: Post[]
  loading: boolean
  locationFilter: LocationFilter | null
  onToggleLocation: () => void
  userId?: string
}) {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Trabajos en tu zona
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onToggleLocation}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
              border: 'none', borderRadius: 20,
              padding: '6px 14px 6px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              background: locationFilter ? '#10B981' : '#E2E8F0',
              color: locationFilter ? '#fff' : '#475569',
            }}
            title={locationFilter ? 'Desactivar ubicación' : 'Activar ubicación'}
          >
            <Navigation size={14} />
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              background: locationFilter ? '#fff' : '#94A3B8',
              transition: 'background 0.15s',
              flexShrink: 0,
            }} />
            {locationFilter ? 'Ubicación activa' : 'Activar ubicación'}
          </button>
          <Link
            to="/worker/available-jobs"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600, color: '#64748B',
              textDecoration: 'none', transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748B' }}
          >
            Ver todos <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!locationFilter && !loading && (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
            padding: '32px 24px', textAlign: 'center',
          }}>
            <Navigation size={32} style={{ color: '#94A3B8', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 6px' }}>
              ¿Quieres conocer los trabajos cerca de tu ubicación?
            </p>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              Activa la ubicación para ver los trabajos disponibles en tu zona.
            </p>
            <button
              type="button"
              onClick={onToggleLocation}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#10B981', color: '#fff',
                border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Navigation size={16} />
              Activar ubicación
            </button>
          </div>
        )}
        {loading && (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando trabajos...</p>
        )}
        {locationFilter && !loading && posts.length === 0 && (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
            padding: '28px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
              No hay trabajos disponibles cerca de tu ubicación por ahora.
            </p>
          </div>
        )}
        {locationFilter && !loading && posts.map((post) => {
          const trabajo = postToTrabajo(post)
          return (
            <TrabajoCard
              key={post.id}
              trabajo={trabajo}
              isSelected={false}
              isApplied={false}
              isOwnPost={trabajo.userId === userId}
              onClick={() => navigate(`/worker/available-jobs?id=${post.id}`)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/worker/available-jobs?id=${post.id}`)
                }
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const VALIDATIONS = [
  { label: 'DNI + Biometría Facial', required: true },
  { label: 'Antecedentes (Opcional)', required: false },
  { label: 'Matrícula (Opcional)', required: false },
  { label: 'Domicilio', required: true },
]

const QUICK_LINKS = [
  { label: 'Buscar Trabajos',   icon: Briefcase,     href: '/worker/available-jobs' },
  { label: 'Mi Perfil',         icon: User,           href: '' },
  { label: 'Mis Validaciones',  icon: Shield,         href: '/worker' },
  { label: 'Mis Postulaciones', icon: FileText,       href: '/worker/my-applications' },
  { label: 'Gestor Subcontratos', icon: GitBranch,    href: '/worker/subcontracts' },
  { label: 'Mensajes',          icon: MessageSquare,  href: '/worker' },
]

const KYC_BADGE: Record<string, { icon: typeof CheckCircle2; bg: string; color: string }> = {
  APPROVED:   { icon: CheckCircle2, bg: '#ECFDF5', color: '#059669' },
  DECLINED:   { icon: XCircle, bg: '#FEF2F2', color: '#DC2626' },
  EXPIRED:    { icon: Clock, bg: '#FEF2F2', color: '#DC2626' },
  IN_REVIEW:  { icon: Clock, bg: '#FFFBEB', color: '#D97706' },
}

function Sidebar({ workerId, kycStatus }: { workerId: string; kycStatus: KycStatus }) {
  const navigate = useNavigate()
  const links = QUICK_LINKS.map((l) => l.label === 'Mi Perfil' ? { ...l, href: `/worker/${workerId}` } : l)

  function renderKycButton() {
    const badge = KYC_BADGE[kycStatus]
    if (kycStatus === 'APPROVED') {
      const B = badge
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#475569' }}>DNI + Biometría Facial</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: B.bg, color: B.color,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          }}>
            <B.icon size={12} />
            Verificada
          </span>
        </div>
      )
    }

    if (kycStatus === 'DECLINED' || kycStatus === 'EXPIRED') {
      const B = badge
      return (
        <button
          type="button"
          onClick={() => navigate('/kyc')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'transparent', border: 'none', padding: 0,
            cursor: 'pointer', color: '#475569', transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569' }}
        >
          <span style={{ fontSize: 13 }}>DNI + Biometría Facial</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: B.bg, color: B.color,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          }}>
            <B.icon size={12} />
            Rechazada
          </span>
        </button>
      )
    }

    if (kycStatus === 'IN_REVIEW') {
      const B = badge
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#475569' }}>DNI + Biometría Facial</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: B.bg, color: B.color,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          }}>
            <B.icon size={12} />
            Pendiente
          </span>
        </div>
      )
    }

    return (
      <button
        key="dni"
        type="button"
        onClick={() => navigate('/kyc')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', color: '#475569', transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569' }}
      >
        <span style={{ fontSize: 13 }}>DNI + Biometría Facial</span>
        <ChevronRight size={18} color="#94A3B8" />
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Telegram */}
        <TelegramLinkCard />

        {/* Mis Validaciones */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#64748B" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Mis Validaciones</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
            {VALIDATIONS.length}/{VALIDATIONS.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {VALIDATIONS.map((v) => {
            if (v.label === 'DNI + Biometría Facial') {
              return <div key={v.label}>{renderKycButton()}</div>
            }
            return (
              <button
                key={v.label}
                type="button"
                onClick={() => navigate(`/worker/${workerId}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'transparent', border: 'none', padding: 0,
                  cursor: 'pointer', color: '#475569', transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569' }}
              >
                <span style={{ fontSize: 13 }}>{v.label}</span>
                <ChevronRight size={18} color="#94A3B8" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '20px 20px 8px',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
          Accesos Rapidos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 4px', fontSize: 13, fontWeight: 500,
                color: '#475569', textDecoration: 'none',
                borderBottom: '1px solid #F1F5F9',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569' }}
            >
              <link.icon size={15} color="#94A3B8" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mejora tu perfil */}
      <div style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1px solid #BBF7D0',
        borderRadius: 16, padding: '20px',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
          Mejora tu perfil
        </h3>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
          Los perfiles completos reciben hasta 3x mas solicitudes de trabajo.
        </p>
        <button
          onClick={() => navigate(`/worker/${workerId}`)}
          style={{
            width: '100%', background: '#10B981', border: 'none',
            borderRadius: 10, color: '#fff',
            fontSize: 13, fontWeight: 700,
            padding: '12px 0', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#059669' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
        >
          Editar Perfil
        </button>
      </div>

    </div>
  )
}

// ─── Mis Postulaciones ───────────────────────────────────────────────────────

const APP_STATUS_ES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  Pending:   { label: 'Pendiente',  bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  Accepted:  { label: 'Aceptada',   bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  Rejected:  { label: 'Rechazada',  bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  Completed: { label: 'Completada', bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
}

function AppStatusBadge({ status }: { status: string }) {
  const s = APP_STATUS_ES[status] ?? { label: status, bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700,
      padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  )
}

function MisPostulacionesSection({ apps, loading }: { apps: Application[]; loading: boolean }) {
  // Pending first, then Accepted by most recent appliedAt
  const sorted = [...apps]
    .filter((a) => a.status === 'Pending' || a.status === 'Accepted')
    .sort((a, b) => {
      if (a.status === b.status) return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      return a.status === 'Pending' ? -1 : 1
    })
    .slice(0, 3)

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Mis Postulaciones
        </h2>
        <Link
          to="/worker/my-applications"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748B' }}
        >
          Ver todas <ChevronRight size={15} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando postulaciones...</p>}
        {!loading && sorted.length === 0 && (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
            padding: '28px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
              Aún no tenés postulaciones activas.
            </p>
          </div>
        )}
        {!loading && sorted.map((app) => {
          const date = app.appliedAt?.substring(0, 10) ?? '—'
          return (
            <div key={app.id} style={{
              background: '#fff', border: '1px solid #E2E8F0',
              borderRadius: 16, padding: '16px 20px',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {app.title}
                </h3>
                <AppStatusBadge status={app.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>
                  Cliente: {app.client}
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{date}</span>
              </div>
              {app.status === 'Accepted' && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => {
                      const phone = app.clientPhone?.replace(/\D/g, '')
                      if (!phone) return
                      window.open(
                        `https://wa.me/${phone}?text=${encodeURIComponent('Hola, me contrataste para: ' + app.title)}`,
                        '_blank'
                      )
                    }}
                    style={{
                      background: '#10B981', border: 'none', borderRadius: 8,
                      color: '#fff', fontSize: 12, fontWeight: 600,
                      padding: '6px 16px', cursor: app.clientPhone ? 'pointer' : 'not-allowed',
                      opacity: app.clientPhone ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => { if (app.clientPhone) (e.currentTarget as HTMLElement).style.background = '#059669' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#10B981' }}
                  >
                    Contactar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Próximas Citas ───────────────────────────────────────────────────────────

function formatCitaDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: iso.substring(0, 10), time: '—' }
  const date = d.toISOString().slice(0, 10)
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { date, time }
}

function ProximasCitasSection({ apps, loading }: { apps: Application[]; loading: boolean }) {
  const citas = [...apps]
    .filter((a) => a.status === 'Accepted' && a.serviceDate)
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())
    .slice(0, 3)

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Proximas Citas
        </h2>
        <Link
          to="/worker/my-applications"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 600, color: '#64748B', textDecoration: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0F172A' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748B' }}
        >
          Ver todas <ChevronRight size={15} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando citas...</p>}
        {!loading && citas.length === 0 && (
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
            padding: '28px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
              No tenés citas confirmadas próximas.
            </p>
          </div>
        )}
        {!loading && citas.map((app) => {
          const { date, time } = formatCitaDate(app.serviceDate)
          return (
            <div key={app.id} style={{
              background: '#fff', border: '1px solid #E2E8F0',
              borderRadius: 16, padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {/* Left: info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.title}
                </h3>
                <p style={{ fontSize: 12, color: '#10B981', fontWeight: 500, margin: '0 0 4px' }}>
                  Cliente: {app.client}
                </p>
                {app.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                    <MapPin size={11} />
                    {app.location}
                  </div>
                )}
              </div>

              {/* Right: date + time */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>{date}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#10B981', margin: 0 }}>{time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

const DASHBOARD_POLL_MS = 60000

export default function WorkerDashboard() {
  useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nearbyJobs, setNearbyJobs] = useState<Post[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState<KycStatus>('NOT_STARTED')
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(loadStoredLocationFilter)
  const dashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const kycIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get<DashboardData>('/worker-dashboard')
      setData(res.data)
    } catch {
      setError('No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchNearbyJobs = useCallback(async () => {
    if (!locationFilter) {
      setNearbyJobs([])
      setJobsLoading(false)
      return
    }
    try {
      const { data } = await searchPostsByLocation(locationFilter.lat, locationFilter.lng, locationFilter.radius, '')
      setNearbyJobs(data.slice(0, 5))
    } catch {
      setNearbyJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [locationFilter])

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get<Application[]>('/applications/my-applications')
      setApplications(res.data)
    } catch {
      setApplications([])
    } finally {
      setAppsLoading(false)
    }
  }, [])

  const fetchKyc = useCallback(async () => {
    try {
      const { kycStatus: status } = await fetchKycStatus()
      setKycStatus(status)
    } catch {
      // keep default NOT_STARTED
    }
  }, [])

  const handleToggleLocation = () => {
    if (locationFilter) {
      setLocationFilter(null)
      localStorage.removeItem(LOCATION_FILTER_KEY)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const filter = { lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 20 }
        setLocationFilter(filter)
        localStorage.setItem(LOCATION_FILTER_KEY, JSON.stringify(filter))
      },
      () => {
        // user denied or error — do nothing
      },
      { timeout: 5000 }
    )
  }

  useEffect(() => {
    void fetchDashboard()
    void fetchNearbyJobs()
    void fetchApplications()
    void fetchKyc()

    dashIntervalRef.current = setInterval(() => { void fetchDashboard() }, DASHBOARD_POLL_MS)
    jobsIntervalRef.current = setInterval(() => { void fetchNearbyJobs() }, DASHBOARD_POLL_MS)
    appsIntervalRef.current = setInterval(() => { void fetchApplications() }, DASHBOARD_POLL_MS)
    kycIntervalRef.current = setInterval(() => { void fetchKyc() }, DASHBOARD_POLL_MS)

    return () => {
      if (dashIntervalRef.current) clearInterval(dashIntervalRef.current)
      if (jobsIntervalRef.current) clearInterval(jobsIntervalRef.current)
      if (appsIntervalRef.current) clearInterval(appsIntervalRef.current)
      if (kycIntervalRef.current) clearInterval(kycIntervalRef.current)
    }
  }, [fetchDashboard, fetchNearbyJobs, fetchApplications, fetchKyc])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Montserrat', system-ui, sans-serif",
        overflowX: 'hidden', width: '100%', maxWidth: '100%',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid #E2E8F0', borderTopColor: '#0F172A',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F3F4F6',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Montserrat', system-ui, sans-serif",
        gap: 12,
        overflowX: 'hidden', width: '100%', maxWidth: '100%',
      }}>
        <AlertCircle size={40} color="#EF4444" />
        <p style={{ color: '#EF4444', fontSize: 15, fontWeight: 500, margin: 0 }}>
          {error ?? 'Error inesperado'}
        </p>
        <button
          onClick={() => { setLoading(true); setError(null); void fetchDashboard() }}
          style={{
            background: '#0F172A', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: 8, fontSize: 13,
            fontWeight: 600, cursor: 'pointer', marginTop: 8,
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F3F4F6',
      fontFamily: "'Montserrat', system-ui, sans-serif",
      overflowX: 'hidden', width: '100%', maxWidth: '100%',
    }}>
      <ProfileHeader profile={data.profile} stats={data.stats} />
      <MetricsStrip stats={data.stats} />
      <EmergencySection workerId={data.profile.id} emergenciesEnabled={data.profile.emergenciesEnabled} />

      {/* Central section: main content + sidebar */}
      <div className="wd-main-grid" style={{ maxWidth: 1280, margin: '36px auto 0', padding: '0 32px' }}>
        {/* Left column */}
        <div className="wd-content">
          <JobsInZoneSection posts={nearbyJobs} loading={jobsLoading} locationFilter={locationFilter} onToggleLocation={handleToggleLocation} userId={data.profile.id} />
          <MisPostulacionesSection apps={applications} loading={appsLoading} />
          <ProximasCitasSection apps={applications} loading={appsLoading} />
        </div>

        {/* Right sidebar */}
        <Sidebar workerId={data.profile.id} kycStatus={kycStatus} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .wd-header-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .wd-left-info { display: flex; align-items: center; gap: 20px; }
        .wd-action-buttons { display: flex; gap: 10px; flex-shrink: 0; }
        .wd-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .wd-main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .wd-emergency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .wd-header-container,
        .wd-section,
        .wd-main-grid { box-sizing: border-box; }
        .wd-content { min-width: 0; }
        .wd-content h3 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 1024px) { .wd-main-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
          .wd-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .wd-emergency-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .wd-header-row { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
          .wd-left-info { flex-direction: column; align-items: center; text-align: center; }
          .wd-action-buttons { width: 100%; justify-content: center; }
          .wd-emergency-grid { grid-template-columns: 1fr; }
          .wd-metric-card { padding: 16px 14px !important; gap: 12px !important; }
          .wd-metric-icon { width: 36px !important; height: 36px !important; }
          .wd-metric-icon-svg { width: 18px !important; height: 18px !important; }
          .wd-metric-value { font-size: 22px !important; }
          .wd-metric-label { font-size: 11px !important; }
          .wd-header-container,
          .wd-section,
          .wd-main-grid { padding-left: 16px !important; padding-right: 16px !important; }
          .wd-profile-avatar img,
          .wd-profile-avatar > div {
            width: 100px !important;
            height: 100px !important;
            font-size: 36px !important;
          }
        }
        @media (max-width: 360px) {
          .wd-header-container,
          .wd-section,
          .wd-main-grid { padding-left: 12px !important; padding-right: 12px !important; }
          .wd-action-buttons { flex-direction: column; align-items: stretch; }
          .wd-action-buttons button { width: 100%; justify-content: center; }
          .wd-header-row { gap: 12px; }
        }
      `}</style>
      <div style={{ marginTop: 48 }}>
        <LandingFooter />
      </div>
    </div>
  )
}
