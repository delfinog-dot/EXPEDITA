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
public class ProdutosController : ControllerBase
{
    private readonly EstoqueDbContext _db;

    public ProdutosController(EstoqueDbContext db) => _db = db;

    // GET: api/produtos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Produto>>> Listar([FromQuery] string? busca, [FromQuery] bool? estoqueBaixo)
    {
        var query = _db.Produtos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();
            query = query.Where(p =>
                p.Nome.ToLower().Contains(termo) ||
                p.Sku.ToLower().Contains(termo) ||
                p.Categoria.ToLower().Contains(termo));
        }

        var produtos = await query.OrderBy(p => p.Nome).ToListAsync();

        if (estoqueBaixo == true)
            produtos = produtos.Where(p => p.EstoqueBaixo).ToList();

        return Ok(produtos);
    }

    // GET: api/produtos/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Produto>> Obter(Guid id)
    {
        var produto = await _db.Produtos.FindAsync(id);
        return produto is null ? NotFound() : Ok(produto);
    }

    // POST: api/produtos
    [HttpPost]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<ActionResult<Produto>> Criar(ProdutoInputDto dto)
    {
        if (await _db.Produtos.AnyAsync(p => p.Sku == dto.Sku))
            return Conflict(new { mensagem = $"Já existe um produto com o SKU '{dto.Sku}'." });

        var produto = new Produto
        {
            Sku = dto.Sku.Trim(),
            Nome = dto.Nome.Trim(),
            Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? "Geral" : dto.Categoria.Trim(),
            Quantidade = dto.Quantidade,
            EstoqueMinimo = dto.EstoqueMinimo,
            Preco = dto.Preco,
            Localizacao = string.IsNullOrWhiteSpace(dto.Localizacao) ? "Não definida" : dto.Localizacao.Trim(),
            AtualizadoEm = DateTime.UtcNow
        };

        _db.Produtos.Add(produto);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Obter), new { id = produto.Id }, produto);
    }

    // PUT: api/produtos/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<ActionResult<Produto>> Atualizar(Guid id, ProdutoInputDto dto)
    {
        var produto = await _db.Produtos.FindAsync(id);
        if (produto is null) return NotFound();

        if (produto.Sku != dto.Sku && await _db.Produtos.AnyAsync(p => p.Sku == dto.Sku))
            return Conflict(new { mensagem = $"Já existe um produto com o SKU '{dto.Sku}'." });

        produto.Sku = dto.Sku.Trim();
        produto.Nome = dto.Nome.Trim();
        produto.Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? "Geral" : dto.Categoria.Trim();
        produto.Quantidade = dto.Quantidade;
        produto.EstoqueMinimo = dto.EstoqueMinimo;
        produto.Preco = dto.Preco;
        produto.Localizacao = string.IsNullOrWhiteSpace(dto.Localizacao) ? "Não definida" : dto.Localizacao.Trim();
        produto.AtualizadoEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(produto);
    }

    // PATCH: api/produtos/{id}/movimentacao  -> registra entrada/saída
    [HttpPatch("{id:guid}/movimentacao")]
    public async Task<ActionResult<Produto>> Movimentar(Guid id, MovimentacaoDto dto)
    {
        var produto = await _db.Produtos.FindAsync(id);
        if (produto is null) return NotFound();

        if (dto.Tipo == TipoMovimentacao.Saida && dto.Quantidade > produto.Quantidade)
            return BadRequest(new { mensagem = "Saída maior que o estoque disponível." });

        produto.Quantidade += dto.Tipo == TipoMovimentacao.Entrada ? dto.Quantidade : -dto.Quantidade;
        produto.AtualizadoEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(produto);
    }

    // DELETE: api/produtos/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Perfis.Supervisor)]
    public async Task<IActionResult> Remover(Guid id)
    {
        var produto = await _db.Produtos.FindAsync(id);
        if (produto is null) return NotFound();

        _db.Produtos.Remove(produto);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
