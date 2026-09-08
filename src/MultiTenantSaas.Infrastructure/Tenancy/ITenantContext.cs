namespace MultiTenantSaas.Infrastructure.Tenancy;

/// <summary>
/// Ambient, per-request tenant resolved for the current HTTP request. Populated by
/// the API's tenant-resolution middleware after authentication, and consumed by
/// <c>AppDbContext</c> to scope every query and save.
///
/// Deliberately nullable/unset by default: if nothing populates it, every tenant-scoped
/// query returns zero rows (fail closed) instead of leaking data across tenants.
/// </summary>
public interface ITenantContext
{
    Guid? TenantId { get; }

    string? TenantSlug { get; }

    bool IsSet { get; }

    void SetTenant(Guid tenantId, string slug);
}
