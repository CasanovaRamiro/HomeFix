import { useEffect, useState } from 'react'
import {useNavigate } from 'react-router-dom'
import api from '../services/api'

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [error] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get<User[]>('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => {
        localStorage.removeItem('token')
        navigate('/login')
      })
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="page">
      <header className="page-header">
        <h2>Users</h2>
        <button onClick={logout} className="btn-outline">Logout</button>
      </header>
      {error && <p className="error">{error}</p>}
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
