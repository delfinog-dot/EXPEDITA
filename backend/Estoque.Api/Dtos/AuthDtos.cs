namespace Estoque.Api.Dtos;

// Campos anuláveis de propósito: a validação é feita no AuthController
// para devolver sempre { "mensagem": "..." } em português.
public record CadastroDto(string? Nome, string? Email, string? Perfil, string? Senha);

public record LoginDto(string? Email, string? Senha);

public record AuthRespostaDto(string Token, string Nome, string Email, string Perfil);

public record UsuarioDto(string Nome, string Email, string Perfil);
