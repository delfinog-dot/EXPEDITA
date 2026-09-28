"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { authFetch, getSessao, sair as encerrarSessao } from "@/lib/auth"
import type { Sessao } from "@/lib/types"

interface AuthContextValue {
  usuario: Sessao
  sair: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Protege a página: sem sessão, redireciona para /login. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Sessao | null>(null)

  useEffect(() => {
    const sessao = getSessao()
    if (!sessao) {
      router.replace("/login")
      return
    }
    setUsuario(sessao)
    // Confere no back-end se o token ainda vale. Em 401 o authFetch já leva ao login;
    // se o servidor estiver fora do ar, mantém a sessão local.
    authFetch("/api/auth/me").catch(() => {})
  }, [router])

  const sair = useCallback(() => {
    encerrarSessao()
    router.replace("/login")
  }, [router])

  const value = useMemo<AuthContextValue | null>(() => (usuario ? { usuario, sair } : null), [usuario, sair])

  // Enquanto verifica a sessão não renderiza nada (evita piscar o dashboard).
  if (!value) return null

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
