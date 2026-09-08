using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MultiTenantSaas.Api.Dtos;
using MultiTenantSaas.Infrastructure.Tenancy;

namespace MultiTenantSaas.Api.Controllers;

/// <summary>
/// Debug/demo endpoint: shows exactly what the API resolved for the caller — identity,
/// tenant, and roles — useful when wiring up Keycloak to see whether claims are mapped
/// as expected. Works for both tenant users (TenantId populated) and platform admins
/// (TenantId null — see TenantResolutionMiddleware's platform-admin bypass).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly ITenantContext _tenantContext;

    public MeController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public ActionResult<MeResponse> Get()
    {
        return Ok(new MeResponse(
            Subject: User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value,
            Username: User.Identity?.Name ?? User.FindFirst("preferred_username")?.Value,
            TenantId: _tenantContext.TenantId,
            TenantSlug: _tenantContext.TenantSlug,
            Roles: User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray()));
    }
}
