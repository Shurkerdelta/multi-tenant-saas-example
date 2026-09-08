using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MultiTenantSaas.Api.Auth;
using MultiTenantSaas.Api.Dtos;
using MultiTenantSaas.Domain.Entities;
using MultiTenantSaas.Infrastructure.Persistence;

namespace MultiTenantSaas.Api.Controllers;

/// <summary>
/// Standard tenant-scoped CRUD. Note there is no manual "WHERE tenant_id = ..." anywhere
/// here — AppDbContext's global query filter takes care of it, and SaveChanges stamps/
/// validates TenantId. Requesting another tenant's product id returns 404 (not 403),
/// which avoids confirming to a caller that the id even exists in another tenant.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponse>>> GetAll(CancellationToken ct)
    {
        var products = await _db.Products
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        return Ok(products.Select(ProductResponse.FromEntity));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
        {
            return NotFound();
        }

        return Ok(ProductResponse.FromEntity(product));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.TenantAdmin},{Roles.TenantMember}")]
    public async Task<ActionResult<ProductResponse>> Create(CreateProductRequest request, CancellationToken ct)
    {
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, ProductResponse.FromEntity(product));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<IActionResult> Update(Guid id, UpdateProductRequest request, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
        {
            return NotFound();
        }

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.TenantAdmin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
        {
            return NotFound();
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
