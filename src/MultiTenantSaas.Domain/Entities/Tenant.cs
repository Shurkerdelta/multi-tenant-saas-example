namespace MultiTenantSaas.Domain.Entities;

/// <summary>
/// A tenant (customer organization). This entity is intentionally NOT tenant-scoped
/// itself — it is the root of the tenancy hierarchy and is only reachable through
/// platform-admin endpoints or the "current tenant" lookup.
/// </summary>
public class Tenant : BaseEntity
{
    public string Name { get; set; } = default!;

    /// <summary>URL/subdomain-friendly unique identifier for the tenant.</summary>
    public string Slug { get; set; } = default!;

    public bool IsActive { get; set; } = true;
}
