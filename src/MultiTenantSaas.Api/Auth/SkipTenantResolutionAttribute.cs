namespace MultiTenantSaas.Api.Auth;

/// <summary>
/// Marks a controller/action as not requiring a resolved tenant — used for
/// platform-admin endpoints that operate across all tenants (e.g. listing/creating
/// tenants themselves) rather than within one.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class SkipTenantResolutionAttribute : Attribute
{
}
