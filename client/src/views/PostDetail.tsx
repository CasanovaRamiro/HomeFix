import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import PageHeader from '../components/ui/PageHeader'
import PostCard from '../components/post/PostCard'
import ApplicantCard from '../components/post/ApplicantCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import type { Post } from '../types/post'

const MOCK_APPLICANTS = [
  {
    id: '1',
    name: 'Juan Pérez',
    category: 'Plomero',
    address: 'San Isidro',
    rating: 4.8,
    reviewCount: 47,
    jobCount: 159,
  },
  {
    id: '1',
    name: 'Luis Fernández',
    category: 'Plomero',
    address: 'Miraflores',
    rating: 4.5,
    reviewCount: 23,
    jobCount: 89,
  },
]

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Post>(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch((err) => {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 404) {
          setError('La publicación no está disponible')
        } else {
          setError('La publicación no está disponible')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return (
    <>
      <PageHeader title="Detalle de publicación" backTo="/users" />
      <div className="post-detail">
        <p className="error">{error}</p>
      </div>
    </>
  )
  if (!post) return null

  return (
    <>
      <PageHeader title="Detalle de publicación" backTo="/users" />
      <div className="post-detail">
      <PostCard post={post} />

      <h3 className="section-title">Postulantes ({MOCK_APPLICANTS.length})</h3>

      {MOCK_APPLICANTS.map((a) => (
        <ApplicantCard key={a.name} applicant={a} />
      ))}
    </div>
    </>
  )
}
