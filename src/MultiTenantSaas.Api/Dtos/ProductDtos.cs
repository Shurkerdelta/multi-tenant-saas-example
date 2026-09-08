using System.ComponentModel.DataAnnotations;
using MultiTenantSaas.Domain.Entities;

namespace MultiTenantSaas.Api.Dtos;

public record CreateProductRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description,
    [Range(0, double.MaxValue)] decimal Price,
    [Range(0, int.MaxValue)] int StockQuantity);

public record UpdateProductRequest(
    [Required, MaxLength(200)] string Name,
    [MaxLength(2000)] string? Description,
    [Range(0, double.MaxValue)] decimal Price,
    [Range(0, int.MaxValue)] int StockQuantity);

public record ProductResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    int StockQuantity,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt)
{
    public static ProductResponse FromEntity(Product p) =>
        new(p.Id, p.Name, p.Description, p.Price, p.StockQuantity, p.CreatedAt, p.UpdatedAt);
}
