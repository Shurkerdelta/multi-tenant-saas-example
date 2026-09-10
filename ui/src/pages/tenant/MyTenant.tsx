import { useEffect, useState } from 'react'
import { getCurrentTenant } from '../../api/tenants'
import type { TenantResponse } from '../../types'
import { ErrorState } from '../../components/States'
import { StatusPill } from '../../components/Pill'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

export function MyTenant() {
  const [tenant, setTenant] = useState<TenantResponse | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setTenant(null)
    getCurrentTenant()
      .then(setTenant)
      .catch(() => setError(true))
  }

  useEffect(load, [])

  if (error) return <ErrorState body="Couldn't load your tenant." onRetry={load} />
  if (!tenant) return <p className="dim">Loading…</p>

  return (
    <div className="page-stack">
      <div className="page-header">
        <h1>{tenant.name}</h1>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Slug</dt>
          <dd className="mono">{tenant.slug}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusPill active={tenant.isActive} />
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{dateFormat.format(new Date(tenant.createdAt))}</dd>
        </div>
      </dl>
      <p className="dim small">
        This page is read-only — there's no self-service way to rename a tenant or change its slug yet.
      </p>
    </div>
  )
}
