# TODO

Combined backlog from [README.md](README.md)'s "Production considerations" and the
Tenant Console UI spec's "Out of scope" section. Not a production checklist — this is
a demo/example repo — just a record of known gaps and their priority relative to each
other.

## Backend / API

1. **Tenant activation & deactivation endpoint.** Nothing can flip a tenant's
   `isActive` today except a manual DB edit — blocks both a UI status toggle and the
   "suspend a tenant" scenario `TenantResolutionMiddleware`'s re-check exists for.
2. **Real tenant provisioning.** `POST /api/tenants` only writes the DB row; a real
   flow also needs to create the tenant's users/groups in Keycloak via its Admin REST
   API — likely a background job/saga, not inline in the request.
3. **Postgres Row-Level Security.** Defense-in-depth behind the EF Core global query
   filter, in case a future raw-SQL query or migration script bypasses the ORM.
4. **Rate limiting.** No per-tenant limits.
5. **Audit log of platform-admin actions.** Cross-tenant actions aren't recorded
   anywhere.
6. **Secrets out of `appsettings.Development.json`.** User-secrets, env vars, or a
   vault for anything beyond local dev.
7. ~~Auth flow: Authorization Code + PKCE~~ — done (Tenant Console UI).

## Frontend / Tenant Console

8. **Tenant self-editing** (rename, change slug). Same root cause as #1/#2 — no
   endpoint yet.
9. **Product search, filtering, pagination.** Fine at demo scale; do API and UI
   together once a real tenant's catalog outgrows one screen.

## Priority

#1 and #2 unblock the most — both the deactivation UI and tenant self-editing UI
depend on them existing.
