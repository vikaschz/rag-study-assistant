import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import LoadingSpinner from './components/common/LoadingSpinner.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import Register from './pages/Register.jsx'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage label="Loading Studyspace" />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
