import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Zap, Target, Bot, Loader2, CheckCircle, Image, X, ArrowLeft } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useCreatePost } from '../hooks/useCreatePost'
import { useDiagnosisChat } from '../hooks/useDiagnosisChat'
import SubmitButton from '../components/ui/SubmitButton'
import FileUpload from '../components/ui/FileUpload'
import AddressAutocomplete from '../components/ui/AddressAutocomplete'
import InfoTooltip from '../components/ui/InfoTooltip'

export default function AiDiagnosis() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { form, setForm, formError, formSubmitting, formSuccess, handleFocus, handleBlur, handleSubmit } = useCreatePost()
  const [files, setFiles] = useState<File[]>([])
  const [chatImageFile, setChatImageFile] = useState<File | null>(null)
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (chatImagePreview) URL.revokeObjectURL(chatImagePreview)
    }
  }, [chatImagePreview])

  const { messages, input, setInput, loading, suggestion, conversationDone, chatEndRef, handleSend } = useDiagnosisChat((data) => {
    setForm({
      title: data.suggestedTitle || '',
      categoryId: String(data.suggestedCategoryId || ''),
      description: data.possibleIssue || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      address: data.address || '',
      latitude: null,
      longitude: null,
    })
  })

  const handleSendWithImage = () => {
    if (chatImageFile) {
      setFiles(prev => [...prev, chatImageFile])
      const file = chatImageFile
      setChatImageFile(null)
      setChatImagePreview(null)
      handleSend(file)
    } else {
      handleSend()
    }
  }

  const handleKeyDownWithImage = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendWithImage()
    }
  }

  const s = {
    main: { minHeight: '100vh', background: theme.background },
    wrapper: { maxWidth: '1280px', margin: '0 auto', padding: '64px 16px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: theme.card, border: `1px solid ${theme.border}`, fontSize: '14px' },
    badgeIcon: { width: '16px', height: '16px', color: theme.accent },
    badgeText: { color: theme.muted },
    h1: { fontSize: '36px', fontWeight: 700, color: theme.primaryDark, textWrap: 'balance' as const },
    desc: { fontSize: '18px', color: theme.muted, maxWidth: '672px', margin: '0 auto', textWrap: 'balance' as const },
    infoCard: { padding: '32px', borderRadius: '16px', background: theme.card, border: `1px solid ${theme.border}`, textAlign: 'center' as const },
    infoCardIconWrap: { width: '56px', height: '56px', borderRadius: '12px', background: `${theme.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    infoCardIcon: { width: '28px', height: '28px', color: theme.accent },
    infoCardTitle: { fontSize: '18px', fontWeight: 600, color: theme.primaryDark },
    infoCardDesc: { fontSize: '14px', color: theme.muted, lineHeight: '1.625' },
    chatContainer: { borderRadius: '16px', overflow: 'hidden', background: theme.card, border: `1px solid ${theme.border}` },
    chatHeader: { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', background: theme.card, borderBottom: `1px solid ${theme.border}` },
    chatAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    chatAvatarIcon: { width: '20px', height: '20px', color: '#FFFFFF' },
    chatHeaderName: { fontWeight: 600, fontSize: '14px', color: theme.primaryDark },
    chatHeaderStatus: { fontSize: '12px', color: theme.muted },
    chatMessages: { padding: '24px', background: theme.card, border: `1px solid ${theme.border}`, minHeight: '420px', maxHeight: '500px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    userBubble: { maxWidth: '75%', padding: '12px 16px', fontSize: '14px', lineHeight: '1.625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: theme.background, border: `1px solid ${theme.border}`, borderRadius: '18px 18px 4px 18px', color: theme.primaryDark, alignSelf: 'flex-end' as const },
    aiBubble: { maxWidth: '75%', padding: '12px 16px', fontSize: '14px', lineHeight: '1.625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: theme.background, border: `1px solid ${theme.border}`, borderRadius: '18px 18px 18px 4px', color: theme.primaryDark, alignSelf: 'flex-start' as const },
    chatImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' as const, display: 'block' },
    typingBubble: { padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '18px 18px 18px 4px', display: 'flex', alignItems: 'center', gap: '8px' },
    loaderDot: (delay: number) => ({ width: '8px', height: '8px', borderRadius: '50%', background: theme.muted, animation: `bounce 1s infinite`, animationDelay: `${delay}ms` }),
    chatInputBar: { padding: '16px 24px', background: theme.background, borderTop: `1px solid ${theme.border}` },
    chatInputRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    chatInput: { flex: 1, padding: '12px 20px', borderRadius: '9999px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: theme.card, color: theme.primaryDark, transition: 'all 0.3s' },
    chatSendBtn: { width: '48px', height: '48px', borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
    chatSendIcon: { width: '20px', height: '20px', color: '#FFFFFF' },
    resultContainer: { borderRadius: '16px', padding: 'clamp(24px, 4vw, 40px)', background: theme.card, border: `1px solid ${theme.border}` },
    resultBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: `${theme.accent}1a`, color: theme.accent, fontSize: '14px' },
    resultBadgeIcon: { width: '16px', height: '16px' },
    resultTitle: { fontSize: '24px', fontWeight: 700, color: theme.primaryDark },
    resultGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', padding: '24px', borderRadius: '12px', background: theme.background, border: `1px solid ${theme.border}` },
    resultLabel: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: theme.muted },
    resultValue: { fontWeight: 600, color: theme.primaryDark },
    resultChip: (bg: string, color: string) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: 500, background: bg, color }),
    errorBox: { padding: '16px', borderRadius: '8px', fontSize: '14px', background: '#FEF2F2', color: theme.danger, border: '1px solid #FECACA' },
    emergencyCard: { padding: '16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' },
    emergencyLabel: { fontSize: '14px', fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' },
    emergencyText: { fontSize: '13px', color: '#B91C1C', margin: 0, lineHeight: '1.4' },
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
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '16px 2rem 0' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: theme.muted, padding: '8px 14px 8px 10px', marginLeft: '-10px', borderRadius: '999px', transition: 'color 0.15s, background 0.15s', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.primaryDark; e.currentTarget.style.background = theme.hover }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Volver
        </button>
      </div>
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
            <div key={idx} style={s.infoCard}>
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
                {msg.imageBase64 && (
                  <img src={msg.imageBase64} alt="Foto adjunta"
                    style={{ ...s.chatImage, marginBottom: msg.text ? '8px' : 0 }} />
                )}
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

          {chatImagePreview && (
            <div style={{
              padding: '8px 24px', display: 'flex', alignItems: 'center',
              gap: '12px', background: theme.card,
              borderTop: `1px solid ${theme.border}`,
            }}>
              <div style={{
                position: 'relative', borderRadius: '8px', overflow: 'hidden',
                maxWidth: '200px', maxHeight: '120px',
              }}>
                <img src={chatImagePreview} alt="Foto seleccionada"
                  style={{ width: '100%', height: 'auto', maxHeight: '120px', objectFit: 'contain', display: 'block' }} />
              </div>
              <button type="button" onClick={() => {
                if (chatImagePreview) URL.revokeObjectURL(chatImagePreview)
                setChatImageFile(null)
                setChatImagePreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: theme.danger, color: '#fff', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          {!conversationDone && (
            <div style={s.chatInputBar}>
              <div style={s.chatInputRow}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (chatImagePreview) URL.revokeObjectURL(chatImagePreview)
                      setChatImageFile(file)
                      setChatImagePreview(URL.createObjectURL(file))
                    }
                  }}
                />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDownWithImage}
                  placeholder="Escribí tu mensaje..."
                  disabled={loading}
                  style={s.chatInput}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    border: `1px solid ${theme.border}`,
                    background: theme.card, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.background; e.currentTarget.style.borderColor = theme.accent }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.card; e.currentTarget.style.borderColor = theme.border }}
                >
                  <Image style={{ width: '20px', height: '20px', color: theme.muted }} />
                </button>
                <button
                  onClick={handleSendWithImage}
                  disabled={loading || (!input.trim() && !chatImageFile)}
                  style={{ ...s.chatSendBtn, opacity: (loading || (!input.trim() && !chatImageFile)) ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!loading && (input.trim() || chatImageFile)) e.currentTarget.style.background = theme.accentHover }}
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
                  onClick={() => navigate('/dashboard')}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', background: theme.accent, color: '#FFFFFF', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  volver al Inicio
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

                <form onSubmit={handleSubmit(files)} style={{ marginTop: '32px' }}>
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
                        required={!form.isEmergency}
                        disabled={form.isEmergency}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: form.isEmergency ? '#F3F4F6' : theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const }}
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
                        required={!form.isEmergency}
                        disabled={form.isEmergency}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', outline: 'none', border: `1px solid ${theme.border}`, background: form.isEmergency ? '#F3F4F6' : theme.background, color: theme.primaryDark, transition: 'all 0.3s', boxSizing: 'border-box' as const }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  {/* Subcontracting toggle */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: form.allowsSubcontracting ? '#F0FDF4' : '#FEF2F2', border: form.allowsSubcontracting ? '1px solid #BBF7D0' : '1px solid #FECACA', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input
                        type="checkbox"
                        id="allowsSubcontracting"
                        checked={form.allowsSubcontracting}
                        onChange={e => setForm(p => ({ ...p, allowsSubcontracting: e.target.checked }))}
                        style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                      />
                      <div style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        background: form.allowsSubcontracting ? '#10B981' : '#D1D5DB',
                        transition: 'background 0.2s', position: 'absolute', top: 0, left: 0,
                      }} />
                      <div style={{
                        width: '20px', height: '20px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '2px', left: form.allowsSubcontracting ? '22px' : '2px',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 1
                      }} />
                    </div>
                    <div>
                      <label htmlFor="allowsSubcontracting" style={{ fontSize: '14px', fontWeight: 600, color: form.allowsSubcontracting ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Permitir subcontratación
                        <InfoTooltip text="La subcontratación permite que el trabajador contratado pueda sumar a otros profesionales para completar la tarea. Si desactivás esta opción, solo podrá trabajar él de forma individual." />
                      </label>
                      <p style={{ fontSize: '13px', color: form.allowsSubcontracting ? '#065F46' : '#B91C1C', margin: 0, lineHeight: '1.4' }}>
                        {form.allowsSubcontracting
                          ? 'El trabajador podrá contratar a otros profesionales si es necesario.'
                          : 'El trabajador deberá realizar la tarea de forma individual.'}
                      </p>
                    </div>
                  </div>

                  <div style={s.emergencyCard}>
                    <div style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input
                        type="checkbox"
                        id="isEmergency"
                        checked={form.isEmergency}
                        onChange={e => setForm(p => ({ ...p, isEmergency: e.target.checked }))}
                        style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', cursor: 'pointer', zIndex: 2 }}
                      />
                      <div style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        background: form.isEmergency ? '#DC2626' : '#D1D5DB',
                        transition: 'background 0.2s', position: 'absolute', top: 0, left: 0,
                      }} />
                      <div style={{
                        width: '20px', height: '20px', background: '#fff', borderRadius: '50%',
                        position: 'absolute', top: '2px', left: form.isEmergency ? '22px' : '2px',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 1
                      }} />
                    </div>
                    <div>
                      <label htmlFor="isEmergency" style={s.emergencyLabel}>
                        Publicación de Emergencia
                      </label>
                      <p style={s.emergencyText}>
                        Esta publicación tendrá prioridad alta.
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Dirección</label>
                    <AddressAutocomplete
                      value={form.address}
                      onChange={(address, lat, lng) => setForm(p => ({ ...p, address, latitude: lat, longitude: lng }))}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    {form.latitude && form.longitude && (
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: theme.accent }}>
                        ✓ Ubicación confirmada
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: theme.primaryDark, display: 'block', marginBottom: '8px' }}>Fotos / Videos (opcional)</label>
                    <FileUpload files={files} onFilesChange={setFiles} />
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
