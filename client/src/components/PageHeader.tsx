import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  backTo: string
}

export default function PageHeader({ title, backTo }: PageHeaderProps) {
  return (
    <div className="post-header">
      <h1>{title}</h1>
      <Link to={backTo}>← Volver al dashboard</Link>
    </div>
  )
}
