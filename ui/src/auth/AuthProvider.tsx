import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { keycloak } from './keycloak'
import { AuthContext } from './AuthContext'
import { registerTenantSuspendedHandler, setSelectedTenantId, ApiError } from '../api/client'
import { getMe } from '../api/me'
import type { MeResponse, Role } from '../types'
import { ROLES } from '../types'
import { FullPageMessage } from '../components/FullPageMessage'
import { TenantSuspended } from '../pages/TenantSuspended'
import { ChooseTenant } from '../pages/ChooseTenant'

type Status =
  | 'initializing'
  | 'redirecting'
  | 'loading-me'
  | 'error'
  | 'suspended'
  | 'choosing-tenant'
  | 'tenant-unavailable'
  | 'ready'

const CALLBACK_PATH = '/auth/callback'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('initializing')
  const [me, setMe] = useState<MeResponse | null>(null)

  // A Customer's token carries no tenant_id at all (see Roles.cs) — after /api/me
  // comes back with tenantId: null for one, they haven't picked a tenant yet.
  const loadMe = useCallback(async (origin: 'initial' | 'tenant-pick' = 'initial') => {
    setStatus('loading-me')
    try {
      const response = await getMe()
      setMe(response)
      if (response.roles.includes(ROLES.customer) && !response.tenantId) {
        setStatus('choosing-tenant')
      } else {
        setStatus('ready')
      }
    } catch (err) {
      if (err instanceof ApiError && err.body?.error?.includes('inactive')) {
        // Mid-login vs. mid-session both land here, but mean different things: a
        // tenant a customer just picked turning out to be inactive isn't the same as
        // an authenticated session's own tenant getting deactivated (see the
        // registerTenantSuspendedHandler effect below for the latter).
        setStatus(origin === 'tenant-pick' ? 'tenant-unavailable' : 'suspended')
      } else {
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      })
      .then((authenticated) => {
        if (!authenticated) {
          setStatus('redirecting')
          keycloak.login({ redirectUri: `${window.location.origin}${CALLBACK_PATH}` })
          return
        }
        void loadMe()
      })
      .catch(() => setStatus('error'))
    // Runs once for the app's lifetime — keycloak.init() throws if called twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chooseDifferentTenant = useCallback(() => {
    setSelectedTenantId(null)
    setStatus('choosing-tenant')
  }, [])

  const handleTenantChosen = useCallback(
    (tenantId: string) => {
      setSelectedTenantId(tenantId)
      void loadMe('tenant-pick')
    },
    [loadMe],
  )

  // Re-registered whenever `me` changes so the handler's closure always has the
  // latest roles — this is what catches a tenant a customer is already browsing
  // getting deactivated mid-session (as opposed to the "picked one already inactive"
  // case in loadMe's own catch above, which never reaches here).
  useEffect(() => {
    registerTenantSuspendedHandler(() => {
      setSelectedTenantId(null)
      setStatus(me?.roles.includes(ROLES.customer) ? 'choosing-tenant' : 'suspended')
    })
  }, [me])

  const signOut = useCallback(() => {
    setSelectedTenantId(null)
    keycloak.logout({ redirectUri: window.location.origin })
  }, [])

  if (status === 'initializing' || status === 'redirecting') {
    return <FullPageMessage title="Tenant Console" body="Signing you in…" />
  }

  if (status === 'loading-me') {
    return <FullPageMessage title="Tenant Console" body="Loading your account…" />
  }

  if (status === 'error' || !me) {
    return (
      <FullPageMessage
        title="Something went wrong"
        body="Couldn't load your account. Check that the API is running and try again."
        action={{ label: 'Retry', onClick: () => void loadMe() }}
      />
    )
  }

  const hasRole = (...roles: Role[]) => roles.some((r) => me.roles.includes(r))
  const authValue = { me, hasRole, signOut, chooseDifferentTenant }

  return (
    <AuthContext.Provider value={authValue}>
      {status === 'suspended' && <TenantSuspended onSignOut={signOut} />}
      {status === 'tenant-unavailable' && (
        <FullPageMessage
          title="That store isn't available"
          body="It may have just been deactivated. Choose another to keep browsing."
          action={{ label: 'Choose a different store', onClick: chooseDifferentTenant }}
        />
      )}
      {status === 'choosing-tenant' && <ChooseTenant onSelect={handleTenantChosen} />}
      {status === 'ready' && children}
    </AuthContext.Provider>
  )
}
