"use client"

import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { AuthAlert, AuthShell, FieldError, PasswordInput, inputClass } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { emailValido, getSessao, login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
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
    if (!emailValido(email)) e.email = "Informe um e-mail válido"
    if (!senha) e.senha = "Informe a senha"
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault()
    setErroGeral(null)
    if (!validar()) return
    setEnviando(true)
    try {
      await login(email.trim(), senha)
      router.replace("/")
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.")
      setEnviando(false)
    }
  }

  return (
    <AuthShell titulo="Entrar" descricao="Acesse o painel com seu e-mail e senha.">
      <form noValidate onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            autoFocus
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(erros.email)}
          />
          <FieldError>{erros.email}</FieldError>
        </label>

        {/* div + htmlFor (e não <label> em volta) para o botão de mostrar senha não entrar no nome do campo */}
        <div className="flex flex-col gap-1.5 text-sm">
          <label htmlFor="login-senha" className="font-medium">
            Senha
          </label>
          <PasswordInput
            id="login-senha"
            name="senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={Boolean(erros.senha)}
            aria-describedby={erros.senha ? "login-senha-erro" : undefined}
          />
          <FieldError id="login-senha-erro">{erros.senha}</FieldError>
        </div>

        {erroGeral ? <AuthAlert>{erroGeral}</AuthAlert> : null}

        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  )
}
