import { useNavigate } from 'react-router-dom'
import { Bot, FileText } from 'lucide-react'
import OptionCard from '../components/post/OptionCard'

export default function PostOptions() {
  const navigate = useNavigate()

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
    <main className="min-h-screen bg-card">
      <div className="max-w-[900px] mx-auto px-6 py-[100px]">
        <h1 className="text-[36px] font-bold text-primary-dark text-center mb-3">
          ¿Cómo querés crear tu publicación?
        </h1>
        <p className="text-lg text-muted text-center mb-16">
          Elegí la opción que te resulte más cómoda
        </p>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
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
