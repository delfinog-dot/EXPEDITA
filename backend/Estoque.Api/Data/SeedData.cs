using Estoque.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace Estoque.Api.Data;

public static class SeedData
{
    public static void Popular(EstoqueDbContext db)
    {
        PopularUsuarios(db);

        if (db.Produtos.Any() || db.Carregamentos.Any()) return;

        db.Produtos.AddRange(
            new Produto { Sku = "ELE-0001", Nome = "Cabo HDMI 2.1 - 2m", Categoria = "Eletrônicos", Quantidade = 120, EstoqueMinimo = 40, Preco = 39.90m, Localizacao = "Corredor A / Prateleira 3" },
            new Produto { Sku = "ELE-0002", Nome = "Fonte 65W USB-C", Categoria = "Eletrônicos", Quantidade = 18, EstoqueMinimo = 25, Preco = 149.90m, Localizacao = "Corredor A / Prateleira 5" },
            new Produto { Sku = "EMB-0007", Nome = "Caixa de papelão 40x40", Categoria = "Embalagens", Quantidade = 500, EstoqueMinimo = 150, Preco = 4.50m, Localizacao = "Corredor C / Piso" },
            new Produto { Sku = "FER-0033", Nome = "Fita adesiva industrial", Categoria = "Ferramentas", Quantidade = 12, EstoqueMinimo = 20, Preco = 12.75m, Localizacao = "Corredor B / Prateleira 1" }
        );

        db.Carregamentos.AddRange(
            // Pendente com previsão já vencida -> deve ser sinalizado como atrasado.
            new Carregamento { Codigo = "CRG-1001", Cliente = "Mercado Central", Transportadora = "TransLog", QuantidadeItens = 42, Status = StatusCarregamento.Pendente, DataHoraPrevista = DateTime.UtcNow.AddHours(-3) },
            new Carregamento { Codigo = "CRG-1002", Cliente = "Loja do Bairro", Transportadora = "Rápido Sul", QuantidadeItens = 15, Status = StatusCarregamento.EmAndamento, DataHoraPrevista = DateTime.UtcNow.AddHours(6) },
            new Carregamento { Codigo = "CRG-1003", Cliente = "Atacadão Norte", Transportadora = "TransLog", QuantidadeItens = 88, Status = StatusCarregamento.Expedido, DataHoraPrevista = DateTime.UtcNow.AddDays(-1) }
        );

        db.SaveChanges();
    }

    // Usuários de teste (um de cada perfil). Troque as senhas antes de usar de verdade.
    private static void PopularUsuarios(EstoqueDbContext db)
    {
        if (db.Usuarios.Any()) return;

        var hasher = new PasswordHasher<Usuario>();
        var usuarios = new[]
        {
            (Nome: "Supervisor Teste", Email: "supervisor@expedita.com", Senha: "supervisor123", Perfil: Perfis.Supervisor),
            (Nome: "Encarregado Teste", Email: "encarregado@expedita.com", Senha: "encarregado123", Perfil: Perfis.Encarregado),
        };

        foreach (var u in usuarios)
        {
            var usuario = new Usuario { Nome = u.Nome, Email = u.Email, Perfil = u.Perfil };
            usuario.SenhaHash = hasher.HashPassword(usuario, u.Senha);
            db.Usuarios.Add(usuario);
        }

        db.SaveChanges();
    }
}
