import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './views/Login'
import Register from './views/Register'
import Users from './views/Users'
import Diagnostico from './views/AiDiagnosis'
import CrearPublicacion from './views/CreatePost'
import PostOptions from './views/PostOptions'
import WorkerProfile from './views/WorkerProfile'
import PostDetail from './views/PostDetail'

const PrivateRoute = ({ children }: { children: ReactNode }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="/diagnosis" element={<PrivateRoute><Diagnostico /></PrivateRoute>} />
        <Route path="/manual-post" element={<PrivateRoute><CrearPublicacion /></PrivateRoute>} />
        <Route path="/post-options" element={<PrivateRoute><PostOptions /></PrivateRoute>} />
        <Route path="/worker/:id" element={<PrivateRoute><WorkerProfile /></PrivateRoute>} />
        <Route path="/posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
