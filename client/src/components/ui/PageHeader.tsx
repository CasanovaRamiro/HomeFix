import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  backTo: string
}

export default function PageHeader({ title, backTo }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] bg-[#0F172A] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <Link
        to={backTo}
        className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 hover:text-white"
      >
        ← Volver al dashboard
      </Link>
    </div>
  )
}
