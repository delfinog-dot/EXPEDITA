using Estoque.Api.Data;
using Estoque.Api.Dtos;
using Estoque.Api.Hubs;
using Estoque.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Estoque.Api.Controllers;

// Qualquer usuário logado (supervisor ou encarregado) pode usar o chat.
[Authorize]
[ApiController]
[Route("api/carregamentos/{carregamentoId:guid}/mensagens")]
[Produces("application/json")]
public class ChatController : ControllerBase
{
    private readonly EstoqueDbContext _db;
    private readonly IHubContext<ChatHub> _hub;

    public ChatController(EstoqueDbContext db, IHubContext<ChatHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // GET: histórico de mensagens do pedido.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MensagemChat>>> Historico(Guid carregamentoId)
    {
        if (!await _db.Carregamentos.AnyAsync(c => c.Id == carregamentoId))
            return NotFound();

        var mensagens = await _db.MensagensChat
            .Where(m => m.CarregamentoId == carregamentoId)
            .OrderBy(m => m.EnviadoEm)
            .ToListAsync();

        return Ok(mensagens);
    }

    // POST: envia via REST e propaga em tempo real pelo Hub (fallback ao WebSocket).
    [HttpPost]
    public async Task<ActionResult<MensagemChat>> Enviar(Guid carregamentoId, MensagemInputDto dto)
    {
        if (!await _db.Carregamentos.AnyAsync(c => c.Id == carregamentoId))
            return NotFound();

        var mensagem = new MensagemChat
        {
            CarregamentoId = carregamentoId,
            // Autor e nome vêm do token, não do que o cliente enviou.
            Autor = User.FindFirst("role")?.Value ?? Perfis.Supervisor,
            AutorNome = User.FindFirst("name")?.Value ?? string.Empty,
            Texto = dto.Texto.Trim(),
            EnviadoEm = DateTime.UtcNow
        };

        _db.MensagensChat.Add(mensagem);
        await _db.SaveChangesAsync();

        await _hub.Clients.Group($"pedido-{carregamentoId}").SendAsync("ReceberMensagem", mensagem);

        return CreatedAtAction(nameof(Historico), new { carregamentoId }, mensagem);
    }
}
