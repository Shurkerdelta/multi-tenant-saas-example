import { useEffect, useState } from 'react'
import { listTenantDirectory } from '../api/tenants'
import type { TenantResponse } from '../types'
import { useAuth } from '../auth/AuthContext'
import { ErrorState } from '../components/States'

// What a Customer sees before anything else: no tenant is fixed on their account
// (see Roles.cs / TenantResolutionMiddleware), so they choose one from every active
// tenant on the platform. Rendered by <AuthProvider> itself, outside the app shell —
// there's no "current tenant" yet for the shell to show.
export function ChooseTenant({ onSelect }: { onSelect: (tenantId: string) => void }) {
  const { me, signOut } = useAuth()
  const [tenants, setTenants] = useState<TenantResponse[] | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setTenants(null)
    listTenantDirectory()
      .then(setTenants)
      .catch(() => setError(true))
  }

  useEffect(load, [])

  return (
    <div className="full-page">
      <div className="picker-card">
        <div className="picker-head">
          <div>
            <h1>Choose a store</h1>
            <p className="page-sub">Signed in as {me.username}</p>
          </div>
          <button type="button" className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>

        {error && <ErrorState body="Couldn't load tenants." onRetry={load} />}

        {!error && tenants === null && <p className="dim">Loading…</p>}

        {!error && tenants?.length === 0 && (
          <p className="dim">No stores are available right now.</p>
        )}

        {!error && tenants && tenants.length > 0 && (
          <ul className="picker-list">
            {tenants.map((t) => (
              <li key={t.id}>
                <button type="button" className="picker-item" onClick={() => onSelect(t.id)}>
                  <span className="picker-name">{t.name}</span>
                  <span className="picker-slug mono">{t.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
