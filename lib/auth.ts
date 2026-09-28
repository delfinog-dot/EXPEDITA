import type { PapelUsuario, Sessao } from "./types"

/** Endereço do back-end .NET. Configure em .env.local (NEXT_PUBLIC_API_URL). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

/** A sessão fica no localStorage do navegador, nesta chave. */
const CHAVE = "expedita_auth"

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function getSessao(): Sessao | null {
  if (typeof window === "undefined") return null
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const s = JSON.parse(bruto) as Partial<Sessao>
    if (!s.token || !s.nome || !s.email) return null
    if (s.perfil !== "supervisor" && s.perfil !== "encarregado") return null
    return s as Sessao
  } catch {
    return null
  }
}

function salvarSessao(sessao: Sessao) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // Navegador sem acesso ao localStorage (modo privado restrito): segue sem persistir.
  }
}

export function sair() {
  try {
    window.localStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
}

async function enviar(caminho: string, corpo: unknown): Promise<Sessao> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${caminho}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })
  } catch {
    throw new Error("Não foi possível conectar ao servidor.")
  }

  const dados = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(dados?.mensagem ?? "Não foi possível concluir. Tente novamente.")
  }

  const sessao: Sessao = { token: dados.token, nome: dados.nome, email: dados.email, perfil: dados.perfil }
  salvarSessao(sessao)
  return sessao
}

export function login(email: string, senha: string) {
  return enviar("/api/auth/login", { email, senha })
}

export function cadastrar(nome: string, email: string, perfil: PapelUsuario, senha: string) {
  return enviar("/api/auth/register", { nome, email, perfil, senha })
}

/**
 * fetch para o back-end já com o token. Se a API responder 401 (token inválido ou expirado),
 * encerra a sessão e volta para o login. Use nas próximas integrações do dashboard com a API.
 */
export async function authFetch(caminho: string, init: RequestInit = {}) {
  const sessao = getSessao()
  const headers = new Headers(init.headers)
  if (sessao) headers.set("Authorization", `Bearer ${sessao.token}`)

  const res = await fetch(`${API_URL}${caminho}`, { ...init, headers })
  if (res.status === 401) {
    sair()
    window.location.href = "/login"
  }
  return res
}
