// src/views/WorkerLanding.tsx
// Self-contained HomeFix landing page for PROFESSIONALS (workers).
// Companion to Landing.tsx. All styles come from landing.css + worker-landing.css
// (both scoped under .lp-root) so the app's global button/a/input/body rules
// in index.css cannot interfere. Uses lucide-react + react-router only.
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Check, CheckCircle2, TrendingUp, CalendarClock, Star,
  MapPin, MessageSquare, BadgeCheck, Wallet, ShieldCheck, type LucideIcon,
} from 'lucide-react'
import '../components/landing/landing.css'
import '../components/landing/worker-landing.css'
import {
  workerStats, benefits, workerSteps, workerFeatures, requirements, workerTestimonials,
} from '../data/workerLandingData'
import logo from '../assets/homefix-logo.png'
import logoNeg from '../assets/homefix-logo-negative.png'
import heroBg from '../assets/hero-workers-wide.jpg'
import heroPortrait from '../assets/hero-workers.jpg'

// icon lookups keep the data files free of JSX imports
const benefitIcons: LucideIcon[] = [TrendingUp, CalendarClock, Star]
const featureIcons: LucideIcon[] = [MapPin, CalendarClock, MessageSquare, Star, BadgeCheck]

const footerCols: { title: string; links: string[] }[] = [
  { title: 'Para Profesionales', links: ['Registrarme', 'Cómo funciona', 'Verificación de perfil', 'Centro de ayuda'] },
  { title: 'Empresa', links: ['Sobre Nosotros', 'Buscar Profesionales', 'Seguridad', 'Contacto'] },
  { title: 'Legal', links: ['Términos de Servicio', 'Privacidad', 'Cookies'] },
]

export default function WorkerLanding() {
  const navigate = useNavigate()

  return (
    <main className="lp-root">


      {/* HERO */}
      <section className="lp-hero lp-hero-worker">
        <div className="lp-hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="lp-hero-overlay" />
        <div className="lp-container lp-hero-content">
          <div className="lp-hero-inner">
            <h1 className="lp-hero-title">Tu oficio, más clientes y <span className="lp-accent">cobros sin vueltas</span></h1>
            <p className="lp-hero-sub">Sumate a HomeFix y recibí solicitudes de trabajo de hogares cerca tuyo. Vos elegís qué aceptar, cuándo y cómo.</p>
            <div className="lp-hero-cta">
              <button className="lp-btn lp-btn-lg lp-btn-primary" onClick={() => navigate('/register/worker')}>Registrarme como profesional <ArrowRight className="lp-btn-ico" /></button>
              <button className="lp-btn lp-btn-lg lp-btn-glass" onClick={() => navigate('/diagnosis')}>¿Cómo funciona?</button>
            </div>
            <div className="lp-hero-trust">
              <span><CheckCircle2 size={18} /> Registro gratis</span>
              <span><CheckCircle2 size={18} /> Sin comisiones ocultas</span>
            </div>
            <div className="lp-wstats">
              {workerStats.map((s) => (
                <div key={s.label} className="lp-wstat">
                  <div className="lp-wstat-val">{s.value}</div>
                  <div className="lp-wstat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="lp-section lp-soft-band">
        <div className="lp-container">
          <div className="lp-head">
            <p className="lp-eyebrow">Por qué sumarte</p>
            <h2 className="lp-h2">Hacé crecer tu trabajo, a tu manera</h2>
            <p className="lp-lead">HomeFix te conecta con la demanda. Vos ponés el oficio; nosotros, los clientes.</p>
          </div>
          <div className="lp-grid-3">
            {benefits.map((b, i) => {
              const Icon = benefitIcons[i]
              return (
                <div key={b.title} className="lp-trust-card">
                  <div className="lp-trust-blob" />
                  <div className="lp-trust-tile"><Icon size={28} /></div>
                  <span className="lp-trust-tag">{b.tag}</span>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              )
            })}
          </div>
          <div className="lp-center lp-mt">
            <button className="lp-btn lp-btn-lg lp-btn-primary" onClick={() => navigate('/register/worker')}>Crear mi perfil gratis <ArrowRight className="lp-btn-ico" /></button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-navy-band">
        <div className="lp-container">
          <div className="lp-head">
            <p className="lp-eyebrow">Cómo Funciona</p>
            <h2 className="lp-h2 on-dark">Empezá en 4 pasos</h2>
            <p className="lp-lead on-dark">Del registro a tu primer trabajo, sin vueltas.</p>
          </div>
          <div className="lp-steps lp-steps-4">
            {workerSteps.map((s) => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-line">
                  <div className={`lp-step-num${s.accent ? ' accent' : ''}`}>{s.n}</div>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="lp-center lp-mt">
            <button className="lp-btn lp-btn-lg lp-btn-primary" onClick={() => navigate('/register/worker')}>Comenzar mi registro <ArrowRight className="lp-btn-ico" /></button>
          </div>
        </div>
      </section>

      {/* VERIFY = MORE WORK (split media) */}
      <section className="lp-section">
        <div className="lp-container lp-split">
          <div>
            <p className="lp-eyebrow">Perfil verificado</p>
            <h2 className="lp-h2">Un perfil verificado trabaja más</h2>
            <p className="lp-lead" style={{ marginTop: 14 }}>Los clientes eligen con confianza. Cuando validás tu identidad y sumás tu matrícula, tu perfil aparece destacado y recibís más solicitudes.</p>
            <div className="lp-req">
              {requirements.map((r) => (
                <div key={r.text} className="lp-req-item">
                  <span className="lp-req-check"><Check /></span>
                  <span>{r.text}{r.optional && <span className="lp-req-opt">opcional</span>}</span>
                </div>
              ))}
            </div>
            <div className="lp-mt">
              <button className="lp-btn lp-btn-lg lp-btn-outline-navy" onClick={() => navigate('/register/worker')}>Verificar mi perfil <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="lp-split-media">
            <img src={heroPortrait} alt="Profesional de HomeFix" />
            <span className="lp-split-badge"><BadgeCheck size={16} /> Identidad verificada</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-feat-band">
        <div className="lp-container lp-feat-grid">
          <div className="lp-feat-logo">
            <div className="lp-feat-glow" />
            <img src={logo} alt="HomeFix" />
          </div>
          <div>
            <p className="lp-eyebrow">Tus herramientas</p>
            <h2 className="lp-h2">Todo para gestionar tu trabajo</h2>
            <div className="lp-feat-list">
              {workerFeatures.map((f, i) => {
                const Icon = featureIcons[i]
                return (
                  <div key={f.title} className="lp-feat-item">
                    <div className="lp-feat-icon"><Icon size={24} /></div>
                    <div><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </div>
                )
              })}
            </div>
            <div className="lp-mt">
              <button className="lp-btn lp-btn-lg lp-btn-primary" onClick={() => navigate('/register/worker')}>Quiero recibir trabajos <ArrowRight className="lp-btn-ico" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section" style={{ background: '#F1F5F9' }}>
        <div className="lp-container">
          <div className="lp-head">
            <span className="lp-pill"><Wallet size={15} /> Profesionales que ya trabajan con HomeFix</span>
            <h2 className="lp-h2">Lo que dicen los que ya se sumaron</h2>
            <p className="lp-lead">Electricistas, plomeros y carpinteros haciendo crecer su agenda.</p>
          </div>
          <div className="lp-grid-3">
            {workerTestimonials.map((r) => (
              <div key={r.author} className="lp-review">
                <div className="lp-review-top">
                  <div>
                    <h4>{r.author}</h4>
                    <p className="lp-review-trade">{r.trade}</p>
                    <p className="lp-review-date">{r.date}</p>
                  </div>
                  <span className="lp-review-tag">Verificado</span>
                </div>
                <div className="lp-review-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={i < r.rating ? '' : 'empty'} />
                  ))}
                </div>
                <p className="lp-review-text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-section lp-navy-band lp-final">
        <div className="lp-blob tl" /><div className="lp-blob br" />
        <div className="lp-container lp-final-inner">
          <img className="lp-final-mark" src={logoNeg} alt="HomeFix" />
          <h2>Tu próximo trabajo te está esperando</h2>
          <p>Creá tu perfil gratis y empezá a recibir solicitudes de clientes de tu zona esta misma semana.</p>
          <div className="lp-final-cta">
            <button className="lp-btn lp-btn-xl lp-btn-primary" onClick={() => navigate('/register/worker')}>Registrarme ahora <ArrowRight className="lp-btn-ico" /></button>
            <button className="lp-btn lp-btn-xl lp-btn-glass-2" onClick={() => navigate('/login')}><ShieldCheck className="lp-btn-ico" /> Ya tengo cuenta</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <img className="lp-footer-mark" src={logoNeg} alt="HomeFix" />
              <p>La plataforma que conecta a profesionales verificados con los hogares que los necesitan. Más trabajo, menos vueltas, tu reputación siempre con vos.</p>
              <div className="lp-footer-badges">
                <span className="lp-fbadge accent"><CheckCircle2 size={14} /> Registro gratis</span>
                <span className="lp-fbadge"><ShieldCheck size={14} /> Pagos protegidos</span>
              </div>
            </div>
            {footerCols.map((col) => (
              <div key={col.title} className="lp-footer-col">
                <h4>{col.title}</h4>
                <ul>{col.links.map((l) => <li key={l}><button onClick={() => navigate('/register/worker')}>{l}</button></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 HomeFix. Todos los derechos reservados.</p>
            <div className="lp-footer-social"><a href="#">LinkedIn</a><a href="#">Twitter</a><a href="#">Instagram</a></div>
          </div>
        </div>
      </footer>
    </main>
  )
}
