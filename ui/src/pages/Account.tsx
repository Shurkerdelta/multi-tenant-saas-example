import { useAuth } from '../auth/AuthContext'
import { RolePill } from '../components/Pill'

// Built directly on GET /api/me (spec §08) — makes "what is this session actually
// allowed to do" checkable at a glance, for the signed-in user or for support.
export function Account() {
  const { me } = useAuth()

  return (
    <div className="page-stack">
      <div className="page-header">
        <h1>Account &amp; access</h1>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Username</dt>
          <dd>{me.username}</dd>
        </div>
        <div>
          <dt>Subject</dt>
          <dd className="mono small">{me.subject}</dd>
        </div>
        <div>
          <dt>Tenant</dt>
          <dd>{me.tenantSlug ? `${me.tenantSlug}` : <span className="dim">Platform-wide</span>}</dd>
        </div>
        <div>
          <dt>Roles</dt>
          <dd className="pill-row">
            {me.roles.map((r) => (
              <RolePill key={r} role={r} />
            ))}
          </dd>
        </div>
      </dl>
    </div>
  )
}
