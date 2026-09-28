"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { PapelUsuario } from "@/lib/types"

export interface MensagemChat {
  id: string
  carregamentoId: string
  autor: PapelUsuario
  autorNome: string
  texto: string
  enviadoEm: string
}

interface ChatContextValue {
  /** Mensagens agrupadas por ID do carregamento (pedido). */
  mensagensPorPedido: Record<string, MensagemChat[]>
  mensagensDoPedido: (carregamentoId: string) => MensagemChat[]
  totalPorPedido: (carregamentoId: string) => number
  enviarMensagem: (carregamentoId: string, autor: PapelUsuario, autorNome: string, texto: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

const mensagensIniciais: Record<string, MensagemChat[]> = {
  c1: [
    {
      id: "m1",
      carregamentoId: "c1",
      autor: "supervisor",
      autorNome: "Ana (Supervisão)",
      texto: "Este carregamento passou da previsão. Consegue priorizar a separação?",
      enviadoEm: "2026-09-23T09:05:00Z",
    },
    {
      id: "m2",
      carregamentoId: "c1",
      autor: "encarregado",
      autorNome: "Bruno (Expedição)",
      texto: "Estou finalizando outro pedido e já começo esse. Falta conferir 2 itens.",
      enviadoEm: "2026-09-23T09:08:00Z",
    },
  ],
}

function gerarId() {
  return `m-${Math.random().toString(36).slice(2, 10)}`
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [mensagensPorPedido, setMensagensPorPedido] = useState<Record<string, MensagemChat[]>>(mensagensIniciais)

  const enviarMensagem = useCallback((carregamentoId: string, autor: PapelUsuario, autorNome: string, texto: string) => {
    const conteudo = texto.trim()
    if (!conteudo) return
    const mensagem: MensagemChat = {
      id: gerarId(),
      carregamentoId,
      autor,
      autorNome,
      texto: conteudo,
      enviadoEm: new Date().toISOString(),
    }
    setMensagensPorPedido((atual) => ({
      ...atual,
      [carregamentoId]: [...(atual[carregamentoId] ?? []), mensagem],
    }))
  }, [])

  const mensagensDoPedido = useCallback(
    (carregamentoId: string) => mensagensPorPedido[carregamentoId] ?? [],
    [mensagensPorPedido],
  )

  const totalPorPedido = useCallback(
    (carregamentoId: string) => (mensagensPorPedido[carregamentoId] ?? []).length,
    [mensagensPorPedido],
  )

  const value = useMemo<ChatContextValue>(
    () => ({ mensagensPorPedido, mensagensDoPedido, totalPorPedido, enviarMensagem }),
    [mensagensPorPedido, mensagensDoPedido, totalPorPedido, enviarMensagem],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat deve ser usado dentro de ChatProvider")
  return ctx
}
