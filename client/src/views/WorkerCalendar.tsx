import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowLeft, Clock, CheckCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import LandingFooter from '../components/landing/LandingFooter'
import { ApplicationStatus } from '../types/application'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarApplication {
  id: string
  postId: string
  title: string
  client: string
  clientId: string | null
  location: string
  serviceDate: string  // día elegido / startDate (YYYY-MM-DD)
  endDate: string      // fecha límite del post
  status: ApplicationStatus
  category: string | null
  availableTimeFrom: string | null
  availableTimeTo: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const MONTH_NAMES    = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Plomería':      '#3B82F6',
  'Gas':           '#F97316',
  'Electricidad':  '#EAB308',
  'Pintura':       '#8B5CF6',
  'Albañilería':   '#6B7280',
  'Carpintería':   '#92400E',
  'Jardinería':    '#10B981',
  'Limpieza':      '#06B6D4',
  'Refrigeración': '#0EA5E9',
}
const FALLBACK_COLORS = ['#3B82F6', '#F97316', '#8B5CF6', '#10B981', '#EAB308', '#06B6D4']

function categoryColor(name: string | null, idx = 0): string {
  if (!name) return FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
  return CATEGORY_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Returns the applications whose visit day is exactly this YYYY-MM-DD */
function appsForDay(apps: CalendarApplication[], ymd: string): CalendarApplication[] {
  return apps.filter((a) => a.serviceDate === ymd)
}

function getInitials(name: string): string {
  return name.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function avatarBg(name: string): string {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
  return colors[(name.charCodeAt(0) ?? 0) % colors.length]
}

function formatShort(ymd: string): string {
  const d = parseDate(ymd)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalendarDot({ color }: { color: string }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: color, display: 'inline-block', flexShrink: 0,
    }} />
  )
}

function JobCard({ app }: { app: CalendarApplication }) {
  const isCompleted = app.status === ApplicationStatus.Completed
  const color = categoryColor(app.category)

  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 14, padding: '16px 18px',
    }}>
      {/* Top row: visit date + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} color="#9CA3AF" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
            {app.availableTimeFrom && app.availableTimeTo
              ? `${app.availableTimeFrom} – ${app.availableTimeTo}`
              : 'Horario a confirmar'}
          </span>
        </div>
        {isCompleted ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
            <CheckCircle size={12} color="#6B7280" />
            Completado
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#059669',
            background: '#ECFDF5', borderRadius: 20, padding: '2px 10px',
            border: '1px solid #A7F3D0',
          }}>
            ✓ Confirmado
          </span>
        )}
      </div>

      {/* Category icon + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `${color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
        }}>
          <span style={{ fontSize: 14 }}>🔧</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{app.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <MapPin size={11} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{app.location}</span>
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
        Plazo del cliente: hasta el {formatShort(app.endDate)}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '10px 0' }} />

      {/* Client row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: avatarBg(app.client), color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(app.client)}
          </div>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{app.client}</span>
        </div>
        <Link
          to={`/worker/posts/${app.postId}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 13, fontWeight: 700, color: '#10B981',
            textDecoration: 'none',
          }}
        >
          Ver <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ─── Day detail panel ────────────────────────────────────────────────────────

function DayPanel({ selectedYmd, apps }: { selectedYmd: string; apps: CalendarApplication[] }) {
  const dayApps = appsForDay(apps, selectedYmd)
  const d = parseDate(selectedYmd)
  const dayName = DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const monthName = MONTH_NAMES[d.getMonth()].toLowerCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }}>
          {dayName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            {d.getDate()} de {monthName}
          </h2>
          {dayApps.length > 0 && (
            <span style={{
              background: '#ECFDF5', color: '#059669',
              border: '1px solid #A7F3D0',
              borderRadius: 20, fontSize: 12, fontWeight: 700,
              padding: '2px 10px',
            }}>
              {dayApps.length}
            </span>
          )}
        </div>
      </div>

      {dayApps.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Calendar size={40} color="#E2E8F0" />
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, fontWeight: 500 }}>Sin visitas este día</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {dayApps.map((app) => <JobCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  )
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  year, month, apps, selectedYmd, onSelectDay,
}: {
  year: number; month: number
  apps: CalendarApplication[]
  selectedYmd: string
  onSelectDay: (ymd: string) => void
}) {
  const todayYmd = toYMD(new Date())
  const firstDow  = new Date(year, month, 1).getDay()
  const monOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(monOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const ymd      = isoDate(year, month, day)
          const dayApps  = appsForDay(apps, ymd)
          const isSelected = ymd === selectedYmd
          const isToday    = ymd === todayYmd
          const isPast     = ymd < todayYmd

          const isCompleted = dayApps.length > 0 && dayApps.every((a) => a.status === ApplicationStatus.Completed)
          const dotColor    = dayApps.length > 0 ? categoryColor(dayApps[0].category) : null

          return (
            <button
              key={ymd}
              onClick={() => onSelectDay(ymd)}
              style={{
                border: 'none', borderRadius: 10,
                padding: '8px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4, minHeight: 58,
                background: isSelected ? '#0F172A' : dayApps.length > 0 ? '#ECFDF5' : isToday ? '#F0FDF4' : '#fff',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(15,23,42,0.18)'
                  : isToday || dayApps.length > 0
                  ? '0 0 0 1.5px #10B981'
                  : '0 0 0 1px #E2E8F0',
                transition: 'background 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = dayApps.length > 0 ? '#ECFDF5' : isToday ? '#F0FDF4' : '#fff' }}
            >
              <span style={{
                fontSize: 14, fontWeight: isSelected || isToday ? 700 : 500,
                color: isSelected ? '#fff' : isPast && !isToday ? '#CBD5E1' : '#0F172A',
                lineHeight: 1,
              }}>
                {day}
              </span>

              {/* Dot, count, or checkmark */}
              {isCompleted ? (
                <span style={{ fontSize: 10, color: isSelected ? '#94A3B8' : '#9CA3AF' }}>✓</span>
              ) : dayApps.length > 1 ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  color: isSelected ? '#fff' : dotColor ?? '#374151',
                }}>
                  {dayApps.length}
                </span>
              ) : dotColor ? (
                <CalendarDot color={isSelected ? '#fff' : dotColor} />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ apps }: { apps: CalendarApplication[] }) {
  const categories = Array.from(new Set(apps.map((a) => a.category).filter(Boolean))) as string[]
  const hasCompleted = apps.some((a) => a.status === ApplicationStatus.Completed)
  if (categories.length === 0 && !hasCompleted) return null

  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 20 }}>
      {categories.map((cat) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDot color={categoryColor(cat)} />
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{cat}</span>
        </div>
      ))}
      {hasCompleted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>✓</span>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Completado</span>
        </div>
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function WorkerCalendar() {
  const navigate  = useNavigate()
  const today     = new Date()

  const [year, setYear]           = useState(today.getFullYear())
  const [month, setMonth]         = useState(today.getMonth())
  const [selectedYmd, setSelected] = useState(toYMD(today))
  const [apps, setApps]           = useState<CalendarApplication[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<CalendarApplication[]>('/applications/my-applications')
        setApps(res.data.filter((a) =>
          a.status === ApplicationStatus.Accepted || a.status === ApplicationStatus.Completed
        ))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const prevMonth = () => month === 0 ? (setYear((y) => y - 1), setMonth(11)) : setMonth((m) => m - 1)
  const nextMonth = () => month === 11 ? (setYear((y) => y + 1), setMonth(0)) : setMonth((m) => m + 1)

  const monthCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return apps.filter((a) => a.serviceDate.startsWith(prefix)).length
  }, [apps, year, month])

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Montserrat', system-ui, sans-serif" }}>

      {/* Dark header */}
      <div style={{ background: '#0F172A', width: '100%', paddingTop: 40, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <button onClick={() => navigate('/worker')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: 0,
            color: '#94A3B8', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginBottom: 24,
          }}>
            <ArrowLeft size={14} /> Volver al dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Calendar size={26} color="#10B981" />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Mi Agenda
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 0 36px' }}>
            Tus visitas confirmadas de un vistazo
          </p>
        </div>
      </div>

      {/* Metric strip */}
      <div style={{ maxWidth: 1280, margin: '-28px auto 0', padding: '0 32px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 200px))', gap: 16 }}>
          {[
            { value: apps.length,                                                              label: 'Visitas totales',   color: '#0F172A' },
            { value: apps.filter((a) => a.status === ApplicationStatus.Accepted).length,       label: 'Confirmadas',       color: '#059669' },
            { value: apps.filter((a) => a.status === ApplicationStatus.Completed).length,      label: 'Completadas',       color: '#2563EB' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0, lineHeight: 1.1 }}>{value}</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '36px auto', padding: '0 32px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 36, height: 36,
              border: '4px solid #E2E8F0', borderTopColor: '#0F172A',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : (
          <div className="wc-layout">
            {/* Left: calendar */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '28px 28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    {MONTH_NAMES[month]} {year}
                  </h2>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', fontWeight: 500 }}>
                    {monthCount === 0 ? 'Sin visitas este mes' : `${monthCount} visita${monthCount !== 1 ? 's' : ''} este mes`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ action: prevMonth, icon: <ChevronLeft size={16} color="#374151" /> },
                    { action: nextMonth, icon: <ChevronRight size={16} color="#374151" /> }].map(({ action, icon }, i) => (
                    <button key={i} onClick={action} style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: '1.5px solid #E2E8F0', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <CalendarGrid year={year} month={month} apps={apps} selectedYmd={selectedYmd} onSelectDay={setSelected} />
              <Legend apps={apps} />
            </div>

            {/* Right: day detail */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: '28px' }}>
              <DayPanel selectedYmd={selectedYmd} apps={apps} />
            </div>
          </div>
        )}
      </div>

      <LandingFooter />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .wc-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) { .wc-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
