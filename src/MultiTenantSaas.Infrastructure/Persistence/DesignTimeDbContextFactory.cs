using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using MultiTenantSaas.Infrastructure.Tenancy;

namespace MultiTenantSaas.Infrastructure.Persistence;

/// <summary>
/// Lets `dotnet ef migrations add` / `dotnet ef database update` construct an
/// AppDbContext without running the full API host (and its DI container). Only used
/// at design time — the running app always gets its AppDbContext from Program.cs.
///
/// Connection string comes from the CONNECTIONSTRINGS__DEFAULT env var, falling back
/// to the docker-compose local default so `dotnet ef` works out of the box after
/// `docker compose up -d postgres`.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CONNECTIONSTRINGS__DEFAULT")
            ?? "Host=localhost;Port=5432;Database=multitenant_saas;Username=saas_app;Password=saas_app_password";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        // No tenant is resolved at design time; migrations don't need one.
        return new AppDbContext(optionsBuilder.Options, new TenantContext());
    }
}
