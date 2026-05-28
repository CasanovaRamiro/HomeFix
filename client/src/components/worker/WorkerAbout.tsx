import type { Worker } from '../../services/api'

interface Props {
  worker: Worker
}

export default function WorkerAbout({ worker }: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-7">
      <h3 className="text-[17px] font-bold text-gray-900 mb-3.5">Sobre mí</h3>
      <p className="text-sm text-text-muted leading-relaxed">
        {worker.bio ?? 'Este trabajador aún no agregó una descripción.'}
      </p>
    </div>
  )
}
