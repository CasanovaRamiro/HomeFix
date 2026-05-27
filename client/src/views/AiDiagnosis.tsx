import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Zap, Target, Bot, Loader2, CheckCircle } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useCreatePost } from '../hooks/useCreatePost'
import { useDiagnosisChat } from '../hooks/useDiagnosisChat'
import SubmitButton from '../components/SubmitButton'

export default function AiDiagnosis() {
  const navigate = useNavigate()
  const theme = useTheme()
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
    chatMessages: { padding: '24px', background: '#E5DDD5', minHeight: '420px', maxHeight: '500px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    userBubble: { maxWidth: '75%', padding: '12px 16px', fontSize: '14px', lineHeight: '1.625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#DCF8C6', borderRadius: '18px 18px 4px 18px', color: '#111', alignSelf: 'flex-end' as const },
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
    errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
  }

  const infoCards = [
    { title: 'Rápido', description: 'Solo 2 minutos para completar el diagnóstico completo', icon: Zap },
    { title: 'Preciso', description: 'Tecnología IA para identificar exactamente qué necesitas', icon: Target },
    { title: 'Personalizado', description: 'Recomendaciones basadas en tu ubicación y urgencia', icon: Sparkles },
  ]

  const chip = (confidence: string) => {
    if (confidence === 'high') return s.resultChip('#D1FAE5', '#047857')
    if (confidence === 'medium') return s.resultChip('#FEF3C7', '#B45309')
    return s.resultChip('#FEE2E2', '#B91C1C')
  }
  const chipLabel = (confidence: string) => {
    if (confidence === 'high') return 'Alta'
    if (confidence === 'medium') return 'Media'
    return 'Baja'
  }

  return (
    <main style={s.main}>
      <div style={s.wrapper}>
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

        <div style={{ ...s.chatContainer, marginBottom: '32px' }}>
          <div style={s.chatHeader}>
            <div style={s.chatAvatar}>
              <Bot style={s.chatAvatarIcon} />
            </div>
            <div>
              <p style={s.chatHeaderName}>Asistente HomeFix</p>
              <p style={s.chatHeaderStatus}>Online</p>
            </div>
          </div>

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
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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

        {suggestion && (
          <div style={s.resultContainer}>
            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle style={{ width: '40px', height: '40px', color: theme.accent }} />
                </div>
                <h2 style={{ ...s.resultTitle, marginBottom: '8px' }}>¡Solicitud publicada con éxito!</h2>
                <p style={{ color: theme.muted, marginBottom: '24px' }}>Pronto recibirás respuestas de profesionales cercanos.</p>
                <button
                  onClick={() => navigate('/')}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <>
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
                    <span style={chip(suggestion.confidence)}>
                      {suggestion.suggestedCategoryName}
                    </span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={s.resultLabel}>Posible problema</p>
                    <p style={{ ...s.resultValue, fontSize: '14px', fontWeight: 400, color: theme.muted }}>{suggestion.possibleIssue}</p>
                  </div>
                  <div>
                    <p style={s.resultLabel}>Confianza</p>
                    <span style={chip(suggestion.confidence)}>
                      {chipLabel(suggestion.confidence)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: theme.primaryDark, marginBottom: '8px' }}>Completá los datos faltantes</h3>
                    <p style={{ fontSize: '14px', color: theme.muted }}>Completá la siguiente información para publicar tu solicitud</p>
                  </div>

                  {formError && <div style={{ ...s.errorBox, marginBottom: '16px' }}>{formError}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Fecha de inicio</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Fecha de finalización</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                        required
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Ingresá tu dirección"
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Descripción del problema</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describí tu problema en detalle..."
                      required
                      rows={4}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.background, color: theme.primaryDark, transition: 'all 0.3s', resize: 'none' as const, boxSizing: 'border-box' as const }}
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
