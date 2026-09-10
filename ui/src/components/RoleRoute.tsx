import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../types'
import { Forbidden } from '../pages/Forbidden'

// A client-side hint only, same as everywhere else roles are read from /api/me — the
// API enforces the real rule. This exists so a member who types an admin URL sees a
// clear "you don't have access" screen instead of a raw failed request (spec §09).
export function RoleRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { hasRole } = useAuth()
  if (!hasRole(...allow)) {
    return <Forbidden />
  }
  return <>{children}</>
}
