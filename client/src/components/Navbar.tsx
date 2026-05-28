import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, Home, Search, FileText,
  ClipboardList, Briefcase, User, LogOut, ChevronDown
} from 'lucide-react'

const COLORS = {
  primary:     '#13243B',
  accent:      '#10B981',
  muted:       '#64748B',
  border:      '#E2E8F0',
  bg:          '#FFFFFF',
  hover:       '#F1F5F9',
  activeBg:    'rgba(19, 36, 59, 0.08)',
  red:         '#EF4444',
  redHoverBg:  'rgba(239, 68, 68, 0.05)',
}

type UserRole = 'guest' | 'cliente' | 'trabajador'

function getStoredUser(): { name: string; role: string } | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as { name: string; role: string }) : null
  } catch {
    return null
  }
}

const AUTH_ROUTES = ['/login', '/register']

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink]  = useState<string | null>(null)
  const [userBtnHover, setUserBtnHover] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (AUTH_ROUTES.includes(pathname)) return null

  const userData  = getStoredUser()
  const isLoggedIn = !!userData

  let role: UserRole = 'guest'
  if (isLoggedIn) {
    role = userData?.role === 'worker' ? 'trabajador' : 'cliente'
  }

  const displayName    = userData?.name || 'Mi cuenta'
  const displayInitial = displayName.charAt(0).toUpperCase()

  const clienteLinks = [
    { href: '/users',        label: 'Inicio',               icon: Home },
    { href: '/users',        label: 'Buscar Profesionales', icon: Search },
    { href: '/post-options', label: 'Nueva Solicitud',      icon: FileText },
    { href: '/users',        label: 'Mis Publicaciones',    icon: ClipboardList },
  ]

  const trabajadorLinks = [
    { href: '/worker',                  label: 'Inicio',              icon: Home },
    { href: '/worker',                  label: 'Trabajos Disponibles', icon: Briefcase },
    { href: '/worker/my-applications',  label: 'Mis Postulaciones',   icon: ClipboardList },
  ]

  const navLinks = role === 'cliente' ? clienteLinks : role === 'trabajador' ? trabajadorLinks : []

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserMenuOpen(false)
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <nav style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}
      className="sticky top-0 z-50 backdrop-blur-md">
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '72px', paddingTop: '12px', paddingBottom: '12px' }}>

          {/* Logo */}
          <Link
            to={role === 'trabajador' ? '/worker' : role === 'cliente' ? '/users' : '/login'}
            className="flex items-center flex-shrink-0"
            style={{ textDecoration: 'none' }}
          >
            <img src="/homefix-logo.png" alt="HomeFix" style={{ height: '40px', width: 'auto' }} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active  = pathname === link.href && link.label === navLinks.find(l => pathname === l.href)?.label
              const hovered = hoveredLink === link.label
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '6px',
                    padding:         '8px 12px',
                    borderRadius:    '8px',
                    fontSize:        '14px',
                    fontWeight:      '500',
                    textDecoration:  'none',
                    transition:      'background 0.15s, color 0.15s',
                    backgroundColor: active  ? COLORS.activeBg : hovered ? COLORS.hover : 'transparent',
                    color:           active || hovered ? COLORS.primary : COLORS.muted,
                  }}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <link.icon style={{ width: '16px', height: '16px' }} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link to="/login" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '8px 12px' }}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" style={{ background: COLORS.accent, color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px' }}>
                  Registrarse
                </Link>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onMouseEnter={() => setUserBtnHover(true)}
                  onMouseLeave={() => setUserBtnHover(false)}
                  style={{
                    display:         'flex',
                    alignItems:      'center',
                    gap:             '8px',
                    padding:         '8px 12px',
                    borderRadius:    '8px',
                    border:          `1px solid ${COLORS.border}`,
                    background:      userBtnHover ? COLORS.hover : 'transparent',
                    cursor:          'pointer',
                    transition:      'background 0.15s',
                    color:           'inherit',
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: COLORS.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                    {displayInitial}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: COLORS.primary, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <ChevronDown style={{ width: '16px', height: '16px', color: COLORS.muted, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {userMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, marginTop: '8px', width: '208px', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '4px 0', zIndex: 50 }}>
                    <Link
                      to={role === 'trabajador' ? '/worker' : '/users'}
                      onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', color: COLORS.primary, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <User style={{ width: '16px', height: '16px', color: COLORS.muted }} />
                      Mi Perfil
                    </Link>
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: '4px 0' }} />
                    <button
                      onClick={logout}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', color: COLORS.red, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = COLORS.redHoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut style={{ width: '16px', height: '16px' }} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: COLORS.muted }}
            className="md:hidden"
          >
            {mobileOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '16px 0' }} className="md:hidden">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none', color: COLORS.primary, backgroundColor: pathname === link.href ? COLORS.activeBg : 'transparent' }}
                >
                  <link.icon style={{ width: '16px', height: '16px' }} />
                  {link.label}
                </Link>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
              {isLoggedIn ? (
                <>
                  <Link to={role === 'trabajador' ? '/worker' : '/users'} onClick={() => setMobileOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.primary, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '10px 16px', textDecoration: 'none' }}>
                    <User style={{ width: '16px', height: '16px' }} /> Mi Perfil
                  </Link>
                  <button onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: COLORS.red, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '10px 16px' }}>
                    <LogOut style={{ width: '16px', height: '16px' }} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    style={{ display: 'block', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px', textDecoration: 'none' }}>
                    Iniciar Sesión
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}
                    style={{ display: 'block', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#fff', background: COLORS.accent, borderRadius: '8px', padding: '10px', textDecoration: 'none' }}>
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
