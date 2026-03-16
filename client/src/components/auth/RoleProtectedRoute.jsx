import { Navigate } from 'react-router-dom'
import { getStoredAuth, ROLE_LOGIN, ROLE_DASHBOARD } from '../../utils/routeAuth'

/**
 * Protects routes by role. Validates token + user from localStorage (works for admin, counsellor, student).
 * - Not logged in → redirect to role's login page
 * - Wrong role → redirect to that role's dashboard (so user can't access admin/counsellor/student area)
 */
function RoleProtectedRoute({ children, requiredRole }) {
  const { token, user } = getStoredAuth()
  const loginPath = ROLE_LOGIN[requiredRole] || '/login'
  const dashboardPath = ROLE_DASHBOARD[requiredRole]

  if (!token || !user) {
    return <Navigate to={loginPath} replace />
  }

  const role = (user.role || '').toLowerCase()
  if (role !== requiredRole) {
    const theirDashboard = ROLE_DASHBOARD[role] || (role === 'admin' ? '/admin/dashboard' : role === 'counsellor' ? '/counsellor/dashboard' : role === 'student' ? '/dashboard' : '/')
    return <Navigate to={theirDashboard} replace />
  }

  return children
}

export default RoleProtectedRoute
