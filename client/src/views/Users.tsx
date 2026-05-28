import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get<User[]>('/users')
      .then(({ data }) => setUsers(data))
      .catch((err) => {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar los usuarios. Revisa la consola.');
      })
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="max-w-[900px] mx-auto my-8 px-4">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Users</h2>
        <button onClick={logout} className="btn-outline">Logout</button>
      </header>
      {error && <p className="text-danger text-[13px]">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone || '—'}</td>
              <td>{u.role}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
