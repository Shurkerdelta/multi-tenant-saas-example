using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MultiTenantSaas.Api.Auth;
using MultiTenantSaas.Api.Dtos;
using MultiTenantSaas.Domain.Entities;
using MultiTenantSaas.Infrastructure.Persistence;
using MultiTenantSaas.Infrastructure.Tenancy;

namespace MultiTenantSaas.Api.Controllers;

/// <summary>
/// Tenant itself is not tenant-scoped (there's no "current tenant" filter to apply to
/// the tenants table), so access is controlled explicitly per action: "current" is
/// available to any authenticated user (scoped to their own resolved tenant), while
/// listing/creating tenants is a platform-admin-only, cross-tenant operation that
/// opts out of tenant resolution entirely via [SkipTenantResolution].
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TenantsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("current")]
    public async Task<ActionResult<TenantResponse>> GetCurrent([FromServices] ITenantContext tenantContext, CancellationToken ct)
    {
        if (!tenantContext.IsSet)
        {
            return Forbid();
        }

        var tenant = await _db.Tenants.FirstAsync(t => t.Id == tenantContext.TenantId, ct);
        return Ok(TenantResponse.FromEntity(tenant));
    }

    [HttpGet]
    [Authorize(Roles = Roles.PlatformAdmin)]
    [SkipTenantResolution]
    public async Task<ActionResult<IEnumerable<TenantResponse>>> GetAll(CancellationToken ct)
    {
        var tenants = await _db.Tenants.OrderBy(t => t.Name).ToListAsync(ct);
        return Ok(tenants.Select(TenantResponse.FromEntity));
    }

    [HttpPost]
    [Authorize(Roles = Roles.PlatformAdmin)]
    [SkipTenantResolution]
    public async Task<ActionResult<TenantResponse>> Create(CreateTenantRequest request, CancellationToken ct)
    {
        var slugTaken = await _db.Tenants.AnyAsync(t => t.Slug == request.Slug, ct);
        if (slugTaken)
        {
            return Conflict(new { error = $"Slug '{request.Slug}' is already in use." });
        }

        var tenant = new Tenant
        {
            Name = request.Name,
            Slug = request.Slug,
            IsActive = true,
        };

        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetCurrent), TenantResponse.FromEntity(tenant));
    }
}
