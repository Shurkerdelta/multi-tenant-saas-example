# Tenant Console

The browser front end for the multi-tenant SaaS example — React + TypeScript + Vite,
implementing the [UI specification](../README.md) drafted for this API. Every screen,
role, and edge case it covers is described there; this file just covers running it.

## Prerequisites

- The API stack running: `docker compose up -d` from the repo root, then
  `dotnet run --project ../src/MultiTenantSaas.Api` (see the root README).
- Node 20+.

## Running it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. The dev server proxies `/api/*` to the API at
`http://localhost:5080` (see `vite.config.ts`) — the browser only ever talks to one
origin, so the API needs no CORS configuration for this to work.

Sign in with any of the demo users from the root README (`alice`, `bob`, `carol`,
`root` — password `Passw0rd!` for all).

## Why login redirects instead of a form

Auth is Authorization Code + PKCE against Keycloak's own hosted login page
(`keycloak-js`) — the console never sees a password. This requires the realm's
client to have the standard flow enabled and a PKCE challenge method set; both are
already turned on in [`keycloak/realm-export.json`](../keycloak/realm-export.json)
for `http://localhost:5173`. Pointing this at a different Keycloak or a different
dev port needs matching updates to that client's `redirectUris`/`webOrigins`, or
override the client config via `.env.local` (see `.env.example`).

## Structure

```
src/
  auth/       Keycloak client, session/token lifecycle, role context
  api/        Typed fetch wrappers over the API's endpoints
  components/ Shared chrome and UI states (app shell, tables' empty/loading/error)
  pages/      One file per screen in the spec, grouped by area (products/tenants/tenant)
```
