"use client"

import { ArrowUpDown, Boxes, Pencil, Plus, Search, TriangleAlert } from "lucide-react"
import { useMemo, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import type { Produto } from "@/lib/types"
import { useInventory } from "./inventory-provider"
import { ProductModal } from "./product-modal"
import { StockMovementModal } from "./stock-movement-modal"

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function estoqueBaixo(p: Produto) {
  return p.quantidade <= p.estoqueMinimo
}

function EstoqueTag({ produto }: { produto: Produto }) {
  const baixo = estoqueBaixo(produto)
  return (
    <div className="flex items-center gap-2">
      <span className={`tabular-nums font-medium ${baixo ? "text-red-600" : ""}`}>{produto.quantidade}</span>
      {baixo ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          <TriangleAlert className="size-3" />
          Baixo
        </span>
      ) : null}
    </div>
  )
}

export function ProductsTable() {
  const { produtos } = useInventory()
  const { usuario } = useAuth()
  // Encarregado movimenta estoque, mas não cadastra nem edita produtos.
  const podeEditar = usuario.perfil === "supervisor"
  const [busca, setBusca] = useState("")
  const [modalProduto, setModalProduto] = useState(false)
  const [modalMovimento, setModalMovimento] = useState(false)
  const [selecionado, setSelecionado] = useState<Produto | null>(null)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return produtos
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.sku.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo),
    )
  }, [produtos, busca])

  function abrirNovo() {
    setSelecionado(null)
    setModalProduto(true)
  }

  function abrirEdicao(p: Produto) {
    setSelecionado(p)
    setModalProduto(true)
  }

  function abrirMovimento(p: Produto) {
    setSelecionado(p)
    setModalMovimento(true)
  }

  return (
    <section aria-label="Controle de estoque" className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Boxes className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Controle de estoque</h2>
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Buscar produtos"
            />
          </div>
          {podeEditar ? (
            <Button onClick={abrirNovo}>
              <Plus />
              Adicionar
            </Button>
          ) : null}
        </div>
      </header>

      {/* Tabela desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Localização</th>
              <th className="px-5 py-3 font-medium">Estoque</th>
              <th className="px-5 py-3 font-medium">Mínimo</th>
              <th className="px-5 py-3 font-medium">Preço</th>
              <th className="px-5 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-5 py-3">
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{p.categoria}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.localizacao}</td>
                <td className="px-5 py-3">
                  <EstoqueTag produto={p} />
                </td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">{p.estoqueMinimo}</td>
                <td className="px-5 py-3 tabular-nums">{moeda.format(p.preco)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => abrirMovimento(p)}>
                      <ArrowUpDown />
                      Movimentar
                    </Button>
                    {podeEditar ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => abrirEdicao(p)}
                        aria-label={`Editar ${p.nome}`}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile/tablet */}
      <ul className="divide-y divide-border lg:hidden">
        {filtrados.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {p.sku} · {p.categoria}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">{moeda.format(p.preco)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Estoque:</span>
                <EstoqueTag produto={p} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Mínimo:</span>
                <span className="tabular-nums">{p.estoqueMinimo}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{p.localizacao}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => abrirMovimento(p)}>
                <ArrowUpDown />
                Movimentar
              </Button>
              {podeEditar ? (
                <Button size="sm" variant="outline" onClick={() => abrirEdicao(p)}>
                  <Pencil />
                  Editar
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {filtrados.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      ) : null}

      <ProductModal open={modalProduto} onClose={() => setModalProduto(false)} produto={selecionado} />
      <StockMovementModal open={modalMovimento} onClose={() => setModalMovimento(false)} produto={selecionado} />
    </section>
  )
}
