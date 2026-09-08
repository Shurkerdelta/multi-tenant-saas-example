# MultiTenant SaaS Example (.NET 8 + PostgreSQL + Keycloak)

A minimal but realistic example of a multi-tenant SaaS API: ASP.NET Core Web API,
EF Core / PostgreSQL for storage, and Keycloak for authentication + tenant/role claims.

## Architecture

**Tenancy model: shared database, shared schema.** Every tenant-scoped table (just
`products` here) lives in one schema with a `tenant_id` column. Isolation is enforced
in the application layer, in one place — `AppDbContext`:

- **Reads** are scoped by an EF Core [global query filter](src/MultiTenantSaas.Infrastructure/Persistence/AppDbContext.cs)
  on every entity implementing `ITenantEntity`. Controllers never write
  `WHERE tenant_id = ...` themselves — it's structurally impossible to forget.
- **Writes** are validated in `AppDbContext.SaveChanges[Async]`: new rows get
  `TenantId` stamped automatically, and any attempt to modify/delete a row belonging to
  a different tenant throws.
- Both are driven by `ITenantContext`, a scoped (per-request) service. If it's never
  populated, tenant-scoped queries return **zero rows** — isolation fails closed, not
  open.

**Tenant resolution:** [`TenantResolutionMiddleware`](src/MultiTenantSaas.Api/Middleware/TenantResolutionMiddleware.cs)
reads the `tenant_id` claim Keycloak puts on the access token, then looks that tenant
up in Postgres and rejects the request (403) if it doesn't exist or has been
deactivated. It does **not** trust the claim blindly — a still-valid access token could
otherwise keep working for a few minutes after a tenant is suspended.

**RBAC:** Keycloak realm roles (`platform-admin`, `tenant-admin`, `tenant-member`) are
mapped into the token and flattened by [`KeycloakClaimsTransformation`](src/MultiTenantSaas.Api/Auth/KeycloakClaimsTransformation.cs)
(Keycloak nests them under `realm_access.roles`; ASP.NET's `[Authorize(Roles = ...)]`
expects flat role claims). `platform-admin` is cross-tenant and bypasses tenant
resolution entirely — see `/api/tenants` (list/create) vs `/api/tenants/current`.

**Why shared-schema over schema-per-tenant / DB-per-tenant:** simplest operationally
(one connection pool, one migration to run), scales to a large number of tenants
without per-tenant provisioning, and is the right default unless you have a specific
compliance requirement for physical data separation. The tradeoff is that isolation is
enforced by application code + tests, not the database engine — for extra
defense-in-depth in production you'd add Postgres Row-Level Security policies on top
of (not instead of) the EF Core filter. See "Production considerations" below.

### Project layout

```
src/
  MultiTenantSaas.Domain/          entities, no dependencies
  MultiTenantSaas.Infrastructure/  EF Core DbContext, tenant context, configurations
  MultiTenantSaas.Api/             controllers, auth, middleware, composition root
keycloak/realm-export.json         demo realm: roles, client, seeded users
docker-compose.yml                 Postgres + Keycloak for local dev
requests.http                      end-to-end request collection (VS Code REST Client)
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Docker (for Postgres + Keycloak)

> This code was written without a local .NET SDK available to build/test it, so treat
> it as a strong starting point rather than something guaranteed to compile
> byte-for-byte. Run `dotnet build` first and fix up anything the compiler flags
> (most likely: exact package versions in the `.csproj` files, listed as `8.0.10` /
> `6.6.2` — bump to whatever's current if NuGet restore complains).

## Quickstart

```bash
# 1. Start Postgres + Keycloak (Keycloak auto-imports keycloak/realm-export.json)
docker compose up -d

# 2. Restore + create the initial migration (not checked in, so it's generated
#    against your actual installed EF Core tooling version)
dotnet tool install --global dotnet-ef   # if you don't already have it
dotnet restore
dotnet ef migrations add InitialCreate \
  --project src/MultiTenantSaas.Infrastructure \
  --startup-project src/MultiTenantSaas.Api
dotnet ef database update \
  --project src/MultiTenantSaas.Infrastructure \
  --startup-project src/MultiTenantSaas.Api

# 3. Run the API
dotnet run --project src/MultiTenantSaas.Api
# Swagger UI opens at http://localhost:5080/swagger
```

Keycloak admin console: http://localhost:8080 (admin / admin) — useful to poke at the
imported realm, or confirm it actually imported (check realm dropdown for
`multitenant-saas`).

## Demo users (seeded by `keycloak/realm-export.json`)

| Username | Password    | Tenant  | Role            |
|----------|-------------|---------|-----------------|
| alice    | `Passw0rd!` | Acme    | tenant-admin    |
| bob      | `Passw0rd!` | Acme    | tenant-member   |
| carol    | `Passw0rd!` | Globex  | tenant-admin    |
| root     | `Passw0rd!` | *(none)*| platform-admin  |

These are seeded for local demo purposes only — obviously don't ship a realm export
with hardcoded passwords to anywhere real.

Open [`requests.http`](requests.http) (VS Code REST Client extension, or copy the
`curl` shape below) for a full walkthrough: Alice creates a product, Carol (different
tenant) can't see it and gets a 404 fetching it directly by id, Bob (tenant-member)
gets a 403 trying to delete it, and root lists/creates tenants across the whole
platform.

```bash
# Get a token (Resource Owner Password Credentials grant — fine for this curl-based
# demo since there's no frontend; a real app should use Authorization Code + PKCE)
curl -s http://localhost:8080/realms/multitenant-saas/protocol/openid-connect/token \
  -d grant_type=password \
  -d client_id=multitenant-saas-api \
  -d username=alice \
  -d password='Passw0rd!' | jq -r .access_token
```

## Production considerations (not implemented here — scope of this example is the
tenancy + auth pattern, not a production checklist)

- **Row-Level Security**: add Postgres RLS policies on `tenant_id` as defense-in-depth
  behind the EF Core filter, in case a future raw-SQL query or migration script bypasses
  the ORM.
- **Auth flow**: swap the demo's password grant for Authorization Code + PKCE once
  there's a real frontend; rotate/short-lived refresh tokens; consider Keycloak's
  per-realm brute-force protection.
- **Tenant provisioning**: `POST /api/tenants` here only creates the DB row. A real
  provisioning flow also needs to create the tenant's users/groups in Keycloak (via its
  Admin REST API) and assign the `tenant_id` attribute — likely as a saga/background job
  rather than inline in the request.
- **Secrets**: connection strings and Keycloak config here are read from
  `appsettings.Development.json` for convenience; use user-secrets, environment
  variables, or a vault in anything beyond local dev.
- **Rate limiting / auditing**: none included; add per-tenant rate limits and an audit
  log of cross-tenant (platform-admin) actions before going to production.
