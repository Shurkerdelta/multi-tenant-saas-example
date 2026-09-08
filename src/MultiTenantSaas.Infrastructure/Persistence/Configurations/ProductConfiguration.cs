using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MultiTenantSaas.Domain.Entities;

namespace MultiTenantSaas.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.TenantId)
            .IsRequired();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.Price)
            .HasColumnType("numeric(18,2)");

        // Every tenant-scoped table should have tenant_id as a leading index column:
        // it is the column every query filters on, and it's what makes shared-schema
        // multi-tenancy perform acceptably at scale.
        builder.HasIndex(p => p.TenantId);
        builder.HasIndex(p => new { p.TenantId, p.Name });
    }
}
