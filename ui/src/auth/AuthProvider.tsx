import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { keycloak } from './keycloak'
import { AuthContext } from './AuthContext'
import { registerTenantSuspendedHandler, ApiError } from '../api/client'
import { getMe } from '../api/me'
import type { MeResponse, Role } from '../types'
import { FullPageMessage } from '../components/FullPageMessage'
import { TenantSuspended } from '../pages/TenantSuspended'

type Status = 'initializing' | 'redirecting' | 'loading-me' | 'error' | 'suspended' | 'ready'

const CALLBACK_PATH = '/auth/callback'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('initializing')
  const [me, setMe] = useState<MeResponse | null>(null)

  const loadMe = useCallback(async () => {
    setStatus('loading-me')
    try {
      const response = await getMe()
      setMe(response)
      setStatus('ready')
    } catch (err) {
      if (err instanceof ApiError && err.body?.error?.includes('inactive')) {
        setStatus('suspended')
      } else {
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    registerTenantSuspendedHandler(() => setStatus('suspended'))

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

  const signOut = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin })
  }, [])

  if (status === 'initializing' || status === 'redirecting') {
    return <FullPageMessage title="Tenant Console" body="Signing you in…" />
  }

  if (status === 'loading-me') {
    return <FullPageMessage title="Tenant Console" body="Loading your account…" />
  }

  if (status === 'suspended') {
    return <TenantSuspended onSignOut={signOut} />
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

  return <AuthContext.Provider value={{ me, hasRole, signOut }}>{children}</AuthContext.Provider>
}
