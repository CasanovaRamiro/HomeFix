import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Zap, Target, Bot, Loader2, CheckCircle } from 'lucide-react'
import { useCreatePost } from '../hooks/useCreatePost'
import { useDiagnosisChat } from '../hooks/useDiagnosisChat'
import SubmitButton from '../components/ui/SubmitButton'

export default function AiDiagnosis() {
  const navigate = useNavigate()
  const { form, setForm, formError, formSubmitting, formSuccess, handleFocus, handleBlur, handleSubmit } = useCreatePost()

  const { messages, input, setInput, loading, suggestion, conversationDone, chatEndRef, handleSend, handleKeyDown } = useDiagnosisChat((data) => {
    setForm({
      title: data.suggestedTitle || '',
      categoryId: String(data.suggestedCategoryId || ''),
      description: '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      address: data.address || '',
    })
  })

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none border border-border bg-background text-primary-dark transition-all duration-300 box-border"

  const infoCards = [
    { title: 'Rápido', description: 'Solo 2 minutos para completar el diagnóstico completo', icon: Zap },
    { title: 'Preciso', description: 'Tecnología IA para identificar exactamente qué necesitas', icon: Target },
    { title: 'Personalizado', description: 'Recomendaciones basadas en tu ubicación y urgencia', icon: Sparkles },
  ]

  const chipStyles = {
    high: { bg: '#D1FAE5', color: '#047857' },
    medium: { bg: '#FEF3C7', color: '#B45309' },
    low: { bg: '#FEE2E2', color: '#B91C1C' },
  } as const

  const chip = (confidence: string) => {
    const style = confidence === 'high' ? chipStyles.high : confidence === 'medium' ? chipStyles.medium : chipStyles.low
    return { background: style.bg, color: style.color }
  }
  const chipLabel = (confidence: string) => {
    if (confidence === 'high') return 'Alta'
    if (confidence === 'medium') return 'Media'
    return 'Baja'
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-muted">Asistido por Inteligencia Artificial</span>
            </div>
          </div>
          <h1 className="text-[36px] font-bold text-primary-dark text-balance mb-4">Diagnóstico Inteligente</h1>
          <p className="text-lg text-muted max-w-[672px] mx-auto text-balance">
            Responde algunas preguntas simples y nuestro sistema te conectará con el profesional perfecto para tu problema.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-20">
          {infoCards.map((card, idx) => (
            <div key={idx} className="p-8 rounded-2xl bg-card border border-border text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto">
                <card.icon className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-primary-dark mt-4 mb-2">{card.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden bg-card border border-border mb-8">
          <div className="flex items-center gap-3 px-6 py-4 bg-primary-dark">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Asistente HomeFix</p>
              <p className="text-xs text-secondary">Online</p>
            </div>
          </div>

          <div className="p-6 bg-[#E5DDD5] min-h-[420px] max-h-[500px] overflow-y-auto flex flex-col gap-4">
            {messages.filter(m => m.role === 'model').length === 0 && !loading && (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 text-muted animate-spin" />
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              return (
                <div key={idx}
                  className="max-w-[75%] px-4 py-3 text-sm leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  style={{
                    background: isUser ? '#DCF8C6' : '#FFFFFF',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    color: '#111',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.text}
                </div>
              )
            })}

            {loading && (
              <div className="flex items-center gap-2 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.1)] bg-white rounded-[18px_18px_18px_4px] self-start">
                {[0, 1, 2].map(i => (
                  <span key={i}
                    className="w-2 h-2 rounded-full bg-muted animate-bounce inline-block"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {!conversationDone && (
            <div className="px-6 py-4 bg-background border-t border-border">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribí tu mensaje..."
                  disabled={loading}
                  className="flex-1 px-5 py-3 rounded-full text-sm outline-none border border-border bg-card text-primary-dark transition-all duration-300"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border-none cursor-pointer transition-all duration-300
                    hover:bg-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {suggestion && (
          <div className="rounded-2xl p-10 bg-card border border-border">
            {formSuccess ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-primary-dark mb-2">¡Solicitud publicada con éxito!</h2>
                <p className="text-muted mb-6">Pronto recibirás respuestas de profesionales cercanos.</p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 px-4 rounded-xl font-semibold text-base border-none cursor-pointer
                    bg-secondary text-white hover:bg-secondary-hover hover:scale-105 transition-all duration-300"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Diagnóstico Completo</span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary-dark mt-4">Resultado del Diagnóstico</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 rounded-xl bg-background border border-border">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Título sugerido</p>
                    <p className="font-semibold text-primary-dark">{suggestion.suggestedTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Categoría</p>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={chip(suggestion.confidence)}
                    >
                      {suggestion.suggestedCategoryName}
                    </span>
                  </div>
                  <div className="col-span-full">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Posible problema</p>
                    <p className="font-semibold text-sm font-normal text-muted">{suggestion.possibleIssue}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Confianza</p>
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      style={chip(suggestion.confidence)}
                    >
                      {chipLabel(suggestion.confidence)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-primary-dark mb-2">Completá los datos faltantes</h3>
                    <p className="text-sm text-muted">Completá la siguiente información para publicar tu solicitud</p>
                  </div>

                  {formError && <div className="p-4 rounded-lg text-sm bg-[#FEF2F2] text-danger border border-[#FECACA] mb-4">{formError}</div>}

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-6">
                    <div>
                      <label className="text-sm font-medium text-primary-dark block mb-2">Fecha de inicio</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                        required
                        className={inputClass}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-primary-dark block mb-2">Fecha de finalización</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                        required
                        className={inputClass}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-primary-dark block mb-2">Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Ingresá tu dirección"
                      required
                      className={inputClass}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-primary-dark block mb-2">Descripción del problema</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describí tu problema en detalle..."
                      required
                      rows={4}
                      className={`${inputClass} resize-none`}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <SubmitButton loading={formSubmitting} loadingText="Publicando...">
                    Publicar solicitud
                  </SubmitButton>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
