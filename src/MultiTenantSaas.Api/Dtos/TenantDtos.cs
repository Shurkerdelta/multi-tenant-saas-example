using System.ComponentModel.DataAnnotations;
using MultiTenantSaas.Domain.Entities;

namespace MultiTenantSaas.Api.Dtos;

public record CreateTenantRequest(
    [property: Required, MaxLength(200)] string Name,
    [property: Required, MaxLength(100), RegularExpression("^[a-z0-9-]+$")] string Slug);

public record TenantResponse(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive,
    DateTimeOffset CreatedAt)
{
    public static TenantResponse FromEntity(Tenant t) =>
        new(t.Id, t.Name, t.Slug, t.IsActive, t.CreatedAt);
}

public record MeResponse(
    string? Subject,
    string? Username,
    Guid? TenantId,
    string? TenantSlug,
    IReadOnlyCollection<string> Roles);
