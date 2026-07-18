import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, CalendarDays, CheckCircle2, BellDot, AlertTriangle, X, Plus, FileText, User, Send } from 'lucide-react'
import { getUserPosts, type UserPost } from '../services/posts'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/dashboard/StatCard'
import TurnoCard from '../components/dashboard/TurnoCard'
import TelegramLinkCard from '../components/dashboard/TelegramLinkCard'
import EmergencyCard from '../components/dashboard/EmergencyCard'
import EmergencyModal from '../components/dashboard/EmergencyModal'
import { PostStatus } from '../types/post'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmergencies, setShowEmergencies] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)

  useEffect(() => {
    getUserPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const activos     = posts.filter(p => p.status === PostStatus.Active || p.status === PostStatus.InProgress || p.status === PostStatus.Paused).length
  const completados = posts.filter(p => p.status === PostStatus.Completed).length
  const emergencyCount = posts.filter(p => p.isEmergency && p.status !== PostStatus.Completed && p.status !== PostStatus.Cancelled).length

  // Identidad Cliente = verde. Cada métrica conserva su color semántico.
  const stats = [
    { label: 'Publicaciones activas', value: activos,     icon: CalendarDays,  iconColor: '#10B981' },
    { label: 'Completadas',           value: completados, icon: CheckCircle2,  iconColor: '#059669' },
    { label: 'Mensajes',              value: 0,           icon: MessageSquare, iconColor: '#8B5CF6' },
    { label: 'Sin leer',              value: 0,           icon: BellDot,       iconColor: '#F59E0B' },
  ]

  // Show only actionable posts. Cancelled posts surface only when a hired contract still needs a
  // review; everything else is hidden once Completed + reviewed.
  const visible = posts.filter(p => {
    if (p.status === PostStatus.Cancelled) return p.worker != null && !p.hasReview
    return !(p.status === PostStatus.Completed && p.hasReview)
  })
  const inProgressPosts = visible.filter(p => p.status === PostStatus.InProgress)
  const rest            = visible.filter(p => p.status !== PostStatus.InProgress)
  const ordered         = [...inProgressPosts, ...rest]

  const displayedPosts = showEmergencies
    ? ordered.filter(p => p.isEmergency)
    : ordered

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Hero claro — identidad Cliente (verde) */}
      <div className="bg-accent-hover px-6 pt-8 pb-12 md:px-12">
        <div className="hf-container">
          {/* Badge de rol */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Modo Cliente
          </span>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mt-3.5 text-4xl font-extrabold tracking-tight text-white">Mi Tablero</h1>
              <p className="mt-1.5 text-sm text-white/80">Gestiona tus publicaciones y conversaciones</p>
            </div>
            {user?.id && (
              <button
                onClick={() => navigate(`/client/${user.id}`)}
                className="mt-3.5 inline-flex items-center gap-2 rounded-lg border border-primary-dark/20 bg-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary-dark"
              >
                <User size={16} />
                Mi Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 md:px-12">
        <div className="hf-container">

          {/* Stats — superpuestas sobre el hero */}
          <div className="relative -mt-7 mb-10 grid grid-cols-2 auto-rows-fr gap-5 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} iconColor={s.iconColor} />
            ))}
          </div>

          {/* Mis publicaciones + Mensajes */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_340px]">

            {/* Columna izquierda — Mis publicaciones + Mensajes */}
            <div className="flex flex-col gap-8">

              {/* Mis publicaciones */}
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Mis publicaciones</h2>
                  {emergencyCount > 0 && (
                    <button
                      onClick={() => setShowEmergencies(!showEmergencies)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                        showEmergencies
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <AlertTriangle size={14} />
                      Urgentes ({emergencyCount})
                      {showEmergencies && <X size={14} />}
                    </button>
                  )}
                </div>

                {showEmergencies && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    Mostrando solo publicaciones de emergencia
                  </div>
                )}

                {loading ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-md">
                    <div className="spinner mx-auto" />
                  </div>
                ) : displayedPosts.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-md">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                      <FileText size={28} className="text-emerald-500" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-slate-700">Todavía no tenés publicaciones</h3>
                    <p className="mb-6 text-sm text-slate-400">Creá tu primera publicación y encontrá al profesional ideal.</p>
                    <button
                      onClick={() => navigate('/post-options')}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary-dark"
                    >
                      <Plus size={16} />
                      Crear publicación
                    </button>
                    <p className="text-sm text-slate-400">
                      {showEmergencies
                        ? 'No tenes publicaciones de emergencia activas.'
                        : 'Todavia no tenes publicaciones.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {displayedPosts.map((post) => <TurnoCard key={post.id} post={post} />)}
                  </div>
                )}
              </section>

            </div>

            {/* Columna derecha — Emergencia + Telegram */}
            <div className="flex flex-col gap-4">
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <AlertTriangle size={20} className="text-red-500" />
                  Emergencia
                </h2>
                <EmergencyCard onOpen={() => setShowEmergencyModal(true)} />
              </section>
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Send size={20} className="text-blue-500" />
                  Telegram
                </h2>
                <TelegramLinkCard />
              </section>
            </div>

          </div>

          {/* Mensajes — siempre al final */}
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Mensajes</h2>
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-md">
              <MessageSquare size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">Próximamente disponible.</p>
            </div>
          </section>

        </div>
      </div>

      {/* Modal emergencia */}
      {showEmergencyModal && user?.id && (
        <EmergencyModal
          userId={user.id}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={() => {
            setShowEmergencyModal(false)
            getUserPosts().then(setPosts).catch(() => setPosts([]))
          }}
        />
      )}

      {/* Botón emergencias — sticky */}
      {emergencyCount > 0 && (
        <button
          title="Ver emergencias"
          onClick={() => {
            setShowEmergencies(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600!"
        >
          <div className="relative">
            <AlertTriangle size={24} />
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-500">
              {emergencyCount}
            </span>
          </div>
        </button>
      )}

    </div>
  )
}
