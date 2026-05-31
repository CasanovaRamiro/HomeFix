import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './views/Login'
import Register from './views/Register'
import RegisterWorker from './views/RegisterWorker'
import Users from './views/Users'
import AiDiagnosis from './views/AiDiagnosis'
import CreatePost from './views/CreatePost'
import PostOptions from './views/PostOptions'
import WorkerProfile from './views/WorkerProfile'
import PostDetail from './views/PostDetail'
import TrabajadorFeed from './views/TrabajadorFeed'
import MisPostulaciones from './views/MisPostulaciones'
import Navbar from './components/Navbar'
import Landing from './views/Landing'
import WorkerLanding from './views/WorkerLanding'

const PrivateRoute = ({ children }: { children: ReactNode }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/workerlanding" element={<WorkerLanding />} />
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/worker" element={<RegisterWorker />} />
        <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="/diagnosis" element={<PrivateRoute><AiDiagnosis /></PrivateRoute>} />
        <Route path="/manual-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/post-options" element={<PrivateRoute><PostOptions /></PrivateRoute>} />
        <Route path="/worker/:id" element={<PrivateRoute><WorkerProfile /></PrivateRoute>} />
        <Route path="/posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
        <Route path="/worker" element={<TrabajadorFeed />} />
        <Route path="/worker/my-applications" element={<MisPostulaciones />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
