import { useState, useMemo, useEffect, useCallback } from 'react'
import { MapPin, Calendar, ArrowLeft, Bell, XCircle, FileText, Home, Briefcase, ShieldCheck, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Postulacion {
  id: string
  postId: string
  titulo: string
  cliente: string
  ubicacion: string
  fecha_postulacion: string
  fecha_servicio: string
  estado: 'Aceptada' | 'Rechazada' | 'Pendiente'
  descripcion?: string
  categoria?: string
  imagen?: string
}

const tabs = ['Todas', 'Pendientes', 'Aceptadas', 'Rechazadas'] as const
type Tab = (typeof tabs)[number]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function WorkerNavbar() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') ?? 'Pedro Picapied...'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <nav
      style={{
        background: '#0F172A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              color: '#fff',
              fontFamily: 'Arial',
            }}
          >
            X
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
            Home<span style={{ color: '#10B981' }}>Fix</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
          <NavLink to="/trabajador" icon={<Home size={15} />} label="Inicio" />
          <NavLink to="/trabajador" icon={<Briefcase size={15} />} label="Trabajos Disponibles" />
          <NavLink to="/trabajador/mis-postulaciones" icon={<FileText size={15} />} label="Mis Postulaciones" active />
          <NavLink to="#" icon={<ShieldCheck size={15} />} label="Validaciones" />
        </div>

        {/* User menu */}
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '6px 12px 6px 8px',
            cursor: 'pointer',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
            }}
          >
            {userInitial}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#E2E8F0', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </span>
          <ChevronDown size={14} color="#94A3B8" />
        </button>
      </div>
    </nav>
  )
}

function NavLink({
  to,
  icon,
  label,
  active = false,
}: {
  to: string
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        color: active ? '#fff' : '#94A3B8',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

// ─── Postulacion Card ─────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    Aceptada:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    Rechazada: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    Pendiente: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  }
  const s = cfg[estado] ?? { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 12px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {estado}
    </span>
  )
}

function ClientAvatar({ name }: { name: string }) {
  const initials = getInitials(name)
  // pick a color based on first char
  const colors = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6']
  const idx = (name.charCodeAt(0) ?? 0) % colors.length
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: colors[idx],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function PostulacionCard({ p }: { p: Postulacion }) {
  const fechaPost = p.fecha_postulacion?.substring(0, 10) ?? ''
  const fechaServ = p.fecha_servicio?.substring(0, 10) ?? ''

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* ── Card body ── */}
      <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', gap: 14 }}>

        {/* Left content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Title + badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
              {p.titulo}
            </h3>
            <StatusBadge estado={p.estado} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 12px' }} />

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <ClientAvatar name={p.cliente} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{p.cliente}</span>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Postulado {fechaPost}{fechaServ ? ` — A realizar el ${fechaServ}` : ''}
            </span>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{p.ubicacion}</span>
          </div>

          {/* Description quote */}
          {p.descripcion && (
            <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', margin: '0 0 10px', lineHeight: 1.5 }}>
              &ldquo;{p.descripcion}&rdquo;
            </p>
          )}

          {/* Category chip */}
          {p.categoria && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 12, color: '#15803D', fontWeight: 500 }}>{p.categoria}</span>
            </div>
          )}
        </div>

        {/* Right image (optional) */}
        {p.imagen && (
          <div style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 10, overflow: 'hidden', alignSelf: 'center' }}>
            <img src={p.imagen} alt={p.titulo}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* ── Contact button ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          style={{
            width: '100%',
            background: '#16A34A',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#15803D' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#16A34A' }}
        >
          📞 Contactar cliente
        </button>
      </div>
    </article>
  )
}

// ─── Mock data (demo) ────────────────────────────────────────────────────────

const MOCK_POSTULACIONES: Postulacion[] = [
  {
    id: 'mock-1',
    postId: 'post-1',
    titulo: 'Reparación de tuberías en cocina',
    cliente: 'Marta Ocampo',
    ubicacion: 'Recoleta, Buenos Aires',
    fecha_postulacion: '2026-05-08',
    fecha_servicio: '2026-05-15',
    estado: 'Aceptada',
    descripcion: 'Se necesita reparar fuga de agua debajo de la pileta de la cocina.',
    categoria: 'Plomería',
    imagen: '/tuberia.png',
  },
  {
    id: 'mock-2',
    postId: 'post-2',
    titulo: 'Destape de cañería en baño',
    cliente: 'Juan Pérez',
    ubicacion: 'Palermo, Buenos Aires',
    fecha_postulacion: '2026-05-06',
    fecha_servicio: '2026-05-10',
    estado: 'Aceptada',
    descripcion: 'El lavabo del baño principal está tapado.',
    categoria: 'Plomería',
  },
]

// ─── Main View ────────────────────────────────────────────────────────────────

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>(MOCK_POSTULACIONES)
  const [filter, setFilter] = useState<Tab>('Todas')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchPostulaciones = useCallback(async () => {
    try {
      const res = await api.get<Postulacion[]>('/postulaciones/mis-postulaciones')
      const data = res.data
      setPostulaciones((prev) => {
        const prevMap = new Map(prev.map((p) => [p.id, p.estado]))
        const changes: string[] = []
        for (const p of data) {
          const old = prevMap.get(p.id)
          if (old && old !== p.estado) changes.push(`"${p.titulo}" → ${p.estado}`)
        }
        if (changes.length > 0)
          setNotification(`¡Estado actualizado! ${changes.join(', ')}`)
        return data
      })
    } catch {
      // silence
    } finally {
      setLoading(false)
    }
  }, [])

  // Merge API data on top of mocks (first load replaces mocks if API responds)

  useEffect(() => {
    void fetchPostulaciones()
    const iv = setInterval(() => { void fetchPostulaciones() }, 20_000)
    return () => clearInterval(iv)
  }, [fetchPostulaciones])

  const metrics = useMemo(() => ({
    total: postulaciones.length,
    pendientes: postulaciones.filter((p) => p.estado === 'Pendiente').length,
    aceptadas: postulaciones.filter((p) => p.estado === 'Aceptada').length,
    rechazadas: postulaciones.filter((p) => p.estado === 'Rechazada').length,
  }), [postulaciones])

  const filtered = useMemo(() => {
    if (filter === 'Todas') return postulaciones
    // "Pendientes" → "Pendiente", "Aceptadas" → "Aceptada", "Rechazadas" → "Rechazada"
    const map: Record<Tab, string> = {
      Todas: '',
      Pendientes: 'Pendiente',
      Aceptadas: 'Aceptada',
      Rechazadas: 'Rechazada',
    }
    return postulaciones.filter((p) => p.estado === map[filter])
  }, [postulaciones, filter])

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>

      {/* ── Toast notification ── */}
      {notification && (
        <div
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 100,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 14, padding: '14px 16px', maxWidth: 380,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        >
          <Bell size={18} color="#10B981" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: '#064E3B', margin: 0 }}>{notification}</p>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#6EE7B7', flexShrink: 0 }}
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <WorkerNavbar />

      {/* ── Dark header ── */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/trabajador')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', padding: 0,
              color: '#94A3B8', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} />
            Volver al Dashboard
          </button>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FileText size={28} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Mis Postulaciones
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 32px 38px' }}>
            Revisa el estado de tus postulaciones a trabajos
          </p>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCard value={metrics.total} label="Total" valueColor="#fff" />
            <MetricCard value={metrics.pendientes} label="Pendientes" valueColor="#F59E0B" />
            <MetricCard value={metrics.aceptadas} label="Aceptadas" valueColor="#10B981" />
            <MetricCard value={metrics.rechazadas} label="Rechazadas" valueColor="#EF4444" />
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                border: filter === tab ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                background: filter === tab ? '#0F172A' : '#fff',
                color: filter === tab ? '#fff' : '#475569',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div
              style={{
                width: 36, height: 36,
                border: '4px solid #E2E8F0',
                borderTopColor: '#0F172A',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '64px 24px',
              textAlign: 'center',
            }}
          >
            <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', margin: '0 0 8px' }}>
              No hay postulaciones
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {filter === 'Todas'
                ? 'Todavía no te postulaste a ningún trabajo.'
                : `No tenés postulaciones en "${filter}".`}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {filtered.map((p) => (
              <PostulacionCard key={`${p.id}-${p.postId}`} p={p} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  value,
  label,
  valueColor,
}: {
  value: number
  label: string
  valueColor: string
}) {
  return (
    <div
      style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 36, fontWeight: 700, color: valueColor, margin: '0 0 6px' }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}
