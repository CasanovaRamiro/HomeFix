import StarRating from './StarRating'

interface Applicant {
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
  const initials = applicant.name.split(' ').map((n) => n[0]).join('')

  return (
    <div className="applicant-card">
      <div className="avatar">{initials}</div>
      <div className="info">
        <h4>{applicant.name}</h4>
        <div className="meta">{applicant.category} — {applicant.address}</div>
        <div className="stats">
          <StarRating rating={applicant.rating} count={applicant.reviewCount} />
          {' · '}{applicant.jobCount} trabajos
        </div>
      </div>
      <div className="actions">
        <button>Ver perfil</button>
        <button className="btn-outline">Chatear</button>
      </div>
    </div>
  )
}
