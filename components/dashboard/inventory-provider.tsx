"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { carregamentosIniciais, produtosIniciais } from "@/lib/mock-data"
import {
  STATUS_ORDER,
  type Carregamento,
  type Produto,
  type StatusCarregamento,
  type TipoMovimentacao,
} from "@/lib/types"

export type ProdutoInput = Omit<Produto, "id" | "atualizadoEm">

export type NovoCarregamentoInput = Pick<Carregamento, "cliente" | "transportadora" | "quantidadeItens" | "dataHoraPrevista">

interface InventoryContextValue {
  produtos: Produto[]
  carregamentos: Carregamento[]
  adicionarCarregamento: (input: NovoCarregamentoInput) => void
  criarProduto: (input: ProdutoInput) => void
  atualizarProduto: (id: string, input: ProdutoInput) => void
  removerProduto: (id: string) => void
  registrarMovimentacao: (id: string, tipo: TipoMovimentacao, quantidade: number) => void
  avancarStatus: (id: string) => void
  retrocederStatus: (id: string) => void
  definirStatus: (id: string, status: StatusCarregamento) => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

function gerarId(prefixo: string) {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}`
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [carregamentos, setCarregamentos] = useState<Carregamento[]>(carregamentosIniciais)

  const criarProduto = useCallback((input: ProdutoInput) => {
    setProdutos((atual) => [
      {
        ...input,
        id: gerarId("p"),
        atualizadoEm: new Date().toISOString(),
      },
      ...atual,
    ])
  }, [])

  const atualizarProduto = useCallback((id: string, input: ProdutoInput) => {
    setProdutos((atual) =>
      atual.map((p) => (p.id === id ? { ...p, ...input, atualizadoEm: new Date().toISOString() } : p)),
    )
  }, [])

  const removerProduto = useCallback((id: string) => {
    setProdutos((atual) => atual.filter((p) => p.id !== id))
  }, [])

  const registrarMovimentacao = useCallback((id: string, tipo: TipoMovimentacao, quantidade: number) => {
    if (!Number.isFinite(quantidade) || quantidade <= 0) return
    setProdutos((atual) =>
      atual.map((p) => {
        if (p.id !== id) return p
        const delta = tipo === "entrada" ? quantidade : -quantidade
        const novaQuantidade = Math.max(0, p.quantidade + delta)
        return { ...p, quantidade: novaQuantidade, atualizadoEm: new Date().toISOString() }
      }),
    )
  }, [])

  const adicionarCarregamento = useCallback((input: NovoCarregamentoInput) => {
    setCarregamentos((atual) => [
      {
        ...input,
        id: gerarId("c"),
        codigo: `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        status: "pendente",
        atualizadoEm: new Date().toISOString(),
      },
      ...atual,
    ])
  }, [])

  const moverStatus = useCallback((id: string, direcao: 1 | -1) => {
    setCarregamentos((atual) =>
      atual.map((c) => {
        if (c.id !== id) return c
        const indice = STATUS_ORDER.indexOf(c.status)
        const proximo = STATUS_ORDER[indice + direcao]
        if (!proximo) return c
        return { ...c, status: proximo, atualizadoEm: new Date().toISOString() }
      }),
    )
  }, [])

  const avancarStatus = useCallback((id: string) => moverStatus(id, 1), [moverStatus])
  const retrocederStatus = useCallback((id: string) => moverStatus(id, -1), [moverStatus])

  const definirStatus = useCallback((id: string, status: StatusCarregamento) => {
    setCarregamentos((atual) =>
      atual.map((c) => (c.id === id ? { ...c, status, atualizadoEm: new Date().toISOString() } : c)),
    )
  }, [])

  const value = useMemo<InventoryContextValue>(
    () => ({
      produtos,
      carregamentos,
      adicionarCarregamento,
      criarProduto,
      atualizarProduto,
      removerProduto,
      registrarMovimentacao,
      avancarStatus,
      retrocederStatus,
      definirStatus,
    }),
    [
      produtos,
      carregamentos,
      adicionarCarregamento,
      criarProduto,
      atualizarProduto,
      removerProduto,
      registrarMovimentacao,
      avancarStatus,
      retrocederStatus,
      definirStatus,
    ],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error("useInventory deve ser usado dentro de InventoryProvider")
  return ctx
}
