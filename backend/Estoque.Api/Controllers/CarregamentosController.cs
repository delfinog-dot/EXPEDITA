using Estoque.Api.Data;
using Estoque.Api.Dtos;
using Estoque.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Estoque.Api.Controllers;

// Leitura e operações do dia a dia: qualquer usuário logado.
// Criar, editar e excluir: só supervisor.
[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CarregamentosController : ControllerBase
{
    private readonly EstoqueDbContext _db;

    public CarregamentosController(EstoqueDbContext db) => _db = db;

    // GET: api/carregamentos?status=Pendente
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Carregamento>>> Listar([FromQuery] StatusCarregamento? status)
    {
        var query = _db.Carregamentos.AsQueryable();
        if (status.HasValue) query = query.Where(c => c.Status == status.Value);

        var itens = await query.OrderBy(c => c.DataHoraPrevista).ToListAsync();
        return Ok(itens);
    }

    // GET: api/carregamentos/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Carregamento>> Obter(Guid id)
    {
        var item = await _db.Carregamentos.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    // POST: api/carregamentos
    [HttpPost]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<ActionResult<Carregamento>> Criar(CarregamentoInputDto dto)
    {
        if (await _db.Carregamentos.AnyAsync(c => c.Codigo == dto.Codigo))
            return Conflict(new { mensagem = $"Já existe um carregamento com o código '{dto.Codigo}'." });

        var carregamento = new Carregamento
        {
            Codigo = dto.Codigo.Trim(),
            Cliente = dto.Cliente.Trim(),
            Transportadora = dto.Transportadora.Trim(),
            QuantidadeItens = dto.QuantidadeItens,
            DataHoraPrevista = dto.DataHoraPrevista,
            Status = StatusCarregamento.Pendente,
            CriadoEm = DateTime.UtcNow
        };

        _db.Carregamentos.Add(carregamento);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obter), new { id = carregamento.Id }, carregamento);
    }

    // PUT: api/carregamentos/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<ActionResult<Carregamento>> Atualizar(Guid id, CarregamentoInputDto dto)
    {
        var carregamento = await _db.Carregamentos.FindAsync(id);
        if (carregamento is null) return NotFound();

        if (carregamento.Codigo != dto.Codigo && await _db.Carregamentos.AnyAsync(c => c.Codigo == dto.Codigo))
            return Conflict(new { mensagem = $"Já existe um carregamento com o código '{dto.Codigo}'." });

        carregamento.Codigo = dto.Codigo.Trim();
        carregamento.Cliente = dto.Cliente.Trim();
        carregamento.Transportadora = dto.Transportadora.Trim();
        carregamento.QuantidadeItens = dto.QuantidadeItens;
        carregamento.DataHoraPrevista = dto.DataHoraPrevista;

        await _db.SaveChangesAsync();
        return Ok(carregamento);
    }

    // PATCH: api/carregamentos/{id}/status  -> altera o status do carregamento
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<Carregamento>> AtualizarStatus(Guid id, StatusUpdateDto dto)
    {
        var carregamento = await _db.Carregamentos.FindAsync(id);
        if (carregamento is null) return NotFound();

        carregamento.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(carregamento);
    }

    // DELETE: api/carregamentos/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<IActionResult> Remover(Guid id)
    {
        var carregamento = await _db.Carregamentos.FindAsync(id);
        if (carregamento is null) return NotFound();

        _db.Carregamentos.Remove(carregamento);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
