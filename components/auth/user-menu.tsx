"use client"

import { PAPEL_LABEL } from "@/lib/types"
import { useAuth } from "./auth-provider"

/** Lado direito do header: nome e perfil do usuário + botão Sair (mesmo visual de antes). */
export function UserMenu() {
  const { usuario, sair } = useAuth()

  return (
    <div className="logout flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {usuario.nome} · {PAPEL_LABEL[usuario.perfil]}
      </span>
      <button
        type="button"
        onClick={sair}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
      >
        Sair
      </button>
    </div>
  )
}
