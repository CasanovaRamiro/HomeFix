import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Send, CalendarCheck, TrendingUp, Star,
  CheckCircle2, User, MapPin, Clock, AlertCircle, X,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardProfile {
  id: string
  name: string
  surname: string
  email: string
  phone: string | null
  bio: string | null
  createdAt: string
  location: string | null
  categories: { id: string; name: string }[]
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

interface MockEmergency {
  id: string
  title: string
  description: string
  timeAgo: string
  distance: number
  client: string
  location: string
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_EMERGENCIES: MockEmergency[] = [
  {
    id: '1',
    title: 'Caño roto',
    description: 'Se rompió un caño debajo de la pileta de la cocina, esta inundando todo. Urgente!',
    timeAgo: 'Hace 3 min',
    distance: 1.2,
    client: 'María Gómez',
    location: 'Palermo, Buenos Aires',
  },
  {
    id: '2',
    title: 'Pérdida de agua',
    description: 'Hay una pérdida grande en el baño, el agua no para de salir del inodoro.',
    timeAgo: 'Hace 8 min',
    distance: 2.4,
    client: 'Roberto Pérez',
    location: 'Villa Crespo, Buenos Aires',
  },
  {
    id: '3',
    title: 'Cañería tapada',
    description: 'Se tapó la cañería principal, todos los desagües del depto están colapsados.',
    timeAgo: 'Hace 15 min',
    distance: 3.1,
    client: 'Laura Sánchez',
    location: 'Recoleta, Buenos Aires',
  },
]

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
  const primaryCategory = profile.categories[0]?.name ?? 'Profesional'
  const locationText = profile.location ?? 'Argentina'

  return (
    <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>

          {/* Left: Avatar + Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
              border: '3px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#94A3B8',
              flexShrink: 0,
            }}>
              {getInitials(profile.name, profile.surname)}
            </div>

            {/* Name & details */}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Hola, {firstName}
              </h1>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                {primaryCategory} - {locationText}
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
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
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
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.transform = 'none'
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function MetricsStrip({ stats }: { stats: DashboardStats }) {
  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto', padding: '0 24px',
      marginTop: -28, position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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

function EmergencyCard({ emergency }: { emergency: MockEmergency }) {
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
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{emergency.timeAgo}</span>
        </div>
        <div style={{
          background: '#F1F5F9', borderRadius: 10, padding: '6px 10px',
          fontSize: 14, fontWeight: 700, color: '#0F172A',
          display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1,
        }}>
          {emergency.distance}
          <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8' }}>km</span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
        {emergency.title}
      </h3>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
        {emergency.description}
      </p>

      {/* Client + location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}>
          <User size={12} color="#94A3B8" />
          {emergency.client}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
          <MapPin size={12} />
          {emergency.location}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
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
        <button style={{
          flex: 1, padding: '10px 0', borderRadius: 10,
          border: 'none', background: '#EF4444',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#DC2626' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#EF4444' }}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

function EmergencySection() {
  const [isActive, setIsActive] = useState(true)

  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto', padding: '0 24px',
      marginTop: 36,
    }}>
      <div style={{
        background: '#0F172A', borderRadius: 20, padding: '28px 28px 32px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <AlertCircle size={24} color="#94A3B8" />
              <span style={{
                position: 'absolute', top: -4, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: '#EF4444', color: '#fff',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {MOCK_EMERGENCIES.length}
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                Urgencias Entrantes
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>
                Emergencias de clientes cerca de tu ubicación
              </p>
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#10B981' : '#64748B' }}>
              Activo
            </span>
            <button
              onClick={() => setIsActive(!isActive)}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {MOCK_EMERGENCIES.map((e) => (
              <EmergencyCard key={e.id} emergency={e} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16,
          }}>
            <X size={32} color="#475569" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
              Las urgencias están pausadas. Activá el toggle para recibir solicitudes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function WorkerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    void fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Montserrat', system-ui, sans-serif",
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
      paddingBottom: 60,
    }}>
      <ProfileHeader profile={data.profile} stats={data.stats} />
      <MetricsStrip stats={data.stats} />
      <EmergencySection />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
