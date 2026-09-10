import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../types'

// Page-level 403 for a role that reached a route it can't use — distinct from the
// tenant-suspended full-page state, which is a session-wide condition, not a
// per-page one (spec §09).
export function Forbidden() {
  const { hasRole } = useAuth()
  const home = hasRole(ROLES.platformAdmin) ? '/tenants' : '/products'

  return (
    <div className="state-block">
      <p className="state-title">You don't have access to this page</p>
      <p className="state-body">Your role doesn't include this. If that seems wrong, check with your admin.</p>
      <Link className="btn" to={home}>
        Back to your console
      </Link>
    </div>
  )
}
