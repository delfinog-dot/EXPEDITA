"use client"

import { AlertTriangle, MessageCircle, Truck, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { estaAtrasado, horasDeAtraso } from "@/lib/expedition-status"
import { STATUS_LABEL, type Carregamento } from "@/lib/types"
import { useAuth } from "@/components/auth/auth-provider"
import { ChatModal } from "@/components/chat/chat-modal"
import { useChat } from "@/components/chat/chat-provider"
import { DelayBadge } from "./delay-badge"
import { useInventory } from "./inventory-provider"
import { StatusBadge } from "./status-badge"

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function AcoesStatus({
  carregamento,
  onAbrirChat,
}: {
  carregamento: Carregamento
  onAbrirChat: (c: Carregamento) => void
}) {
  const { avancarStatus, retrocederStatus } = useInventory()
  const { totalPorPedido } = useChat()
  const { id, status } = carregamento
  const totalMensagens = totalPorPedido(id)

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAbrirChat(carregamento)}
        aria-label={`Abrir chat do carregamento ${carregamento.codigo}`}
      >
        <MessageCircle className="size-4" />
        Chat
        {totalMensagens > 0 ? (
          <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
            {totalMensagens}
          </span>
        ) : null}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => retrocederStatus(id)}
        disabled={status === "pendente"}
        aria-label={`Retroceder status do carregamento ${carregamento.codigo}`}
      >
        Voltar
      </Button>
      <Button
        size="sm"
        onClick={() => avancarStatus(id)}
        disabled={status === "expedido"}
        aria-label={`Avançar status do carregamento ${carregamento.codigo}`}
      >
        {status === "pendente" ? "Iniciar" : "Expedir"}
      </Button>
    </div>
  )
}

export function ExpeditionTable() {
  const { carregamentos, adicionarCarregamento } = useInventory()
  const { usuario } = useAuth()
  // Encarregado não cria expedições (só acompanha, muda status e usa o chat).
  const podeCriar = usuario.perfil === "supervisor"
  const [chatDe, setChatDe] = useState<Carregamento | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  // Formulário para Nova Expedição
  const [novoCliente, setNovoCliente] = useState("")
  const [novaTransportadora, setNovaTransportadora] = useState("")
  const [novosItens, setNovosItens] = useState(1)
  const [novaDataPrevista, setNovaDataPrevista] = useState("")

  // Calcula o "agora" apenas no cliente para evitar divergência de hidratação,
  // e reavalia periodicamente para que o alerta de atraso fique atualizado.
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    setAgora(new Date())
    const intervalo = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(intervalo)
  }, [])

  const atrasados = agora ? carregamentos.filter((c) => estaAtrasado(c, agora)) : []

  // Função para criar nova expedição
  const handleCriarExpedicao = (e: React.FormEvent) => {
    e.preventDefault()

    if (!novoCliente || !novaTransportadora) return

    // Se no seu 'useInventory' houver uma função dedicada como adicionarCarregamento
    if (adicionarCarregamento) {
      adicionarCarregamento({
        cliente: novoCliente,
        transportadora: novaTransportadora,
        quantidadeItens: Number(novosItens),
        dataHoraPrevista: novaDataPrevista ? new Date(novaDataPrevista).toISOString() : new Date().toISOString(),
      })
    }

    // Reseta o formulário e fecha o modal
    setNovoCliente("")
    setNovaTransportadora("")
    setNovosItens(1)
    setNovaDataPrevista("")
    setModalAberto(false)
  }

  return (
    <section aria-label="Controle de expedição" className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Controle de expedição</h2>
        </div>

        {/* Lado direito do cabeçalho: Contador + Botão "Nova Expedição" */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">{carregamentos.length} carregamentos</span>
          {podeCriar ? (
            <Button size="sm" onClick={() => setModalAberto(true)}>
              <Plus className="mr-1 size-4" />
              Nova Expedição
            </Button>
          ) : null}
        </div>
      </header>

      {atrasados.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <p>
            <span className="font-semibold">
              {atrasados.length} {atrasados.length === 1 ? "carregamento atrasado" : "carregamentos atrasados"}
            </span>{" "}
            — não iniciados até o horário previsto:{" "}
            {atrasados.map((c) => c.codigo).join(", ")}.
          </p>
        </div>
      ) : null}

      {/* Tabela em telas médias/grandes */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Código</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Transportadora</th>
              <th className="px-5 py-3 font-medium">Itens</th>
              <th className="px-5 py-3 font-medium">Previsão</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregamentos.map((c) => {
              const atrasado = agora ? estaAtrasado(c, agora) : false
              return (
                <tr
                  key={c.id}
                  className={
                    atrasado
                      ? "border-b border-red-200 bg-red-50/70 hover:bg-red-50"
                      : "border-b border-border/60 last:border-0 hover:bg-muted/40"
                  }
                >
                  <td className="px-5 py-3 font-medium">{c.codigo}</td>
                  <td className="px-5 py-3">{c.cliente}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.transportadora}</td>
                  <td className="px-5 py-3 tabular-nums">{c.quantidadeItens}</td>
                  <td
                    className={`px-5 py-3 tabular-nums ${atrasado ? "font-medium text-red-700" : "text-muted-foreground"}`}
                  >
                    {formatarDataHora(c.dataHoraPrevista)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={c.status} />
                      {atrasado ? <DelayBadge horas={horasDeAtraso(c, agora!)} /> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <AcoesStatus carregamento={c} onAbrirChat={setChatDe} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards em telas pequenas */}
      <ul className="divide-y divide-border md:hidden">
        {carregamentos.map((c) => {
          const atrasado = agora ? estaAtrasado(c, agora) : false
          return (
            <li key={c.id} className={`flex flex-col gap-3 p-4 ${atrasado ? "bg-red-50/70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{c.codigo}</p>
                  <p className="text-sm text-muted-foreground">{c.cliente}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={c.status} />
                  {atrasado ? <DelayBadge horas={horasDeAtraso(c, agora!)} /> : null}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Transportadora</dt>
                  <dd>{c.transportadora}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Itens</dt>
                  <dd className="tabular-nums">{c.quantidadeItens}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Previsão</dt>
                  <dd className={`tabular-nums ${atrasado ? "font-medium text-red-700" : ""}`}>
                    {formatarDataHora(c.dataHoraPrevista)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Situação</dt>
                  <dd>{STATUS_LABEL[c.status]}</dd>
                </div>
              </dl>
              <AcoesStatus carregamento={c} onAbrirChat={setChatDe} />
            </li>
          )
        })}
      </ul>

      {/* Modal / Dialog para Nova Expedição */}
      {podeCriar && modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Nova Expedição</h3>
            <form onSubmit={handleCriarExpedicao} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                <input
                  type="text"
                  required
                  value={novoCliente}
                  onChange={(e) => setNovoCliente(e.target.value)}
                  placeholder="Nome do cliente"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Transportadora</label>
                <input
                  type="text"
                  required
                  value={novaTransportadora}
                  onChange={(e) => setNovaTransportadora(e.target.value)}
                  placeholder="Nome da transportadora"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Qtd. Itens</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={novosItens}
                    onChange={(e) => setNovosItens(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Previsão</label>
                  <input
                    type="datetime-local"
                    required
                    value={novaDataPrevista}
                    onChange={(e) => setNovaDataPrevista(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChatModal open={chatDe !== null} onClose={() => setChatDe(null)} carregamento={chatDe} />
    </section>
  )
}