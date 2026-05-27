import { useNavigate } from 'react-router-dom'
import { Bot, FileText } from 'lucide-react'
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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textAlign: 'center', marginBottom: '12px' }}>
          ¿Cómo querés crear tu publicación?
        </h1>
        <p style={{ fontSize: '18px', color: theme.muted, textAlign: 'center', marginBottom: '64px' }}>
          Elegí la opción que te resulte más cómoda
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
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
