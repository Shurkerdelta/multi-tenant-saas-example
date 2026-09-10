import { Navigate } from 'react-router-dom'

// By the time this route ever renders, <AuthProvider> has already finished the PKCE
// code exchange and loaded /api/me — it gates all of its children on that. So this
// page's only job is to hand off to the role-based landing route.
export function AuthCallback() {
  return <Navigate to="/" replace />
}
