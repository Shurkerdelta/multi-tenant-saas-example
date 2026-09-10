// Mirrors the API's DTOs (src/MultiTenantSaas.Api/Dtos) — see that project for the
// source of truth on shapes and validation.

export const ROLES = {
  platformAdmin: 'platform-admin',
  tenantAdmin: 'tenant-admin',
  tenantMember: 'tenant-member',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export interface MeResponse {
  subject: string | null
  username: string | null
  tenantId: string | null
  tenantSlug: string | null
  roles: Role[]
}

export interface ProductResponse {
  id: string
  name: string
  description: string | null
  price: number
  stockQuantity: number
  createdAt: string
  updatedAt: string | null
}

export interface ProductFormValues {
  name: string
  description: string
  price: string
  stockQuantity: string
}

export interface TenantResponse {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
}

export interface CreateTenantValues {
  name: string
  slug: string
}

// Shape of the JSON body TenantResolutionMiddleware and ASP.NET's own error
// responses write on failure — best-effort, since not every error has one.
export interface ApiErrorBody {
  error?: string
  title?: string
  errors?: Record<string, string[]>
}
