namespace Estoque.Api.Models;

// Usuário do painel. O perfil define o que ele pode fazer (supervisor ou encarregado).
public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Nome { get; set; } = string.Empty;

    // Sempre salvo em minúsculas.
    public string Email { get; set; } = string.Empty;

    public string SenhaHash { get; set; } = string.Empty;

    // "supervisor" ou "encarregado" (ver Perfis).
    public string Perfil { get; set; } = string.Empty;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

// Perfis aceitos pelo sistema. Os valores são usados no claim "role" do token.
public static class Perfis
{
    public const string Supervisor = "supervisor";
    public const string Encarregado = "encarregado";

    public static readonly string[] Todos = [Supervisor, Encarregado];
}
