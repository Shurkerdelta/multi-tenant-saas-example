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
/// Staff (tenant-admin/tenant-member) carry a fixed <c>tenant_id</c> token claim and
/// are always resolved from it. A Customer carries no <c>tenant_id</c> claim at all —
/// they pick a tenant to browse client-side (see TenantsController.GetDirectory) and
/// send it on each request via the <c>X-Tenant-Id</c> header instead. Either way the
/// requested id is looked up and validated the same way; the header is only ever
/// consulted when the token itself has no claim, so it can't override a staff
/// member's actual assignment.
///
/// Must run after UseAuthentication (needs context.User) and after UseRouting (needs
/// context.GetEndpoint() for the [SkipTenantResolution] / [AllowAnonymous] checks).
/// </summary>
public class TenantResolutionMiddleware
{
    private const string TenantHeaderName = "X-Tenant-Id";

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

        Guid? requestedTenantId;

        if (!string.IsNullOrEmpty(tenantIdClaim))
        {
            if (!Guid.TryParse(tenantIdClaim, out var claimedTenantId))
            {
                await WriteForbiddenAsync(context, "Missing or invalid 'tenant_id' claim on access token.");
                return;
            }

            requestedTenantId = claimedTenantId;
        }
        else if (context.User.IsInRole(Roles.Customer))
        {
            var headerValue = context.Request.Headers[TenantHeaderName].FirstOrDefault();

            if (string.IsNullOrEmpty(headerValue))
            {
                // Hasn't chosen a tenant yet — let the request through unscoped rather
                // than erroring, so e.g. /api/me can report that back to the UI and it
                // can show a picker instead of a broken page.
                requestedTenantId = null;
            }
            else if (!Guid.TryParse(headerValue, out var selectedTenantId))
            {
                await WriteForbiddenAsync(context, $"Invalid '{TenantHeaderName}' header.");
                return;
            }
            else
            {
                requestedTenantId = selectedTenantId;
            }
        }
        else
        {
            // Staff role with no tenant_id claim at all — a real misconfiguration,
            // not a "hasn't chosen yet" state like it is for a Customer.
            await WriteForbiddenAsync(context, "Missing or invalid 'tenant_id' claim on access token.");
            return;
        }

        if (requestedTenantId is null)
        {
            await _next(context);
            return;
        }

        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == requestedTenantId, context.RequestAborted);

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
