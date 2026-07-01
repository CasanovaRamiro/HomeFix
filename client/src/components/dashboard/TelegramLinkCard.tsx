import { type JSX, useState, useEffect } from 'react'
import { Send, CheckCircle, XCircle, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { telegramLink, telegramStatus, telegramUnlink } from '../../services/api'

export default function TelegramLinkCard(): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'linked' | 'unlinked'>('idle')
  const [code, setCode] = useState<string | null>(null)
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [linkedAt, setLinkedAt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    telegramStatus()
      .then((s) => {
        setStatus(s.linked ? 'linked' : 'unlinked')
        setLinkedAt(s.linkedAt)
      })
      .catch(() => setStatus('unlinked'))
  }, [])

  const handleLink = async (): Promise<void> => {
    setBusy(true)
    try {
      const res = await telegramLink()
      setCode(res.code)
      setDeepLink(res.deepLink)
      setStatus('loading')
    } catch {
      setStatus('unlinked')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlink = async (): Promise<void> => {
    setBusy(true)
    try {
      await telegramUnlink()
      setStatus('unlinked')
      setCode(null)
    } finally {
      setBusy(false)
    }
  }

  const copyCode = (): void => {
    if (code !== null) {
      void navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
      {status === 'linked' && (
        <div className="mb-3 flex items-center gap-1 text-xs font-semibold text-green-600">
          <CheckCircle size={14} /> Vinculado
        </div>
      )}

      {status === 'loading' && code ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Enviá este código al bot de HomeFix en Telegram:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-slate-100 px-4 py-3 text-center text-lg font-bold tracking-widest text-blue-700">
              {code}
            </code>
            <button
              onClick={copyCode}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50"
            >
              {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          {deepLink && (
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ExternalLink size={14} />
              Abrir Telegram
            </a>
          )}
          <p className="text-[11px] text-slate-400">El código expira en 5 minutos. Refrescá la página después de vincular.</p>
        </div>
      ) : status === 'linked' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Vinculado{linkedAt ? ` el ${new Date(linkedAt).toLocaleDateString()}` : ''}
          </p>
          <button
            onClick={handleUnlink}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition-colors hover:text-red-600"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
            Desvincular
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Recibí notificaciones de tus publicaciones directamente en Telegram.</p>
          <button
            onClick={handleLink}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Vincular Telegram
          </button>
        </div>
      )}
    </div>
  )
}
