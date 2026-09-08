using Microsoft.EntityFrameworkCore;
using MultiTenantSaas.Api.Auth;
using MultiTenantSaas.Infrastructure.Persistence;
using MultiTenantSaas.Infrastructure.Tenancy;

namespace MultiTenantSaas.Api.Middleware;

/// <summary>
/// Resolves the current tenant for every authenticated request and populates
/// <see cref="ITenantContext"/> before controllers/EF Core run.
///
/// Deliberately does NOT trust the JWT's tenant_id claim blindly: it looks the tenant
/// up in the database and rejects the request if the tenant doesn't exist or has been
/// deactivated. This matters because a still-valid access token can outlive a tenant
/// being suspended (tokens are typically valid for minutes; revoking a tenant should
/// take effect immediately).
///
/// Must run after UseAuthentication (needs context.User) and after UseRouting (needs
/// context.GetEndpoint() for the [SkipTenantResolution] / [AllowAnonymous] checks).
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db, ITenantContext tenantContext)
    {
        var endpoint = context.GetEndpoint();

        var skipTenantResolution =
            endpoint?.Metadata.GetMetadata<SkipTenantResolutionAttribute>() is not null
            || endpoint?.Metadata.GetMetadata<Microsoft.AspNetCore.Authorization.IAllowAnonymous>() is not null;

        if (skipTenantResolution || context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var tenantIdClaim = context.User.FindFirst("tenant_id")?.Value;

        // Platform admins are cross-tenant by design and typically carry no tenant_id
        // attribute at all — let them through unscoped rather than requiring one.
        if (string.IsNullOrEmpty(tenantIdClaim) && context.User.IsInRole(Roles.PlatformAdmin))
        {
            await _next(context);
            return;
        }

        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            await WriteForbiddenAsync(context, "Missing or invalid 'tenant_id' claim on access token.");
            return;
        }

        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, context.RequestAborted);

        if (tenant is null || !tenant.IsActive)
        {
            await WriteForbiddenAsync(context, "Tenant not found or inactive.");
            return;
        }

        tenantContext.SetTenant(tenant.Id, tenant.Slug);

        await _next(context);
    }

    private static Task WriteForbiddenAsync(HttpContext context, string error)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return context.Response.WriteAsJsonAsync(new { error });
    }
}
