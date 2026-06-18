import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/homefix-logo.png'
import { Menu, X, Home, FileText, ClipboardList, Briefcase, User, Users, LogOut, ChevronDown, CalendarDays, GitBranch } from 'lucide-react'
import type { ElementType } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useAuth, emitAuthChange } from '../hooks/useAuth'
import { UserRole } from '../types/user'

interface NavLinkDef {
  href: string
  label: string
  icon: ElementType
}

const WORKER_LINKS: NavLinkDef[] = [
  { href: '/worker',                          label: 'Inicio',               icon: Home },
  { href: '/worker/available-jobs',           label: 'Trabajos Disponibles', icon: Briefcase },
  { href: '/worker/calendar',                 label: 'Mi Agenda',            icon: CalendarDays },
  { href: '/worker/available-subcontracts',   label: 'Subcontratos',         icon: GitBranch },
  { href: '/worker/my-applications',          label: 'Mis Postulaciones',    icon: ClipboardList },
  { href: '/create-subcontract',              label: 'Subcontratar',         icon: Users },
]

const CLIENT_LINKS: NavLinkDef[] = [
  { href: '/dashboard',        label: 'Inicio',               icon: Home },
  { href: '/post-options', label: 'Nueva Solicitud',      icon: FileText },
  { href: '/client/history', label: 'Historial', icon: ClipboardList },
]

const AUTH_ROUTES = ['/login']

export default function Navbar(): React.ReactElement | null {
  const theme = useTheme()
  const { user, isLoggedIn } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [userBtnHover, setUserBtnHover] = useState(false)

  if (AUTH_ROUTES.includes(pathname)) return null

  const isLanding = !isLoggedIn && pathname === '/'
  const isWorkerLanding = !isLoggedIn && pathname.toLowerCase() === '/workerlanding'

  const navLinks =
    user?.role === UserRole.Worker ? WORKER_LINKS :
    user?.role === UserRole.Client ? CLIENT_LINKS :
    []

  const homeRoute =
    user?.role === UserRole.Worker ? '/worker' :
    user?.role === UserRole.Client ? '/dashboard' :
    '/'

  const displayName    = user?.name ?? 'Mi cuenta'
  const displayInitial = displayName.charAt(0).toUpperCase()

  const logout = (): void => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    emitAuthChange()
    setUserMenuOpen(false)
    setMobileOpen(false)
    void navigate('/login')
  }

  return (
    <nav style={{ background: theme.card, borderBottom: `1px solid ${theme.border}` }}
      className="sticky top-0 z-50 backdrop-blur-md">
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '72px', paddingTop: '12px', paddingBottom: '12px' }}>

          {/* Logo */}
          <Link
            to={isWorkerLanding ? '/workerlanding' : homeRoute}
            onClick={() => { if (isLanding || isWorkerLanding) window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center flex-shrink-0"
            style={{ textDecoration: 'none' }}
          >
            <img src={logo} alt="HomeFix" style={{ height: '40px', width: 'auto', marginLeft: '-10px' }} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {isLanding && (
              <>
                <button
                  onClick={() => document.getElementById('como-funciona-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¿Cómo funciona HomeFix?
                </button>
                <button
                  onClick={() => document.getElementById('que-ofrecemos-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¿Qué te ofrecemos?
                </button>
                <button
                  onClick={() => document.getElementById('confia-en-nosotros')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¡Confiá en nosotros!
                </button>
                <button
                  onClick={() => document.getElementById('redes-sociales-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Nuestras redes sociales
                </button>
                <Link
                  to="/workerLanding"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', color: theme.primaryDark, transition: 'background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Quiero trabajar!
                </Link>
              </>
            )}
            {isWorkerLanding && (
              <>
                <button
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¿Cómo funciona HomeFix?
                </button>
                <button
                  onClick={() => document.getElementById('que-ofrecemos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¿Qué te ofrecemos?
                </button>
                <button
                  onClick={() => document.getElementById('como-validarme')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  ¿Cómo me valido?
                </button>
                <button
                  onClick={() => document.getElementById('redes-sociales')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.primaryDark; (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.muted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Nuestras redes sociales
                </button>
                <Link
                  to="/"
                  onClick={() => window.scrollTo(0, 0)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', color: theme.primaryDark, transition: 'background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.hover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  HomeFix Clientes
                </Link>
              </>
            )}
            {navLinks.map((link) => {
              const active  = pathname === link.href
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
                    backgroundColor: active ? theme.activeBg : hovered ? theme.hover : 'transparent',
                    color:           active || hovered ? theme.primaryDark : theme.muted,
                  }}
                  onMouseEnter={() => { setHoveredLink(link.label) }}
                  onMouseLeave={() => { setHoveredLink(null) }}
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
                <Link to="/login"
                  style={{ display: 'block', width: '130px', textAlign: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '8px 0', borderRadius: '8px', transition: 'opacity 0.15s', ...((isWorkerLanding || isLanding) ? { background: theme.primaryDark, color: '#fff' } : { color: theme.muted }) }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Iniciar Sesión
                </Link>
                <Link to="/signup"
                  style={{ display: 'block', width: '130px', textAlign: 'center', background: theme.accent, color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '8px 0', borderRadius: '8px', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setUserMenuOpen(!userMenuOpen) }}
                  onMouseEnter={() => { setUserBtnHover(true) }}
                  onMouseLeave={() => { setUserBtnHover(false) }}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '8px',
                    padding:    '8px 12px',
                    borderRadius: '8px',
                    border:     `1px solid ${theme.border}`,
                    background: userBtnHover ? theme.hover : 'transparent',
                    cursor:     'pointer',
                    transition: 'background 0.15s',
                    color:      'inherit',
                  }}
                >
                  {user?.photo ? (
                    <img src={user.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: theme.primaryDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                      {displayInitial}
                    </div>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: '500', color: theme.primaryDark, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <ChevronDown style={{ width: '16px', height: '16px', color: theme.muted, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {userMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, marginTop: '8px', width: '208px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '4px 0', zIndex: 50 }}>
                    <Link
                      to={homeRoute}
                      onClick={() => { setUserMenuOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', color: theme.primaryDark, textDecoration: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.hover }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <User style={{ width: '16px', height: '16px', color: theme.muted }} />
                      Mi Perfil
                    </Link>
                    <div style={{ borderTop: `1px solid ${theme.border}`, margin: '4px 0' }} />
                    <button
                      onClick={logout}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', color: theme.danger, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.dangerHoverBg }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
            onClick={() => { setMobileOpen(!mobileOpen) }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: theme.muted, alignSelf: 'center' }}
            className="md:hidden"
          >
            {mobileOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ borderTop: `1px solid ${theme.border}`, padding: '16px 0' }} className="md:hidden">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => { setMobileOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textDecoration: 'none', color: theme.primaryDark, backgroundColor: pathname === link.href ? theme.activeBg : 'transparent' }}
                >
                  <link.icon style={{ width: '16px', height: '16px' }} />
                  {link.label}
                </Link>
              ))}
              {isLanding && (
                <>
                  <button onClick={() => { document.getElementById('como-funciona-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¿Cómo funciona HomeFix?
                  </button>
                  <button onClick={() => { document.getElementById('que-ofrecemos-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¿Qué te ofrecemos?
                  </button>
                  <button onClick={() => { document.getElementById('confia-en-nosotros')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¡Confiá en nosotros!
                  </button>
                  <button onClick={() => { document.getElementById('redes-sociales-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    Nuestras redes sociales
                  </button>
                </>
              )}
              {isWorkerLanding && (
                <>
                  <button onClick={() => { document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¿Cómo funciona HomeFix Profesional?
                  </button>
                  <button onClick={() => { document.getElementById('que-ofrecemos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¿Qué te ofrecemos?
                  </button>
                  <button onClick={() => { document.getElementById('como-validarme')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    ¿Cómo me valido?
                  </button>
                  <button onClick={() => { document.getElementById('redes-sociales')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileOpen(false) }}
                    style={{ display: 'flex', width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.primaryDark, textAlign: 'left' }}>
                    Nuestras redes sociales
                  </button>
                </>
              )}
            </div>
            <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
              {isLoggedIn ? (
                <>
                  <Link to={homeRoute} onClick={() => { setMobileOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: theme.primaryDark, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 16px', textDecoration: 'none' }}>
                    <User style={{ width: '16px', height: '16px' }} /> Mi Perfil
                  </Link>
                  <button onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: theme.danger, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '10px 16px' }}>
                    <LogOut style={{ width: '16px', height: '16px' }} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  {isWorkerLanding && (
                    <Link to="/" onClick={() => { setMobileOpen(false); window.scrollTo(0, 0) }}
                      style={{ display: 'block', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: theme.primaryDark, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px', textDecoration: 'none' }}>
                      Soy Cliente
                    </Link>
                  )}
                  <Link to="/login" onClick={() => { setMobileOpen(false) }}
                    style={{ display: 'block', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: theme.primaryDark, border: `1px solid ${theme.primaryDark}`, borderRadius: '8px', padding: '10px', textDecoration: 'none' }}>
                    Iniciar Sesión
                  </Link>
                  <Link to="/signup" onClick={() => { setMobileOpen(false) }}
                    style={{ display: 'block', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#fff', background: theme.accent, borderRadius: '8px', padding: '10px', textDecoration: 'none' }}>
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
