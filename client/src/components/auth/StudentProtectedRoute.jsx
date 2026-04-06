import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getStoredAuth, ROLE_DASHBOARD } from '../../utils/routeAuth'

/**
 * Member-only routes (Buddy, booking, forum, screening, etc.).
 * Uses stored session (same keys as counsellor/admin) so all roles are detected consistently.
 */
function StudentProtectedRoute({ children }) {
  const { isLoading } = useAuth()
  const location = useLocation()
  const { token, user } = getStoredAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-800 border-t-transparent" />
        <p className="text-sm text-gray-500">Checking your session…</p>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const role = (user.role || '').toLowerCase()
  if (role !== 'student') {
    const dest =
      ROLE_DASHBOARD[role] ||
      (role === 'moderator' ? '/moderator' : '/')
    return <Navigate to={dest} replace />
  }

  return children
}

export default StudentProtectedRoute
