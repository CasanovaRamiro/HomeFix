import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  linkText: string
  onClick: () => void
}

export default function OptionCard({ icon: Icon, title, description, linkText, onClick }: Props) {
  return (
    <div
      className="bg-card border border-border rounded-2xl px-8 py-10 transition-all duration-300 cursor-pointer hover:shadow-md hover:border-secondary"
      onClick={onClick}
    >
      <div className="w-14 h-14 rounded-xl bg-secondary/5 flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-secondary" />
      </div>
      <h2 className="text-[22px] font-bold text-primary-dark mb-3">
        {title}
      </h2>
      <p className="text-[15px] text-muted leading-relaxed mb-7">
        {description}
      </p>
      <button className="inline-flex items-center gap-2 text-[15px] font-semibold text-secondary border-none bg-transparent p-0 cursor-pointer">
        {linkText}
        <ArrowRight className="w-[18px] h-[18px]" />
      </button>
    </div>
  )
}
