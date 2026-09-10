import { keycloak } from '../auth/keycloak'
import type { ApiErrorBody } from '../types'

export class ApiError extends Error {
  status: number
  body: ApiErrorBody | null

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error ?? body?.title ?? `Request failed (${status})`)
    this.status = status
    this.body = body
  }
}

// Set once by AuthProvider so a request anywhere in the app can report the one 403
// that isn't an ordinary permission problem — see TenantResolutionMiddleware.cs.
// Session-lifetime callback; not exported for pages to call directly.
let onTenantSuspended: (() => void) | null = null
export function registerTenantSuspendedHandler(handler: () => void) {
  onTenantSuspended = handler
}

const TENANT_SUSPENDED_MESSAGE = 'Tenant not found or inactive.'

async function authHeader(): Promise<HeadersInit> {
  try {
    // Refreshes if the token has less than 30s left; throws if the refresh token
    // itself is no longer valid, which we treat the same as "not signed in".
    await keycloak.updateToken(30)
  } catch {
    keycloak.login()
    throw new ApiError(401, { error: 'Session expired.' })
  }
  return { Authorization: `Bearer ${keycloak.token}` }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await authHeader()
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...auth,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (res.status === 204) {
    return undefined as T
  }

  let body: ApiErrorBody | null = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      // Non-JSON body (e.g. a bare 403 from [Authorize] with no challenge scheme
      // configured) — leave body null and fall back to the status code.
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      keycloak.login()
    }
    if (res.status === 403 && body?.error === TENANT_SUSPENDED_MESSAGE) {
      onTenantSuspended?.()
    }
    throw new ApiError(res.status, body)
  }

  return body as T
}
