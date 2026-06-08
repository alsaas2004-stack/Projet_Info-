import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiLoader } from 'react-icons/fi'

export default function PrivateRoute({ children }) {
  const { user, loading, modeRecuperation } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FiLoader size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (modeRecuperation) {
    return <Navigate to="/reset-password" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
