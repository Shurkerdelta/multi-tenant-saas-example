import { apiFetch } from './client'
import type { CreateTenantValues, TenantResponse } from '../types'

export function getCurrentTenant() {
  return apiFetch<TenantResponse>('/tenants/current')
}

export function listTenants() {
  return apiFetch<TenantResponse[]>('/tenants')
}

export function createTenant(values: CreateTenantValues) {
  return apiFetch<TenantResponse>('/tenants', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

// Slugify as the admin types: lowercase, spaces/underscores to hyphens, strip
// anything outside the API's own pattern (^[a-z0-9-]+$). The field stays editable —
// this only seeds a sensible starting value.
export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
