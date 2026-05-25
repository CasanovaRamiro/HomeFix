import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Zap, Target, Bot, Loader2, CheckCircle } from 'lucide-react'
import { sendMessage, type AiMessage, type AiSuggestionData } from '../services/diagnostico'
import api from '../services/api'

const theme = {
  primaryDark: '#0F172A',
  accent: '#10B981',
  accentHover: '#059669',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  danger: '#EF4444',
  whatsappBg: '#E5DDD5',
  whatsappUser: '#DCF8C6',
}

const s = {
  main: { minHeight: '100vh', background: theme.background },
  wrapper: { maxWidth: '1280px', margin: '0 auto', padding: '64px 16px' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: theme.card, border: `1px solid ${theme.border}`, fontSize: '14px' },
  badgeIcon: { width: '16px', height: '16px', color: theme.accent },
  badgeText: { color: theme.muted },
  h1: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textWrap: 'balance' as const },
  desc: { fontSize: '18px', color: theme.muted, maxWidth: '672px', margin: '0 auto', textWrap: 'balance' as const },
  infoCard: { padding: '32px', borderRadius: '16px', background: theme.card, border: `1px solid ${theme.border}`, textAlign: 'center' as const, transition: 'all 0.3s' },
  infoCardIconWrap: { width: '56px', height: '56px', borderRadius: '12px', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  infoCardIcon: { width: '28px', height: '28px', color: theme.accent },
  infoCardTitle: { fontSize: '18px', fontWeight: 600, color: theme.primaryDark },
  infoCardDesc: { fontSize: '14px', color: theme.muted, lineHeight: '1.625' },
  chatContainer: { borderRadius: '16px', overflow: 'hidden', background: theme.card, border: `1px solid ${theme.border}` },
  chatHeader: { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', background: theme.primaryDark },
  chatAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatAvatarIcon: { width: '20px', height: '20px', color: '#FFFFFF' },
  chatHeaderName: { fontWeight: 600, fontSize: '14px', color: '#FFFFFF' },
  chatHeaderStatus: { fontSize: '12px', color: theme.accent },
  chatMessages: { padding: '24px', background: theme.whatsappBg, minHeight: '420px', maxHeight: '500px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  userBubble: { maxWidth: '75%', padding: '12px 16px', fontSize: '14px', lineHeight: '1.625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: theme.whatsappUser, borderRadius: '18px 18px 4px 18px', color: '#111', alignSelf: 'flex-end' as const },
  aiBubble: { maxWidth: '75%', padding: '12px 16px', fontSize: '14px', lineHeight: '1.625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#FFFFFF', borderRadius: '18px 18px 18px 4px', color: '#111', alignSelf: 'flex-start' as const },
  typingBubble: { padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#FFFFFF', borderRadius: '18px 18px 18px 4px', display: 'flex', alignItems: 'center', gap: '8px' },
  loaderDot: (delay: number) => ({ width: '8px', height: '8px', borderRadius: '50%', background: theme.muted, animation: `bounce 1s infinite`, animationDelay: `${delay}ms` }),
  chatInputBar: { padding: '16px 24px', background: theme.background, borderTop: `1px solid ${theme.border}` },
  chatInputRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  chatInput: { flex: 1, padding: '12px 20px', borderRadius: '9999px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.card, color: theme.primaryDark, transition: 'all 0.3s' },
  chatSendBtn: { width: '48px', height: '48px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
  chatSendIcon: { width: '20px', height: '20px', color: '#FFFFFF' },
  resultContainer: { borderRadius: '16px', padding: '40px', background: theme.card, border: `1px solid ${theme.border}` },
  resultBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: `${theme.accent}1a`, color: theme.accent, fontSize: '14px' },
  resultBadgeIcon: { width: '16px', height: '16px' },
  resultTitle: { fontSize: '24px', fontWeight: 700, color: theme.primaryDark },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', padding: '24px', borderRadius: '12px', background: theme.background, border: `1px solid ${theme.border}` },
  resultLabel: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: theme.muted },
  resultValue: { fontWeight: 600, color: theme.primaryDark },
  resultChip: (bg: string, color: string) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: 500, background: bg, color }),
  formLabel: { fontSize: '14px', fontWeight: 500, color: theme.primaryDark },
  formInput: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const },
  formTextarea: { width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', resize: 'none' as const, boxSizing: 'border-box' as const },
  submitBtn: { width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF', transition: 'all 0.3s' },
  successIcon: { width: '40px', height: '40px', color: theme.accent },
  errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
}

export default function Diagnostico() {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AiSuggestionData | null>(null)
  const [conversationDone, setConversationDone] = useState(false)
  const [form, setForm] = useState({ startDate: '', endDate: '', address: '', description: '' })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  const navigate = useNavigate()

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const init = async () => {
      setLoading(true)
      try {
        const msgs: AiMessage[] = [{ role: 'user', text: 'Hola, necesito ayuda con un problema en mi hogar' }]
        setMessages(msgs)
        const res = await sendMessage(msgs)
        if (res.type === 'question') setMessages(p => [...p, { role: 'model', text: res.text }])
      } catch {
        setMessages(p => [...p, { role: 'model', text: 'Lo siento, hubo un error al conectar con el asistente.' }])
      } finally { setLoading(false) }
    }
    init()
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: AiMessage = { role: 'user', text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await sendMessage(updated)
      if (res.type === 'question') {
        setMessages(p => [...p, { role: 'model', text: res.text }])
      } else {
        setMessages(p => [...p, { role: 'model', text: '¡Genial! He identificado tu problema. Revisá el resultado abajo.' }])
        setSuggestion(res.data)
        setConversationDone(true)
        setForm(p => ({
          ...p,
          startDate: res.data.startDate || '',
          endDate: res.data.endDate || '',
          address: res.data.address || '',
        }))
      }
    } catch {
      setMessages(p => [...p, { role: 'model', text: 'Lo siento, hubo un error. Intentá de nuevo.' }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.startDate || !form.endDate || !form.address || !form.description) {
      setFormError('Todos los campos son obligatorios'); return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio'); return
    }
    setFormSubmitting(true)
    try {
      await api.post('/posts/create', {
        title: suggestion?.suggestedTitle,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        address: form.address,
        categoryId: suggestion?.suggestedCategoryId,
      })
      setFormSuccess(true)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setFormError(axiosErr.response?.data?.error ?? 'Error al publicar la solicitud')
    } finally { setFormSubmitting(false) }
  }

  const infoCards = [
    { title: 'Rápido', description: 'Solo 2 minutos para completar el diagnóstico completo', icon: Zap },
    { title: 'Preciso', description: 'Tecnología IA para identificar exactamente qué necesitas', icon: Target },
    { title: 'Personalizado', description: 'Recomendaciones basadas en tu ubicación y urgencia', icon: Sparkles },
  ]

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = theme.accent
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'
  }
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = theme.border
    e.target.style.boxShadow = 'none'
  }

  return (
    <main style={s.main}>
      <div style={s.wrapper}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={s.badge}>
              <Sparkles style={s.badgeIcon} />
              <span style={s.badgeText}>Asistido por Inteligencia Artificial</span>
            </div>
          </div>
          <h1 style={{ ...s.h1, marginBottom: '16px' }}>Diagnóstico Inteligente</h1>
          <p style={s.desc}>
            Responde algunas preguntas simples y nuestro sistema te conectará con el profesional perfecto para tu problema.
          </p>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '80px' }}>
          {infoCards.map((card, idx) => (
            <div key={idx} style={s.infoCard}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={s.infoCardIconWrap}>
                <card.icon style={s.infoCardIcon} />
              </div>
              <h3 style={{ ...s.infoCardTitle, marginTop: '16px', marginBottom: '8px' }}>{card.title}</h3>
              <p style={s.infoCardDesc}>{card.description}</p>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div style={{ ...s.chatContainer, marginBottom: '32px' }}>
          {/* Chat Header */}
          <div style={s.chatHeader}>
            <div style={s.chatAvatar}>
              <Bot style={s.chatAvatarIcon} />
            </div>
            <div>
              <p style={s.chatHeaderName}>Asistente HomeFix</p>
              <p style={s.chatHeaderStatus}>Online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={s.chatMessages}>
            {messages.filter(m => m.role === 'model').length === 0 && !loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
                <Loader2 style={{ width: '32px', height: '32px', color: theme.muted, animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} style={msg.role === 'user' ? s.userBubble : s.aiBubble}>
                {msg.text}
              </div>
            ))}

            {loading && (
              <div style={s.typingBubble}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={s.loaderDot(i * 150)} />
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          {!conversationDone && (
            <div style={s.chatInputBar}>
              <div style={s.chatInputRow}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribí tu mensaje..."
                  disabled={loading}
                  style={s.chatInput}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  style={{ ...s.chatSendBtn, opacity: (loading || !input.trim()) ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.background = theme.accentHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent }}
                >
                  <Send style={s.chatSendIcon} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resultado */}
        {suggestion && (
          <div style={s.resultContainer}>
            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle style={s.successIcon} />
                </div>
                <h2 style={{ ...s.resultTitle, marginBottom: '8px' }}>¡Solicitud publicada con éxito!</h2>
                <p style={{ color: theme.muted, marginBottom: '24px' }}>Pronto recibirás respuestas de profesionales cercanos.</p>
                <button
                  onClick={() => navigate('/')}
                  style={s.submitBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <>
                {/* Diagnosis Result */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={s.resultBadge}>
                    <CheckCircle style={s.resultBadgeIcon} />
                    <span style={{ fontWeight: 500 }}>Diagnóstico Completo</span>
                  </div>
                  <h2 style={{ ...s.resultTitle, marginTop: '16px' }}>Resultado del Diagnóstico</h2>
                </div>

                <div style={s.resultGrid}>
                  <div>
                    <p style={s.resultLabel}>Título sugerido</p>
                    <p style={s.resultValue}>{suggestion.suggestedTitle}</p>
                  </div>
                  <div>
                    <p style={s.resultLabel}>Categoría</p>
                    <span style={s.resultChip(`${theme.accent}1a`, theme.accent)}>
                      {suggestion.suggestedCategoryName}
                    </span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={s.resultLabel}>Posible problema</p>
                    <p style={{ ...s.resultValue, fontSize: '14px', fontWeight: 400, color: theme.muted }}>{suggestion.possibleIssue}</p>
                  </div>
                  <div>
                    <p style={s.resultLabel}>Confianza</p>
                    {(() => {
                      const conf = suggestion.confidence
                      const chip = conf === 'high'
                        ? s.resultChip('#D1FAE5', '#047857')
                        : conf === 'medium'
                        ? s.resultChip('#FEF3C7', '#B45309')
                        : s.resultChip('#FEE2E2', '#B91C1C')
                      const label = conf === 'high' ? 'Alta' : conf === 'medium' ? 'Media' : 'Baja'
                      return <span style={chip}>{label}</span>
                    })()}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} style={{ marginTop: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: theme.primaryDark, marginBottom: '8px' }}>Completá los datos faltantes</h3>
                    <p style={{ fontSize: '14px', color: theme.muted }}>Completá la siguiente información para publicar tu solicitud</p>
                  </div>

                  {formError && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{formError}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ ...s.formLabel, display: 'block', marginBottom: '8px' }}>Fecha de inicio</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                        required
                        style={s.formInput}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>
                    <div>
                      <label style={{ ...s.formLabel, display: 'block', marginBottom: '8px' }}>Fecha de finalización</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                        required
                        style={s.formInput}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ ...s.formLabel, display: 'block', marginBottom: '8px' }}>Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Ingresá tu dirección"
                      required
                      style={s.formInput}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ ...s.formLabel, display: 'block', marginBottom: '8px' }}>Descripción del problema</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describí tu problema en detalle..."
                      required
                      rows={4}
                      style={s.formTextarea}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    style={{ ...s.submitBtn, opacity: formSubmitting ? 0.5 : 1 }}
                    onMouseEnter={e => { if (!formSubmitting) { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' } }}
                    onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {formSubmitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                        Publicando...
                      </span>
                    ) : 'Publicar solicitud'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
