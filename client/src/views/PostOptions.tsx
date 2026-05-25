import { useNavigate } from 'react-router-dom'
import { Bot, FileText, ArrowRight } from 'lucide-react'

const theme = {
  primaryDark: '#0F172A',
  accent: '#10B981',
  accentHover: '#059669',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
}

const s = {
  main: { minHeight: '100vh', background: '#FFFFFF' },
  wrapper: { maxWidth: '900px', margin: '0 auto', padding: '100px 24px' },
  title: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textAlign: 'center' as const, marginBottom: '12px' },
  subtitle: { fontSize: '18px', color: theme.muted, textAlign: 'center' as const, marginBottom: '64px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' },
  card: { background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '40px 32px', transition: 'all 0.3s', cursor: 'pointer' },
  iconWrap: { width: '56px', height: '56px', borderRadius: '14px', background: `${theme.accent}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  icon: { width: '28px', height: '28px', color: theme.accent },
  cardTitle: { fontSize: '22px', fontWeight: 700, color: theme.primaryDark, marginBottom: '12px' },
  cardDesc: { fontSize: '15px', color: theme.muted, lineHeight: '1.6', marginBottom: '28px' },
  link: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: theme.accent, border: 'none', background: 'none', padding: '0', cursor: 'pointer' },
  linkIcon: { width: '18px', height: '18px' },
}

export default function PostOptions() {
  const navigate = useNavigate()

  const cards = [
    {
      title: 'Asistente inteligente',
      desc: 'Respondé algunas preguntas simples y nuestra IA identificará tu problema, te recomendará la categoría adecuada y te guiará en todo el proceso.',
      link: 'Comenzar con IA',
      icon: Bot,
      path: '/diagnosis',
    },
    {
      title: 'Formulario manual',
      desc: 'Completá vos mismo los datos del problema: título, categoría, descripción, fechas y dirección. Ideal si ya sabés exactamente qué necesitas.',
      link: 'Crear manualmente',
      icon: FileText,
      path: '/manual-post',
    },
  ]

  return (
    <main style={s.main}>
      <div style={s.wrapper}>
        <h1 style={s.title}>¿Cómo querés crear tu publicación?</h1>
        <p style={s.subtitle}>Elegí la opción que te resulte más cómoda</p>

        <div style={s.grid}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={s.card}
              onClick={() => navigate(card.path)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = theme.accent }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = theme.border }}
            >
              <div style={s.iconWrap}>
                <card.icon style={s.icon} />
              </div>
              <h2 style={s.cardTitle}>{card.title}</h2>
              <p style={s.cardDesc}>{card.desc}</p>
              <button style={s.link}>
                {card.link}
                <ArrowRight style={s.linkIcon} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
