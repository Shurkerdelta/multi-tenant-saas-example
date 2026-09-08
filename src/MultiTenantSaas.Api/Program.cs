using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MultiTenantSaas.Api.Auth;
using MultiTenantSaas.Api.Middleware;
using MultiTenantSaas.Infrastructure.Persistence;
using MultiTenantSaas.Infrastructure.Tenancy;

var builder = WebApplication.CreateBuilder(args);

// ---- Database -------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:Default configuration.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Scoped: a fresh, empty tenant context per request. Populated by
// TenantResolutionMiddleware once the caller's tenant has been validated.
builder.Services.AddScoped<ITenantContext, TenantContext>();

// ---- AuthN / AuthZ (Keycloak) ----------------------------------------------
var keycloakAuthority = builder.Configuration["Keycloak:Authority"]
    ?? throw new InvalidOperationException("Missing Keycloak:Authority configuration.");
var keycloakAudience = builder.Configuration["Keycloak:Audience"]
    ?? throw new InvalidOperationException("Missing Keycloak:Audience configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = keycloakAuthority;
        options.Audience = keycloakAudience;
        // Keycloak in docker-compose runs over plain HTTP for local dev only.
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = keycloakAuthority,
            ValidateAudience = true,
            ValidAudience = keycloakAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// Flattens Keycloak's nested realm_access.roles claim into standard role claims so
// [Authorize(Roles = "...")] / User.IsInRole(...) work against Keycloak tokens.
builder.Services.AddTransient<IClaimsTransformation, KeycloakClaimsTransformation>();

builder.Services.AddAuthorization();

// ---- API plumbing -----------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "MultiTenant SaaS API", Version = "v1" });

    var bearerScheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Paste a Keycloak access token (no 'Bearer ' prefix needed).",
    };
    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { new Microsoft.OpenApi.Models.OpenApiSecurityScheme { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() },
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

app.UseAuthentication();

// Must run after routing (needs the resolved endpoint) and after authentication
// (needs context.User), and before authorization (role checks need the resolved
// tenant context for some endpoints' business logic, even though authorization
// itself only inspects claims).
app.UseMiddleware<TenantResolutionMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposed for WebApplicationFactory-based integration tests.
public partial class Program
{
}
