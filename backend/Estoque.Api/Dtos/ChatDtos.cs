using System.ComponentModel.DataAnnotations;

namespace Estoque.Api.Dtos;

// Payload de envio de mensagem no chat de um pedido.
// Autor e AutorNome são ignorados: a API usa o perfil e o nome do usuário logado.
public class MensagemInputDto
{
    [StringLength(30)]
    public string? Autor { get; set; } // supervisor | encarregado

    [StringLength(80)]
    public string? AutorNome { get; set; }

    [Required, StringLength(1000, MinimumLength = 1)]
    public string Texto { get; set; } = string.Empty;
}
