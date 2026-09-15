import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { RolePill } from './Pill'
import { ROLES } from '../types'

// One persistent shell for every role — the nav links shown change, but there's
// only ever one shell (spec §04), not a separate platform-admin layout.
export function AppShell() {
  const { me, hasRole, signOut, chooseDifferentTenant } = useAuth()
  const isPlatformAdmin = hasRole(ROLES.platformAdmin)
  const isTenantStaff = hasRole(ROLES.tenantMember, ROLES.tenantAdmin)
  const isCustomer = hasRole(ROLES.customer)

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="wordmark">Tenant Console</span>
          <span className="tenant-badge">{isPlatformAdmin ? 'Platform' : me.tenantSlug ?? '—'}</span>
        </div>
        <nav className="topbar-nav">
          {!isPlatformAdmin && (
            <NavLink to="/products" className={navClass}>
              Products
            </NavLink>
          )}
          {isTenantStaff && (
            <NavLink to="/tenant" className={navClass}>
              My tenant
            </NavLink>
          )}
          {isPlatformAdmin && (
            <NavLink to="/tenants" className={navClass}>
              Tenants
            </NavLink>
          )}
        </nav>
        <div className="topbar-right">
          <NavLink to="/account" className="account-link">
            <span className="username">{me.username}</span>
            {me.roles.map((r) => (
              <RolePill key={r} role={r} />
            ))}
          </NavLink>
          {isCustomer && (
            <button type="button" className="btn" onClick={chooseDifferentTenant}>
              Switch store
            </button>
          )}
          <button type="button" className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link active' : 'nav-link'
}
