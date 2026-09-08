namespace MultiTenantSaas.Domain.Entities;

/// <summary>
/// Marks an entity as belonging to a single tenant. Every entity implementing this
/// interface is automatically scoped by <c>AppDbContext</c> via a global query filter
/// and has its <see cref="TenantId"/> stamped/validated on save.
/// </summary>
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
