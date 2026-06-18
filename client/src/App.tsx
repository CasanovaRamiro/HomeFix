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
import PublicWorkerProfile from './views/PublicWorkerProfile'
import PostDetail from './views/PostDetail'
import WorkerDashboard from './views/WorkerDashboard'
import WorkerApplications from './views/WorkerApplications'
import WorkerCalendar from './views/WorkerCalendar'
import Navbar from './components/Navbar'
import Landing from './views/Landing'
import ClientDashboard from './views/ClientDashboard'
import ClientHistory from './views/ClientHistory'

import WorkerLanding from './views/WorkerLanding'

import AvailableJobs from './views/AvailableJobs'
import AvailableSubcontracts from './views/AvailableSubcontracts'
import SubcontractDetail from './views/SubcontractDetail'
import CreateSubcontract from './views/CreateSubcontract'
import KycVerify from './views/KycVerify'
import RegisterChoice from './views/RegisterChoice'
import LeaveReview from './views/LeaveReview'
import AuthCallback from './views/AuthCallback'
import ForgotPassword from './views/ForgotPassword'
import { UserRole } from './types/user'


function getStoredUser(): { role?: string } | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) as { role?: string } : null
  } catch {
    return null
  }
}

const PrivateRoute = ({ children }: { children: ReactNode }): ReactNode =>
  localStorage.getItem('token') !== null ? children : <Navigate to="/" replace />

const WorkerRoute = ({ children }: { children: ReactNode }): ReactNode => {
  if (!localStorage.getItem('token')) return <Navigate to="/" replace />
  const user = getStoredUser()
  if (user?.role !== UserRole.Worker) return <Navigate to="/dashboard" replace />
  return children
}

const ClientRoute = ({ children }: { children: ReactNode }): ReactNode => {
  if (!localStorage.getItem('token')) return <Navigate to="/" replace />
  const user = getStoredUser()
  if (user?.role !== UserRole.Client) return <Navigate to="/worker" replace />
  return children
}

function NotFoundRedirect(): ReactNode {
  if (!localStorage.getItem('token')) return <Navigate to="/" replace />
  const user = getStoredUser()
  if (user?.role === UserRole.Worker) return <Navigate to="/worker" replace />
  if (user?.role === UserRole.Client) return <Navigate to="/dashboard" replace />
  return <Navigate to="/" replace />
}

function HomeRedirect(): ReactNode {
  const token = localStorage.getItem('token')
  if (!token) return <Landing />
  const user = getStoredUser()
  if (user?.role === UserRole.Worker) return <Navigate to="/worker" replace />
  if (user?.role === UserRole.Client) return <Navigate to="/dashboard" replace />
  return <Landing />
}

export default function App(): ReactNode {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/review" element={<PrivateRoute><LeaveReview /></PrivateRoute>} />
        
        <Route path="/workerlanding" element={<WorkerLanding />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup"          element={<RegisterChoice />} /> 
        <Route path="/register" element={<Register />} />
        <Route path="/register/worker" element={<RegisterWorker />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/kyc" element={<PrivateRoute><KycVerify /></PrivateRoute>} />
        <Route path="/dashboard" element={<ClientRoute><ClientDashboard /></ClientRoute>} />
        <Route path="/client/history" element={<ClientRoute><ClientHistory /></ClientRoute>} />
        <Route path="/users" element={<Users />} />
        <Route path="/diagnosis" element={<PrivateRoute><AiDiagnosis /></PrivateRoute>} />
        <Route path="/manual-post" element={<ClientRoute><CreatePost /></ClientRoute>} />
        <Route path="/post-options" element={<ClientRoute><PostOptions /></ClientRoute>} />
        <Route path="/profile/worker/:id" element={<PublicWorkerProfile />} />
        <Route path="/posts/:id" element={<ClientRoute><PostDetail /></ClientRoute>} />
        <Route path="/create-subcontract" element={<WorkerRoute><CreateSubcontract /></WorkerRoute>} />
        <Route path="/worker" element={<WorkerRoute><WorkerDashboard /></WorkerRoute>} />
        <Route path="/worker/calendar" element={<WorkerRoute><WorkerCalendar /></WorkerRoute>} />
        <Route path="/worker/my-applications" element={<WorkerRoute><WorkerApplications /></WorkerRoute>} />
        <Route path="/worker/available-subcontracts" element={<WorkerRoute><AvailableSubcontracts /></WorkerRoute>} />
        <Route path="/worker/subcontracts/:id" element={<WorkerRoute><SubcontractDetail /></WorkerRoute>} />
        <Route path="/worker/available-jobs" element={<WorkerRoute><AvailableJobs /></WorkerRoute>} />
        <Route path="/worker/:id" element={<WorkerRoute><WorkerProfile /></WorkerRoute>} />
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
