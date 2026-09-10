import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../types'

// Landing route after sign-in depends on role (spec §03): tenant staff land on
// Products, platform-admin lands on Tenants — there's no shared "home" screen.
export function Landing() {
  const { hasRole } = useAuth()
  return <Navigate to={hasRole(ROLES.platformAdmin) ? '/tenants' : '/products'} replace />
}
