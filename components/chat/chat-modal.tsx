"use client"

import { Send } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { PAPEL_LABEL, type Carregamento } from "@/lib/types"
import { useChat } from "./chat-provider"

interface ChatModalProps {
  open: boolean
  onClose: () => void
  carregamento: Carregamento | null
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function ChatModal({ open, onClose, carregamento }: ChatModalProps) {
  const { mensagensDoPedido, enviarMensagem } = useChat()
  const { usuario } = useAuth()
  // Quem escreve é sempre o usuário logado.
  const papel = usuario.perfil
  const [texto, setTexto] = useState("")
  const listaRef = useRef<HTMLDivElement>(null)

  const mensagens = carregamento ? mensagensDoPedido(carregamento.id) : []

  // Rola para a última mensagem sempre que a lista muda ou o chat abre.
  useEffect(() => {
    if (!open) return
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight })
  }, [open, mensagens.length])

  if (!carregamento) return null

  function onSubmit(evento: FormEvent) {
    evento.preventDefault()
    if (!carregamento) return
    const conteudo = texto.trim()
    if (!conteudo) return
    enviarMensagem(carregamento.id, papel, usuario.nome, conteudo)
    setTexto("")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chat do carregamento"
      description={`${carregamento.codigo} · ${carregamento.cliente}`}
    >
      <div className="flex flex-col gap-4">
        {/* Histórico de mensagens */}
        <div
          ref={listaRef}
          className="flex max-h-72 min-h-40 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3"
        >
          {mensagens.length === 0 ? (
            <p className="m-auto text-sm text-muted-foreground">Nenhuma mensagem ainda. Inicie a conversa.</p>
          ) : (
            mensagens.map((m) => {
              const meu = m.autor === papel
              return (
                <div key={m.id} className={`flex flex-col ${meu ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.autor === "supervisor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground ring-1 ring-inset ring-border"
                    }`}
                  >
                    {m.texto}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                    {m.autorNome} · {formatarHora(m.enviadoEm)}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Campo de envio */}
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">Mensagem</span>
            <textarea
              rows={2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  onSubmit(e)
                }
              }}
              placeholder={`Mensagem como ${PAPEL_LABEL[papel]}...`}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={!texto.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Modal>
  )
}
