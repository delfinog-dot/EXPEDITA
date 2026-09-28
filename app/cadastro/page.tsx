"use client"

import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { AuthAlert, AuthShell, FieldError, PasswordInput, inputClass } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { cadastrar, emailValido, getSessao } from "@/lib/auth"
import { PAPEL_LABEL, type PapelUsuario } from "@/lib/types"

const PERFIS: PapelUsuario[] = ["supervisor", "encarregado"]

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [perfil, setPerfil] = useState<PapelUsuario | null>(null)
  const [senha, setSenha] = useState("")
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Já está logado: vai direto para o painel.
  useEffect(() => {
    if (getSessao()) router.replace("/")
  }, [router])

  function validar() {
    const e: Record<string, string> = {}
    if (nome.trim().length < 2) e.nome = "Informe seu nome"
    if (!emailValido(email)) e.email = "Informe um e-mail válido"
    if (!perfil) e.perfil = "Escolha um perfil"
    if (senha.length < 8) e.senha = "A senha deve ter no mínimo 8 caracteres"
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault()
    setErroGeral(null)
    if (!validar() || !perfil) return
    setEnviando(true)
    try {
      // A API já devolve o token: a pessoa entra direto no painel.
      await cadastrar(nome.trim(), email.trim(), perfil, senha)
      router.replace("/")
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : "Não foi possível criar a conta. Tente novamente.")
      setEnviando(false)
    }
  }

  return (
    <AuthShell titulo="Criar conta" descricao="Preencha os dados para acessar o painel.">
      <form noValidate onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nome</span>
          <input
            name="nome"
            autoComplete="name"
            placeholder="Seu nome"
            autoFocus
            className={inputClass}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            aria-invalid={Boolean(erros.nome)}
          />
          <FieldError>{erros.nome}</FieldError>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(erros.email)}
          />
          <FieldError>{erros.email}</FieldError>
        </label>

        {/* Perfil: mesmo padrão de botões alternáveis do stock-movement-modal.tsx */}
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="perfil-label" className="font-medium">
            Perfil
          </span>
          <div role="group" aria-labelledby="perfil-label" className="grid grid-cols-2 gap-3">
            {PERFIS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPerfil(p)}
                aria-pressed={perfil === p}
                className={`flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  perfil === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {PAPEL_LABEL[p]}
              </button>
            ))}
          </div>
          <FieldError>{erros.perfil}</FieldError>
        </div>

        {/* div + htmlFor (e não <label> em volta) para o botão de mostrar senha não entrar no nome do campo */}
        <div className="flex flex-col gap-1.5 text-sm">
          <label htmlFor="cadastro-senha" className="font-medium">
            Senha
          </label>
          <PasswordInput
            id="cadastro-senha"
            name="senha"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={Boolean(erros.senha)}
            aria-describedby="cadastro-senha-dica"
          />
          {erros.senha ? (
            <FieldError id="cadastro-senha-dica">{erros.senha}</FieldError>
          ) : (
            <span id="cadastro-senha-dica" className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres
            </span>
          )}
        </div>

        {erroGeral ? <AuthAlert>{erroGeral}</AuthAlert> : null}

        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
