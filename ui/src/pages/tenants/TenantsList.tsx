import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listTenants } from '../../api/tenants'
import type { TenantResponse } from '../../types'
import { EmptyState, ErrorState, SkeletonRows } from '../../components/States'
import { StatusPill } from '../../components/Pill'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function TenantsList() {
  const location = useLocation()
  const [tenants, setTenants] = useState<TenantResponse[] | null>(null)
  const [error, setError] = useState(false)
  const [flash] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null)

  const load = () => {
    setError(false)
    setTenants(null)
    listTenants()
      .then(setTenants)
      .catch(() => setError(true))
  }

  useEffect(load, [])

  return (
    <div className="page-stack">
      {flash && <p className="flash">{flash}</p>}
      <div className="page-header">
        <div>
          <h1>Tenants</h1>
          <p className="page-sub">Every tenant on the platform.</p>
        </div>
        <Link to="/tenants/new" className="btn primary">
          Add tenant
        </Link>
      </div>

      {error ? (
        <ErrorState body="Couldn't load tenants." onRetry={load} />
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants === null && <SkeletonRows columns={4} />}
              {tenants?.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td className="mono">{t.slug}</td>
                  <td>
                    <StatusPill active={t.isActive} />
                  </td>
                  <td className="dim">{dateFormat.format(new Date(t.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants?.length === 0 && (
            <EmptyState
              title="No tenants yet"
              body="Provisioned tenants will show up here."
              action={
                <Link to="/tenants/new" className="btn primary">
                  Add tenant
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
