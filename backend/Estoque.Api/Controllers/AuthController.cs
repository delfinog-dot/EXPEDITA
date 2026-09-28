using System.Net.Mail;
using Estoque.Api.Data;
using Estoque.Api.Dtos;
using Estoque.Api.Models;
using Estoque.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Estoque.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly EstoqueDbContext _db;
    private readonly TokenService _tokens;
    private readonly IPasswordHasher<Usuario> _hasher;

    public AuthController(EstoqueDbContext db, TokenService tokens, IPasswordHasher<Usuario> hasher)
    {
        _db = db;
        _tokens = tokens;
        _hasher = hasher;
    }

    // POST: api/auth/register  -> cria a conta e já devolve o token
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthRespostaDto>> Cadastrar(CadastroDto dto)
    {
        var nome = dto.Nome?.Trim() ?? string.Empty;
        var email = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var perfil = dto.Perfil?.Trim().ToLowerInvariant() ?? string.Empty;
        var senha = dto.Senha ?? string.Empty;

        if (nome.Length < 2) return Erro("Informe seu nome.");
        if (!EmailValido(email)) return Erro("Informe um e-mail válido.");
        if (!Perfis.Todos.Contains(perfil)) return Erro("Escolha um perfil válido.");
        if (senha.Length < 8) return Erro("A senha deve ter no mínimo 8 caracteres.");

        // O banco InMemory não garante o índice único, então a checagem é feita aqui.
        if (await _db.Usuarios.AnyAsync(u => u.Email == email))
            return Conflict(new { mensagem = "Este e-mail já está cadastrado." });

        var usuario = new Usuario { Nome = nome, Email = email, Perfil = perfil };
        usuario.SenhaHash = _hasher.HashPassword(usuario, senha);

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Eu), Resposta(usuario));
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthRespostaDto>> Entrar(LoginDto dto)
    {
        var email = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var senha = dto.Senha ?? string.Empty;

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        var senhaConfere = usuario is not null &&
            _hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, senha) != PasswordVerificationResult.Failed;

        // Mesma mensagem para e-mail inexistente e senha errada.
        if (usuario is null || !senhaConfere)
            return Unauthorized(new { mensagem = "E-mail ou senha incorretos." });

        return Ok(Resposta(usuario));
    }

    // GET: api/auth/me  -> dados do usuário do token
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioDto>> Eu()
    {
        if (!Guid.TryParse(User.FindFirst("sub")?.Value, out var id))
            return Unauthorized(new { mensagem = "Sessão inválida. Entre novamente." });

        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return Unauthorized(new { mensagem = "Sessão inválida. Entre novamente." });

        return Ok(new UsuarioDto(usuario.Nome, usuario.Email, usuario.Perfil));
    }

    private AuthRespostaDto Resposta(Usuario u) => new(_tokens.Gerar(u), u.Nome, u.Email, u.Perfil);

    private BadRequestObjectResult Erro(string mensagem) => BadRequest(new { mensagem });

    private static bool EmailValido(string email) =>
        MailAddress.TryCreate(email, out var endereco) &&
        endereco.Address == email &&
        endereco.Host.Contains('.');
}
