using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace MultiTenantSaas.Api.Auth;

/// <summary>
/// Keycloak puts realm roles inside a nested JSON claim:
///   "realm_access": { "roles": ["tenant-admin", ...] }
/// ASP.NET Core's [Authorize(Roles = "...")] / User.IsInRole(...) only look at flat
/// claims of the identity's RoleClaimType (ClaimTypes.Role by default). This
/// transformation flattens realm_access.roles into individual role claims so the
/// standard authorization APIs work unmodified against Keycloak tokens.
/// </summary>
public class KeycloakClaimsTransformation : IClaimsTransformation
{
    private const string MappedMarkerClaimType = "roles_mapped";

    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = principal.Identities.FirstOrDefault(i => i.IsAuthenticated);
        if (identity is null)
        {
            return Task.FromResult(principal);
        }

        // IClaimsTransformation can run more than once per request; guard against
        // adding duplicate role claims.
        if (identity.HasClaim(c => c.Type == MappedMarkerClaimType))
        {
            return Task.FromResult(principal);
        }

        var realmAccessClaim = identity.FindFirst("realm_access");
        if (realmAccessClaim is not null)
        {
            using var doc = JsonDocument.Parse(realmAccessClaim.Value);
            if (doc.RootElement.TryGetProperty("roles", out var roles) && roles.ValueKind == JsonValueKind.Array)
            {
                foreach (var role in roles.EnumerateArray())
                {
                    var value = role.GetString();
                    if (!string.IsNullOrEmpty(value))
                    {
                        identity.AddClaim(new Claim(identity.RoleClaimType, value));
                    }
                }
            }
        }

        identity.AddClaim(new Claim(MappedMarkerClaimType, "true"));

        return Task.FromResult(principal);
    }
}
