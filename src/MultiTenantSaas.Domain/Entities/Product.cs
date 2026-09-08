namespace MultiTenantSaas.Domain.Entities;

/// <summary>
/// Sample tenant-scoped business entity used to demonstrate CRUD + tenant isolation.
/// </summary>
public class Product : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    public string Name { get; set; } = default!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }
}
