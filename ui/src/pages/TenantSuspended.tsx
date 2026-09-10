import { FullPageMessage } from '../components/FullPageMessage'

// Reached when the tenant-resolution middleware's re-check finds the tenant gone or
// deactivated — distinct from an ordinary 403, because signing back in won't fix it
// (see TenantResolutionMiddleware.cs). Sign out is the only action offered.
export function TenantSuspended({ onSignOut }: { onSignOut: () => void }) {
  return (
    <FullPageMessage
      title="Your workspace is no longer active"
      body="This account's tenant has been deactivated or removed. Contact your platform administrator — signing in again won't change this."
      action={{ label: 'Sign out', onClick: onSignOut }}
    />
  )
}
