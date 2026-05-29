import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './views/Login'
import Register from './views/Register'
import Users from './views/Users'
import AiDiagnosis from './views/AiDiagnosis'
import CreatePost from './views/CreatePost'
import PostOptions from './views/PostOptions'
import WorkerProfile from './views/WorkerProfile'
import PostDetail from './views/PostDetail'
import TrabajadorFeed from './views/TrabajadorFeed'
import MisPostulaciones from './views/MisPostulaciones'
import AvailableJobs from './views/AvailableJobs'

const PrivateRoute = ({ children }: { children: ReactNode }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="/diagnosis" element={<PrivateRoute><AiDiagnosis /></PrivateRoute>} />
        <Route path="/manual-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/post-options" element={<PrivateRoute><PostOptions /></PrivateRoute>} />
        <Route path="/worker/:id" element={<PrivateRoute><WorkerProfile /></PrivateRoute>} />
        <Route path="/posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
        <Route path="/worker" element={<TrabajadorFeed />} />
        <Route path="/worker/my-applications" element={<MisPostulaciones />} />
        <Route
          path="/worker/available-jobs"
          element={
            <PrivateRoute>
              <AvailableJobs />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
