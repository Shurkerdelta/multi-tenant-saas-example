namespace MultiTenantSaas.Api.Auth;

/// <summary>
/// Realm roles defined in the Keycloak realm (see keycloak/realm-export.json).
/// "PlatformAdmin" is a cross-tenant role (no tenant_id attribute required);
/// "TenantAdmin"/"TenantMember"/"Customer" are roles a user holds within their own
/// tenant — "Customer" is read-only (see ProductsController): a customer's token
/// carries the same tenant_id shape as staff, so the existing per-tenant isolation
/// applies to them unchanged. There is no cross-tenant customer browsing.
/// </summary>
public static class Roles
{
    public const string PlatformAdmin = "platform-admin";
    public const string TenantAdmin = "tenant-admin";
    public const string TenantMember = "tenant-member";
    public const string Customer = "customer";
}
