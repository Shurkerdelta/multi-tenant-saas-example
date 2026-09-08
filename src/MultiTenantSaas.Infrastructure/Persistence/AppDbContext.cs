using Microsoft.EntityFrameworkCore;
using MultiTenantSaas.Domain.Entities;
using MultiTenantSaas.Infrastructure.Tenancy;

namespace MultiTenantSaas.Infrastructure.Persistence;

/// <summary>
/// Central EF Core context implementing "shared database, shared schema" multi-tenancy:
/// every tenant-scoped table lives in one schema with a <c>tenant_id</c> column, and
/// this context enforces isolation in two places:
///
///  1. A global query filter on every <see cref="ITenantEntity"/> so reads never need
///     to remember to add "WHERE tenant_id = ...".
///  2. <see cref="ApplyTenantRules"/> on save, which stamps <c>TenantId</c> on new rows
///     and refuses to touch rows belonging to a different tenant.
///
/// Both are driven by <see cref="ITenantContext"/>, which is unset unless the tenant
/// has been resolved and validated for the current request (see
/// TenantResolutionMiddleware in the API project). If it's unset, tenant-scoped queries
/// return nothing — isolation fails closed, not open.
/// </summary>
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenantContext.TenantId);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyTenantRules();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyTenantRules();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyTenantRules()
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (!_tenantContext.IsSet)
                    {
                        throw new InvalidOperationException(
                            $"Cannot create a '{entry.Entity.GetType().Name}' without a resolved tenant context.");
                    }

                    if (entry.Entity.TenantId == Guid.Empty)
                    {
                        entry.Entity.TenantId = _tenantContext.TenantId!.Value;
                    }
                    else if (entry.Entity.TenantId != _tenantContext.TenantId!.Value)
                    {
                        throw new InvalidOperationException(
                            $"Cannot create a '{entry.Entity.GetType().Name}' for a different tenant than the current request.");
                    }

                    break;

                case EntityState.Modified:
                case EntityState.Deleted:
                    if (!_tenantContext.IsSet || entry.Entity.TenantId != _tenantContext.TenantId!.Value)
                    {
                        throw new InvalidOperationException(
                            $"Cannot modify or delete a '{entry.Entity.GetType().Name}' belonging to another tenant.");
                    }

                    break;
            }
        }
    }
}
