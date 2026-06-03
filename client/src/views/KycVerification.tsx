import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, CreditCard, Camera, ArrowLeft,
  CheckCircle2, Loader2, ArrowRight, User,
} from 'lucide-react'

type KycStep = 'front' | 'back' | 'selfie' | 'processing' | 'result'

const stepConfig: Record<KycStep, { progress: number; title: string; hint: string }> = {
  front: { progress: 1, title: 'Captura el frente de tu DNI', hint: 'Asegurate de que el documento sea legible y esté bien iluminado' },
  back: { progress: 2, title: 'Captura el dorso de tu DNI', hint: 'Asegurate de que el documento sea legible y esté bien iluminado' },
  selfie: { progress: 3, title: 'Captura una selfie', hint: 'Mira directamente a la cámara con buena iluminación' },
  processing: { progress: 3, title: 'Verificando tu identidad', hint: '' },
  result: { progress: 3, title: 'Resultado de verificación', hint: '' },
}

export default function KycVerification() {
  const navigate = useNavigate()
  const [kycStep, setKycStep] = useState<KycStep>('front')

  const currentProgress = stepConfig[kycStep].progress
  const config = stepConfig[kycStep]

  const handleNextStep = () => {
    if (kycStep === 'front') setKycStep('back')
    else if (kycStep === 'back') setKycStep('selfie')
    else if (kycStep === 'selfie') setKycStep('processing')
  }

  const handlePrevStep = () => {
    if (kycStep === 'back') setKycStep('front')
    else if (kycStep === 'selfie') setKycStep('back')
  }

  const handleSimulateResult = () => setKycStep('result')
  const handleGoToDashboard = () => navigate('/worker')

  const showProgress = kycStep === 'front' || kycStep === 'back' || kycStep === 'selfie'
  const showProcessingProgress = kycStep === 'processing' || kycStep === 'result'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="px-8 py-6">
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <span className="text-emerald-500">X</span>
          <span>HomeFix</span>
        </div>
      </header>

      {/* Progress bar */}
      {(showProgress || showProcessingProgress) && (
        <div className="w-full px-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= currentProgress ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Badge + Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Verificación KYC
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] leading-tight">
              {config.title}
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

            {/* ===== FRONT / BACK ===== */}
            {(kycStep === 'front' || kycStep === 'back') && (
              <>
                <div className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center gap-3">
                  <CreditCard className="w-12 h-12 text-slate-400" />
                  <span className="text-slate-500 text-sm font-medium">
                    {kycStep === 'front' ? 'Frente del DNI' : 'Dorso del DNI'}
                  </span>
                </div>

                <p className="text-center text-slate-400 text-xs md:text-sm">{config.hint}</p>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-12 bg-[#7dddc5] hover:bg-[#6ecbb3] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  Capturar foto
                </button>

                {kycStep !== 'front' && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </button>
                )}
              </>
            )}

            {/* ===== SELFIE ===== */}
            {kycStep === 'selfie' && (
              <>
                <div className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                </div>

                <p className="text-center text-slate-400 text-xs md:text-sm">{config.hint}</p>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-12 bg-[#7dddc5] hover:bg-[#6ecbb3] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  Tomar selfie
                </button>

                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
              </>
            )}

            {/* ===== PROCESSING ===== */}
            {kycStep === 'processing' && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-lg">Procesando verificación</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Estamos validando tu información. Esto puede tomar unos segundos...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateResult}
                  className="w-full h-12 bg-[#7dddc5] hover:bg-[#6ecbb3] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  Simular resultado
                </button>
              </div>
            )}

            {/* ===== RESULT ===== */}
            {kycStep === 'result' && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-lg">Verificación exitosa</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Tu identidad ha sido verificada correctamente. Ya puedes acceder a todas las funcionalidades.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="w-full h-12 bg-[#7dddc5] hover:bg-[#6ecbb3] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  Ir a mi dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
