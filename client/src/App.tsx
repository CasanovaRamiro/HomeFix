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
import WorkerDashboard from './views/WorkerDashboard'
import WorkerApplications from './views/WorkerApplications'
import Navbar from './components/Navbar'
import Landing from './views/Landing'
import ClientDashboard from './views/ClientDashboard'

import WorkerLanding from './views/WorkerLanding'

import AvailableJobs from './views/AvailableJobs'
import CreateSubcontract from './views/CreateSubcontract'
import KycVerification from './views/KycVerification'
import RegisterChoice from './views/RegisterChoice'
import LeaveReview from './views/LeaveReview'
import AuthCallback from './views/AuthCallback'
import ForgotPassword from './views/ForgotPassword'


const PrivateRoute = ({ children }: { children: ReactNode }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" replace />

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/review" element={<PrivateRoute><LeaveReview /></PrivateRoute>} />
        
        <Route path="/workerlanding" element={<WorkerLanding />} />
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup"          element={<RegisterChoice />} /> 
        <Route path="/register" element={<Register />} />
        <Route path="/register/worker" element={<RegisterWorker />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/kyc" element={<KycVerification />} />
        <Route path="/dashboard" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
        <Route path="/users" element={<Users />} />
        <Route path="/diagnosis" element={<PrivateRoute><AiDiagnosis /></PrivateRoute>} />
        <Route path="/manual-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/post-options" element={<PrivateRoute><PostOptions /></PrivateRoute>} />
        <Route path="/worker/:id" element={<PrivateRoute><WorkerProfile /></PrivateRoute>} />
        <Route path="/posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
        <Route path="/create-subcontract" element={<PrivateRoute><CreateSubcontract /></PrivateRoute>} />
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/my-applications" element={<WorkerApplications />} />
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
