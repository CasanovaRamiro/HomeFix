import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  loading?: boolean
  disabled?: boolean
  loadingText?: string
  children: ReactNode
}

export default function SubmitButton({ loading, disabled, loadingText, children }: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`w-full py-4 px-4 rounded-xl font-semibold text-base border-none cursor-pointer
        bg-secondary text-white hover:bg-secondary-hover hover:scale-105
        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText || children}
        </span>
      ) : children}
    </button>
  )
}
