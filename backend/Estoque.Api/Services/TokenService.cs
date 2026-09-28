using System.Security.Claims;
using Estoque.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.Extensions.Options;

namespace Estoque.Api.Services;

// Gera o token de acesso com o esquema "BearerToken" que já vem no ASP.NET Core 8
// (não precisa de pacote NuGet extra nem de chave secreta no appsettings).
// O token é criptografado pelo Data Protection e validado automaticamente pelo [Authorize].
public class TokenService
{
    public const string Esquema = BearerTokenDefaults.AuthenticationScheme;
    public static readonly TimeSpan Validade = TimeSpan.FromHours(8);

    private readonly IOptionsMonitor<BearerTokenOptions> _opcoes;

    public TokenService(IOptionsMonitor<BearerTokenOptions> opcoes) => _opcoes = opcoes;

    public string Gerar(Usuario usuario)
    {
        var claims = new[]
        {
            new Claim("sub", usuario.Id.ToString()),
            new Claim("email", usuario.Email),
            new Claim("name", usuario.Nome),
            new Claim("role", usuario.Perfil),
        };

        // "name" e "role" viram User.Identity.Name e a base do [Authorize(Roles = ...)].
        var identidade = new ClaimsIdentity(claims, Esquema, "name", "role");
        var agora = DateTimeOffset.UtcNow;
        var propriedades = new AuthenticationProperties
        {
            IssuedUtc = agora,
            ExpiresUtc = agora.Add(Validade),
        };

        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identidade), propriedades, Esquema);
        return _opcoes.Get(Esquema).BearerTokenProtector.Protect(ticket);
    }
}
