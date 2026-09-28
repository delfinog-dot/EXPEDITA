using Estoque.Api.Data;
using Estoque.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Estoque.Api.Hubs;

// Hub de comunicação em tempo real entre Supervisor e Encarregado,
// com as conversas isoladas por pedido (carregamento) através de grupos.
// Exige login: o cliente conecta em /hubs/chat?access_token=<token>.
[Authorize]
public class ChatHub : Hub
{
    private readonly EstoqueDbContext _db;

    public ChatHub(EstoqueDbContext db) => _db = db;

    private static string Grupo(Guid carregamentoId) => $"pedido-{carregamentoId}";

    // Cliente entra na sala de um pedido específico.
    public Task EntrarNoPedido(Guid carregamentoId)
        => Groups.AddToGroupAsync(Context.ConnectionId, Grupo(carregamentoId));

    // Cliente sai da sala do pedido.
    public Task SairDoPedido(Guid carregamentoId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, Grupo(carregamentoId));

    // Persiste a mensagem e a propaga para todos na sala do pedido.
    // "autor" e "autorNome" são mantidos na assinatura por compatibilidade,
    // mas o valor gravado vem sempre do usuário logado.
    public async Task EnviarMensagem(Guid carregamentoId, string autor, string autorNome, string texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return;

        var existe = await _db.Carregamentos.FindAsync(carregamentoId);
        if (existe is null) return;

        var mensagem = new MensagemChat
        {
            CarregamentoId = carregamentoId,
            Autor = Context.User?.FindFirst("role")?.Value ?? Perfis.Supervisor,
            AutorNome = Context.User?.FindFirst("name")?.Value ?? string.Empty,
            Texto = texto.Trim(),
            EnviadoEm = DateTime.UtcNow
        };

        _db.MensagensChat.Add(mensagem);
        await _db.SaveChangesAsync();

        // Evento consumido pelos clientes: connection.on("ReceberMensagem", ...)
        await Clients.Group(Grupo(carregamentoId)).SendAsync("ReceberMensagem", mensagem);
    }
}
