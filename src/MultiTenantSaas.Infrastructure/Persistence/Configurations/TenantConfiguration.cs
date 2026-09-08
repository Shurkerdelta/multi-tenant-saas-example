using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MultiTenantSaas.Domain.Entities;

namespace MultiTenantSaas.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    // Fixed, well-known ids so they can be shared with the seeded Keycloak demo users'
    // "tenant_id" attribute (see keycloak/realm-export.json). In a real system tenants
    // are created dynamically via the platform-admin API, not hardcoded.
    public static readonly Guid AcmeTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid GlobexTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly DateTimeOffset SeedTimestamp = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Slug)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(t => t.Slug).IsUnique();

        builder.HasData(
            new Tenant
            {
                Id = AcmeTenantId,
                Name = "Acme Corp",
                Slug = "acme",
                IsActive = true,
                CreatedAt = SeedTimestamp,
            },
            new Tenant
            {
                Id = GlobexTenantId,
                Name = "Globex Inc",
                Slug = "globex",
                IsActive = true,
                CreatedAt = SeedTimestamp,
            });
    }
}
