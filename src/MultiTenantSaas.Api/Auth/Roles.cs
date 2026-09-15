namespace MultiTenantSaas.Api.Auth;

/// <summary>
/// Realm roles defined in the Keycloak realm (see keycloak/realm-export.json).
/// "PlatformAdmin" is a cross-tenant role (no tenant_id attribute required).
/// "TenantAdmin"/"TenantMember" are staff: their token carries a fixed tenant_id
/// attribute assigned when their account was created.
/// "Customer" is read-only (see ProductsController) and carries no tenant_id
/// attribute at all — a customer picks which tenant to browse client-side (from
/// TenantsController.GetDirectory) and sends it per-request instead of having one
/// fixed on their account (see TenantResolutionMiddleware). Once a tenant is
/// selected, the same per-tenant isolation applies to them as to everyone else.
/// </summary>
public static class Roles
{
    public const string PlatformAdmin = "platform-admin";
    public const string TenantAdmin = "tenant-admin";
    public const string TenantMember = "tenant-member";
    public const string Customer = "customer";
}
