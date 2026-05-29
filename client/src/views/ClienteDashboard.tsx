import { useEffect, useState } from 'react'
import { MessageSquare, CalendarDays, CheckCircle2, BellDot, AlertTriangle, Search } from 'lucide-react'
import { getUserPosts, type UserPost } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatCard from '../components/dashboard/StatCard'
import TurnoCard from '../components/dashboard/TurnoCard'

export default function ClienteDashboard() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    getUserPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const activos     = posts.filter(p => p.status === 'Active' || p.status === 'Paused').length
  const completados = posts.filter(p => p.status === 'Finalized').length

  const stats = [
    { label: 'Turnos Activos', value: activos,    icon: CalendarDays,  iconColor: '#10B981' },
    { label: 'Completados',    value: completados, icon: CheckCircle2,  iconColor: '#3B82F6' },
    { label: 'Mensajes',       value: 0,           icon: MessageSquare, iconColor: '#8B5CF6' },
    { label: 'Sin Leer',       value: 0,           icon: BellDot,       iconColor: '#F59E0B' },
  ]

  const inProgress = posts.filter(p => p.status !== 'Finalized')
  const finalized  = posts.filter(p => p.status === 'Finalized')
  const ordered    = [...inProgress, ...finalized]

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero oscuro */}
      <div className="bg-primary-dark px-6 pt-12 pb-28 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white">Mi Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">Gestioná tus turnos y conversaciones</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 md:px-12">
        <div className="max-w-7xl mx-auto">

          {/* Stats — superpuestas sobre el hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 -mt-16 mb-10 relative">
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} iconColor={s.iconColor} />
            ))}
          </div>

          {/* Mis Turnos + Mensajes */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* Mis Turnos */}
            <section>
              <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-900">Mis Turnos</h2>
                <button
                  disabled
                  title="Próximamente disponible"
                  className="flex items-center gap-2 bg-slate-100 text-slate-400 text-sm font-semibold rounded-lg px-4 py-2 cursor-not-allowed opacity-70"
                >
                  <Search size={15} /> Buscar profesionales
                </button>
              </div>

              {ordered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl px-6 py-16 text-center shadow-md">
                  <p className="text-slate-400 text-sm">Todavía no tenés turnos.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {ordered.map((post) => <TurnoCard key={post.id} post={post} />)}
                </div>
              )}
            </section>

            {/* Mensajes */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Mensajes</h2>
              <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center shadow-md">
                <MessageSquare size={28} className="text-slate-300 mx-auto" />
                <p className="text-slate-400 text-sm mt-3">Próximamente disponible.</p>
              </div>
            </section>

          </div>
        </div>
      </div>
      {/* Botón emergencias — sticky */}
      <button
        title="Emergencias"
        className="fixed bottom-6 right-6 z-50 bg-red-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-red-600! transition-colors"
      >
        <AlertTriangle size={24} />
      </button>

    </div>
  )
}
