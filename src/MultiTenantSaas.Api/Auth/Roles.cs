namespace MultiTenantSaas.Api.Auth;

/// <summary>
/// Realm roles defined in the Keycloak realm (see keycloak/realm-export.json).
/// "PlatformAdmin" is a cross-tenant role (no tenant_id attribute required);
/// "TenantAdmin"/"TenantMember" are roles a user holds within their own tenant.
/// </summary>
public static class Roles
{
    public const string PlatformAdmin = "platform-admin";
    public const string TenantAdmin = "tenant-admin";
    public const string TenantMember = "tenant-member";
}
