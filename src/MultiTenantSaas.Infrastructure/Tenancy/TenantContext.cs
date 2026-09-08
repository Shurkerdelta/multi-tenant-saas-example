namespace MultiTenantSaas.Infrastructure.Tenancy;

/// <summary>
/// Register this as Scoped (one instance per HTTP request / DI scope) so each request
/// gets its own tenant, never leaking across requests via a shared/singleton instance.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }

    public string? TenantSlug { get; private set; }

    public bool IsSet => TenantId.HasValue;

    public void SetTenant(Guid tenantId, string slug)
    {
        TenantId = tenantId;
        TenantSlug = slug;
    }
}
