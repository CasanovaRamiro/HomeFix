import { useNavigate } from 'react-router-dom'
import StarRating from '../ui/StarRating'

interface Applicant {
  id: string
  name: string
  category: string
  address: string
  rating: number
  reviewCount: number
  jobCount: number
}

interface ApplicantCardProps {
  applicant: Applicant
}

export default function ApplicantCard({ applicant }: ApplicantCardProps) {
  const navigate = useNavigate()
  const initials = applicant.name.split(' ').map((n) => n[0]).join('')

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-3 flex flex-wrap gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-lg shrink-0">{initials}</div>
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-[15px] font-semibold mb-1">{applicant.name}</h4>
        <div className="text-[13px] text-text-muted">{applicant.category} — {applicant.address}</div>
        <div className="text-[13px] text-text-muted mt-1">
          <StarRating rating={applicant.rating} count={applicant.reviewCount} />
          {' · '}{applicant.jobCount} trabajos
        </div>
      </div>
      <div className="flex gap-2 items-center shrink-0">
        <button onClick={() => navigate(`/worker/${applicant.id}`)}>Ver perfil</button>
        <button className="btn-outline">Chatear</button>
      </div>
    </div>
  )
}
