import { useEffect } from 'react'
import { keycloak } from '../auth/keycloak'
import { FullPageMessage } from '../components/FullPageMessage'

// Not a form of its own (spec §03) — an explicit entry point for a "sign in again"
// link (e.g. after signing out) that immediately hands off to Keycloak's hosted
// login page. In normal use, <AuthProvider> redirects here before this ever renders.
export function SignIn() {
  useEffect(() => {
    keycloak.login({ redirectUri: `${window.location.origin}/auth/callback` })
  }, [])

  return <FullPageMessage title="Tenant Console" body="Taking you to sign in…" />
}
