import { useNavigate } from 'react-router-dom'
import { Bot, FileText, ArrowLeft } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import OptionCard from '../components/post/OptionCard'

export default function PostOptions() {
  const navigate = useNavigate()
  const theme = useTheme()

  const cards = [
    {
      icon: Bot,
      title: 'Asistente inteligente',
      desc: 'Respondé algunas preguntas simples y nuestra IA identificará tu problema, te recomendará la categoría adecuada y te guiará en todo el proceso.',
      linkText: 'Comenzar con IA',
      path: '/diagnosis',
    },
    {
      icon: FileText,
      title: 'Formulario manual',
      desc: 'Completá vos mismo los datos del problema: título, categoría, descripción, fechas y dirección. Ideal si ya sabés exactamente qué necesitas.',
      linkText: 'Crear manualmente',
      path: '/manual-post',
    },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '16px 2rem 0' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: theme.muted, padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', transition: 'color 0.15s, background 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Volver
        </button>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px 100px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textAlign: 'center', marginBottom: '12px' }}>
          ¿Cómo querés crear tu publicación?
        </h1>
        <p style={{ fontSize: '18px', color: theme.muted, textAlign: 'center', marginBottom: '64px' }}>
          Elegí la opción que te resulte más cómoda
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {cards.map((card, idx) => (
            <OptionCard
              key={idx}
              icon={card.icon}
              title={card.title}
              description={card.desc}
              linkText={card.linkText}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
