'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { categories } from '@/lib/data/categories'
import { workers } from '@/lib/data/workers'
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  ClipboardList,
  Sparkles,
  Send,
  Calendar,
  HelpCircle,
  CheckCircle,
  Loader2,
  FileText,
  Star,
  MapPin,
  Clock,
  Shield,
  User,
  X
} from 'lucide-react'

type CreationMode = 'select' | 'prompt' | 'form'
type AIStep = 'chat' | 'survey' | 'summary' | 'confirm'

interface SurveyQuestion {
  id: string
  question: string
  type: 'single' | 'multiple' | 'text'
  options?: string[]
  answer?: string | string[]
}

interface AIAnalysis {
  categorias: string[]
  descripcion: string
  urgencia: 'baja' | 'media' | 'alta' | 'urgente'
  titulo: string
  ubicacion?: string
  fecha?: string
}

interface FormData {
  titulo: string
  descripcion: string
  categorias: string[]
  noSeQueCategoria: boolean
  fecha: string
  urgencia: 'baja' | 'media' | 'alta' | 'urgente'
  presupuestoMin: string
  presupuestoMax: string
  ubicacion: string
}

export default function NuevaPublicacionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreationMode>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publicacionCreada, setPublicacionCreada] = useState(false)
  const [publicacionId, setPublicacionId] = useState<string | null>(null)

  // AI Prompt mode state
  const [prompt, setPrompt] = useState('')
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [aiStep, setAiStep] = useState<AIStep>('chat')
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([])
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [recommendedWorkers, setRecommendedWorkers] = useState<typeof workers>([])
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])

  // Form mode state
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descripcion: '',
    categorias: [],
    noSeQueCategoria: false,
    fecha: '',
    urgencia: 'media',
    presupuestoMin: '',
    presupuestoMax: '',
    ubicacion: ''
  })
  const [formStep, setFormStep] = useState(1)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // Detectar si el mensaje necesita mas informacion
  const analyzeMessage = (message: string) => {
    const lower = message.toLowerCase()
    const hasCategory = categories.some(cat => lower.includes(cat.name.toLowerCase()))
    const hasUrgency = ['urgente', 'rapido', 'ya', 'ahora', 'emergencia'].some(w => lower.includes(w))
    const hasLocation = ['zona', 'barrio', 'direccion', 'ubicacion', 'calle'].some(w => lower.includes(w))
    const isDetailed = message.length > 80

    return {
      hasCategory,
      hasUrgency,
      hasLocation,
      isDetailed,
      needsSurvey: !hasCategory || !isDetailed
    }
  }

  // Generar preguntas de encuesta basadas en el analisis
  const generateSurveyQuestions = (analysis: ReturnType<typeof analyzeMessage>, userMessage: string): SurveyQuestion[] => {
    const questions: SurveyQuestion[] = []

    if (!analysis.hasCategory) {
      questions.push({
        id: 'category',
        question: 'Cual de estas categorias describe mejor tu problema?',
        type: 'single',
        options: categories.map(c => c.name)
      })
    }

    questions.push({
      id: 'location',
      question: 'Donde se encuentra el problema?',
      type: 'single',
      options: ['Cocina', 'Bano', 'Sala', 'Dormitorio', 'Patio/Jardin', 'Garage', 'Toda la casa', 'Otro']
    })

    questions.push({
      id: 'urgency',
      question: 'Que tan urgente es?',
      type: 'single',
      options: ['No es urgente (puedo esperar)', 'Normal (esta semana)', 'Urgente (hoy o manana)', 'Emergencia (ahora mismo)']
    })

    questions.push({
      id: 'date',
      question: 'Cuando te gustaria que venga el profesional?',
      type: 'single',
      options: ['Lo antes posible', 'Esta semana', 'La proxima semana', 'Fecha especifica']
    })

    return questions
  }

  // Manejar envio del prompt
  const handleSendPrompt = async () => {
    if (!prompt.trim() || isLoading) return

    const userMessage = prompt.trim()
    setPrompt('')
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    setTimeout(() => {
      const analysis = analyzeMessage(userMessage)

      if (analysis.needsSurvey && aiMessages.length < 2) {
        // Iniciar mini encuesta
        const questions = generateSurveyQuestions(analysis, userMessage)
        setSurveyQuestions(questions)
        setCurrentSurveyIndex(0)

        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Entiendo! Para encontrarte al mejor profesional, necesito algunos datos mas. Te hago unas preguntas rapidas:'
        }])

        setTimeout(() => {
          setAiStep('survey')
        }, 1000)
      } else if (aiMessages.length >= 2 || !analysis.needsSurvey) {
        // Suficiente informacion, generar resumen
        const detectedCategory = categories.find(cat =>
          userMessage.toLowerCase().includes(cat.name.toLowerCase())
        )?.name || 'Plomeria'

        setAiAnalysis({
          categorias: [detectedCategory],
          descripcion: userMessage,
          urgencia: analysis.hasUrgency ? 'alta' : 'media',
          titulo: `Servicio de ${detectedCategory} - ${userMessage.slice(0, 40)}...`
        })

        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Perfecto! Ya tengo toda la informacion. Te muestro un resumen de tu solicitud:'
        }])

        setTimeout(() => {
          setAiStep('summary')
        }, 500)
      }

      setIsLoading(false)
    }, 1500)
  }

  // Manejar respuesta de encuesta
  const handleSurveyAnswer = (answer: string) => {
    const updatedQuestions = [...surveyQuestions]
    updatedQuestions[currentSurveyIndex].answer = answer
    setSurveyQuestions(updatedQuestions)

    if (currentSurveyIndex < surveyQuestions.length - 1) {
      setCurrentSurveyIndex(prev => prev + 1)
    } else {
      // Encuesta completada, generar analisis
      const categoryAnswer = updatedQuestions.find(q => q.id === 'category')?.answer as string
      const urgencyAnswer = updatedQuestions.find(q => q.id === 'urgency')?.answer as string
      const locationAnswer = updatedQuestions.find(q => q.id === 'location')?.answer as string

      const urgencyMap: Record<string, AIAnalysis['urgencia']> = {
        'No es urgente (puedo esperar)': 'baja',
        'Normal (esta semana)': 'media',
        'Urgente (hoy o manana)': 'alta',
        'Emergencia (ahora mismo)': 'urgente'
      }

      const firstUserMessage = aiMessages.find(m => m.role === 'user')?.content || ''

      setAiAnalysis({
        categorias: [categoryAnswer || 'General'],
        descripcion: firstUserMessage,
        urgencia: urgencyMap[urgencyAnswer] || 'media',
        titulo: `Servicio de ${categoryAnswer || 'General'} - ${locationAnswer || 'Hogar'}`,
        ubicacion: locationAnswer
      })

      setAiStep('summary')
    }
  }

  // Buscar trabajadores recomendados
  const findRecommendedWorkers = () => {
    if (!aiAnalysis) return

    setIsLoading(true)

    setTimeout(() => {
      // Filtrar por categoria
      const categoryName = aiAnalysis.categorias[0]
      const filtered = workers.filter(w => {
        const workerCat = w.category.toLowerCase()
        const searchCat = categoryName.toLowerCase()
        return workerCat.includes(searchCat) || searchCat.includes(workerCat) || w.verified
      }).slice(0, 4)

      setRecommendedWorkers(filtered.length > 0 ? filtered : workers.slice(0, 4))
      setAiStep('confirm')
      setIsLoading(false)
    }, 1500)
  }

  // Publicar publicacion para todos
  const handlePublish = async () => {
    setIsPublishing(true)

    setTimeout(() => {
      const newId = `pub-${Date.now()}`
      // Guardar la nueva publicacion en sessionStorage para que aparezca en Mis Publicaciones
      const nuevaPublicacion = {
        id: newId,
        titulo: aiAnalysis?.titulo || 'Nueva solicitud',
        descripcion: aiAnalysis?.descripcion || '',
        categoria: aiAnalysis?.categorias[0] || 'General',
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaServicio: aiAnalysis?.fecha || '',
        ubicacion: aiAnalysis?.ubicacion || 'Buenos Aires',
        urgencia: aiAnalysis?.urgencia || 'media',
        solicitudes: [],
        tipo: 'publicacion'
      }
      const existing = JSON.parse(sessionStorage.getItem('homefix_publicaciones') || '[]')
      sessionStorage.setItem('homefix_publicaciones', JSON.stringify([nuevaPublicacion, ...existing]))
      setPublicacionId(newId)
      setIsPublishing(false)
      setPublicacionCreada(true)
    }, 2000)
  }

  // Form handlers
  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoryId)
        ? prev.categorias.filter(id => id !== categoryId)
        : [...prev.categorias, categoryId]
    }))
  }

  const handleFormSubmit = async () => {
    setIsPublishing(true)
    setTimeout(() => {
      const newId = `pub-${Date.now()}`
      const nuevaPublicacion = {
        id: newId,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categorias.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'General',
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaServicio: formData.fecha,
        ubicacion: formData.ubicacion || 'Buenos Aires',
        urgencia: formData.urgencia,
        solicitudes: [],
        tipo: 'publicacion'
      }
      const existing = JSON.parse(sessionStorage.getItem('homefix_publicaciones') || '[]')
      sessionStorage.setItem('homefix_publicaciones', JSON.stringify([nuevaPublicacion, ...existing]))
      setPublicacionId(newId)
      setIsPublishing(false)
      setPublicacionCreada(true)
    }, 2000)
  }

  // Reset
  const resetAll = () => {
    setPublicacionCreada(false)
    setPublicacionId(null)
    setMode('select')
    setAiMessages([])
    setAiAnalysis(null)
    setAiStep('chat')
    setSurveyQuestions([])
    setCurrentSurveyIndex(0)
    setRecommendedWorkers([])
    setSelectedWorkers([])
    setFormData({
      titulo: '',
      descripcion: '',
      categorias: [],
      noSeQueCategoria: false,
      fecha: '',
      urgencia: 'media',
      presupuestoMin: '',
      presupuestoMax: '',
      ubicacion: ''
    })
    setFormStep(1)
  }

  // Success screen
  if (publicacionCreada) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="p-8 sm:p-12 text-center border-border">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Publicacion Creada Exitosamente
            </h1>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Tu solicitud ya esta visible para los profesionales verificados en tu zona. Pronto te contactaran.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/mis-publicaciones')}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Ver mis publicaciones
              </Button>
              <Button variant="outline" onClick={resetAll}>
                Crear otra publicacion
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-primary py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/mis-publicaciones"
            className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a mis publicaciones
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Nueva Publicacion</h1>
          <p className="text-white/70 mt-2">Describe tu problema y conecta con profesionales verificados</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Como queres crear tu publicacion?
              </h2>
              <p className="text-muted-foreground">
                Elige la opcion que te resulte mas comoda
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {/* AI Prompt Option */}
              <Card
                className="p-6 sm:p-8 border-border hover:border-accent/50 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setMode('prompt')}
              >
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Asistente Inteligente
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe tu problema en tus propias palabras y nuestra IA te guiara para crear la publicacion perfecta.
                </p>
                <div className="flex items-center text-accent text-sm font-medium">
                  Comenzar con IA
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>

              {/* Form Option */}
              <Card
                className="p-6 sm:p-8 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setMode('form')}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <ClipboardList className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Formulario Guiado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa un formulario paso a paso con fecha, categoria y descripcion de tu problema.
                </p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Completar formulario
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </div>

            {/* Link to diagnostic */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                No sabes exactamente que necesitas?
              </p>
              <Link
                href="/diagnostico"
                className="inline-flex items-center text-accent hover:text-accent/80 font-medium text-sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Usa nuestro diagnostico inteligente
              </Link>
            </div>
          </div>
        )}

        {/* AI Prompt Mode */}
        {mode === 'prompt' && (
          <div className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => {
                setMode('select')
                setAiMessages([])
                setAiAnalysis(null)
                setAiStep('chat')
                setSurveyQuestions([])
              }}
              className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cambiar metodo
            </button>

            {/* Progress indicator for AI flow */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['Describir', 'Detalles', 'Confirmar', 'Conectar'].map((step, idx) => (
                <div key={step} className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${(aiStep === 'chat' && idx === 0) ||
                      (aiStep === 'survey' && idx === 1) ||
                      (aiStep === 'summary' && idx === 2) ||
                      (aiStep === 'workers' && idx === 3)
                      ? 'bg-accent text-white'
                      : idx < ['chat', 'survey', 'summary', 'workers'].indexOf(aiStep)
                        ? 'bg-accent/20 text-accent'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                    {step}
                  </div>
                  {idx < 3 && <div className="w-6 h-0.5 bg-secondary mx-1" />}
                </div>
              ))}
            </div>

            <Card className="border-border overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Asistente HomeFix</h3>
                    <p className="text-xs text-muted-foreground">Te ayudo a crear tu publicacion</p>
                  </div>
                </div>
              </div>

              {/* Chat / Survey / Summary / Workers */}
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 space-y-4 bg-background">
                {/* Chat Messages */}
                {aiStep === 'chat' && (
                  <>
                    {aiMessages.length === 0 && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-accent" />
                        </div>
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                          <p className="text-sm text-foreground">
                            Hola! Soy tu asistente de HomeFix. Contame con tus palabras que problema tenes en tu hogar y te ayudo a encontrar al profesional ideal.
                          </p>
                        </div>
                      </div>
                    )}

                    {aiMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-accent" />
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-secondary/50 text-foreground rounded-tl-none'
                          }`}>
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-accent" />
                        </div>
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Analizando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Survey Step */}
                {aiStep === 'survey' && surveyQuestions.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-4 py-3 mb-4">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Pregunta {currentSurveyIndex + 1} de {surveyQuestions.length}
                          </p>
                          <p className="text-sm text-foreground">
                            {surveyQuestions[currentSurveyIndex].question}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {surveyQuestions[currentSurveyIndex].options?.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleSurveyAnswer(option)}
                              className="px-4 py-3 text-sm text-left rounded-xl border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${((currentSurveyIndex + 1) / surveyQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Step */}
                {aiStep === 'summary' && aiAnalysis && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-accent" />
                      </div>
                      <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-4 py-3">
                        <p className="text-sm text-foreground">
                          Perfecto! Este es el resumen de tu solicitud. Confirma que todo este correcto:
                        </p>
                      </div>
                    </div>

                    <Card className="p-5 border-accent/30 bg-accent/5">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent" />
                        Resumen de solicitud
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-muted-foreground">Titulo:</span>
                          <span className="font-medium text-foreground text-right">{aiAnalysis.titulo}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Categoria:</span>
                          <div className="flex gap-1">
                            {aiAnalysis.categorias.map(cat => (
                              <Badge key={cat} className="bg-primary/10 text-primary border-0">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Urgencia:</span>
                          <Badge className={`border-0 ${aiAnalysis.urgencia === 'urgente' ? 'bg-red-100 text-red-700' :
                              aiAnalysis.urgencia === 'alta' ? 'bg-orange-100 text-orange-700' :
                                aiAnalysis.urgencia === 'media' ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                            }`}>
                            {aiAnalysis.urgencia.charAt(0).toUpperCase() + aiAnalysis.urgencia.slice(1)}
                          </Badge>
                        </div>
                        {aiAnalysis.ubicacion && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Ubicacion:</span>
                            <span className="font-medium text-foreground">{aiAnalysis.ubicacion}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-border">
                          <span className="text-muted-foreground block mb-1">Descripcion:</span>
                          <p className="text-foreground">{aiAnalysis.descripcion}</p>
                        </div>
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAiStep('chat')
                          setAiAnalysis(null)
                        }}
                        className="flex-1"
                      >
                        Modificar
                      </Button>
                      <Button
                        onClick={findRecommendedWorkers}
                        disabled={isLoading}
                        className="flex-1 bg-accent hover:bg-accent/90 text-white"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Buscando...
                          </>
                        ) : (
                          <>
                            Buscar profesionales
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Confirmation Step */}
                {aiStep === 'confirm' && aiAnalysis && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-accent" />
                      </div>
                      <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-4 py-3">
                        <p className="text-sm text-foreground">
                          Perfecto! Aqui esta tu publicacion. Confirmala para publicarla para todos los profesionales.
                        </p>
                      </div>
                    </div>

                    {/* Publication Details */}
                    <Card className="p-6 space-y-5 border-border bg-card">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-3">{aiAnalysis.titulo}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{aiAnalysis.descripcion}</p>
                      </div>

                      <div className="border-t border-border pt-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Categoria</span>
                          <Badge className="bg-primary/10 text-primary border-0">
                            {aiAnalysis.categorias[0]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">Urgencia</span>
                          <Badge className={`border-0 capitalize ${
                            aiAnalysis.urgencia === 'urgente' ? 'bg-destructive text-white' :
                            aiAnalysis.urgencia === 'alta' ? 'bg-orange-500/10 text-orange-700' :
                            aiAnalysis.urgencia === 'media' ? 'bg-amber-500/10 text-amber-700' :
                            'bg-green-500/10 text-green-700'
                          }`}>
                            {aiAnalysis.urgencia}
                          </Badge>
                        </div>
                        {aiAnalysis.fecha && (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Fecha requerida
                            </span>
                            <span className="text-sm font-medium text-foreground">{aiAnalysis.fecha}</span>
                          </div>
                        )}
                        {aiAnalysis.ubicacion && (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Ubicacion
                            </span>
                            <span className="text-sm font-medium text-foreground">{aiAnalysis.ubicacion}</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Info */}
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Esta publicacion sera visible para todos los profesionales {aiAnalysis.categorias[0]}s verificados de tu zona. Podran postularse y contactarte directamente.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setAiStep('summary')}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                      </Button>
                      <Button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="flex-1 bg-accent hover:bg-accent/90 text-white"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Publicando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar y publicar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input (only in chat mode) */}
              {aiStep === 'chat' && !aiAnalysis && (
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendPrompt()}
                      placeholder="Describe tu problema..."
                      className="flex-1 px-4 py-2.5 border border-input rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendPrompt}
                      disabled={!prompt.trim() || isLoading}
                      className="bg-accent hover:bg-accent/90 text-white px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Form Mode */}
        {mode === 'form' && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setMode('select')
                setFormStep(1)
              }}
              className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cambiar metodo
            </button>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${formStep >= step ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                    {formStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 sm:w-20 h-1 mx-1 rounded ${formStep > step ? 'bg-primary' : 'bg-secondary'}`} />
                  )}
                </div>
              ))}
            </div>

            <Card className="p-6 border-border">
              {/* Step 1: Category & Date */}
              {formStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Que tipo de servicio necesitas?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryToggle(cat.id)}
                          className={`p-3 text-sm text-left rounded-lg border transition-all ${formData.categorias.includes(cat.id)
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/50'
                            }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setMode('prompt')
                        setFormStep(1)
                        setFormData(prev => ({ ...prev, noSeQueCategoria: false, categorias: [] }))
                      }}
                      className={`mt-3 w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed text-sm transition-all ${formData.noSeQueCategoria
                          ? 'border-accent bg-accent/5 text-accent font-medium'
                          : 'border-border text-muted-foreground hover:border-accent/50 hover:text-accent'
                        }`}
                    >
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      <span>No se que categoria necesito — Dejame que la IA me ayude a identificarlo</span>
                      <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Cuando lo necesitas?
                    </label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Urgencia
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-700' },
                        { value: 'media', label: 'Media', color: 'bg-amber-100 text-amber-700' },
                        { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
                        { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFormData(prev => ({ ...prev, urgencia: opt.value as FormData['urgencia'] }))}
                          className={`p-2.5 text-sm rounded-lg border transition-all ${formData.urgencia === opt.value
                              ? `border-transparent ${opt.color} font-medium`
                              : 'border-border hover:border-primary/50'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setFormStep(2)}
                    disabled={formData.categorias.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Description */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Titulo de tu solicitud
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ej: Reparacion de canilla en cocina"
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Describe el problema en detalle
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Explica que problema tenes, donde esta ubicado, hace cuanto tiempo lo notas, etc."
                      rows={5}
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setFormStep(1)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Atras
                    </Button>
                    <Button
                      onClick={() => setFormStep(3)}
                      disabled={!formData.titulo || !formData.descripcion}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Budget */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ubicacion
                    </label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                      placeholder="Villa Luzuriaga, La Matanza"
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                  </div>

                  {/* Summary */}
                  <Card className="p-4 bg-secondary/30 border-border">
                    <h4 className="font-medium text-foreground mb-3 text-sm">Resumen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categoria:</span>
                        <span className="text-foreground">
                          {formData.noSeQueCategoria
                            ? 'Por definir'
                            : formData.categorias.map(id => categories.find(c => c.id === id)?.name).join(', ')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Titulo:</span>
                        <span className="text-foreground">{formData.titulo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Urgencia:</span>
                        <span className="text-foreground capitalize">{formData.urgencia}</span>
                      </div>
                    </div>
                  </Card>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setFormStep(2)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Atras
                    </Button>
                    <Button
                      onClick={handleFormSubmit}
                      disabled={isPublishing || !formData.ubicacion}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publicar solicitud
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
