"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Mesmo estilo de input usado no product-modal.tsx. */
export const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"

/** Moldura das telas de login e cadastro: logo, nome do app e card centralizado. */
export function AuthShell({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          {/* No tema escuro do sistema usa a versão com o "E" claro. */}
          <picture>
            <source srcSet="/EXPEDITA-escuro.png" media="(prefers-color-scheme: dark)" />
            <img src="/EXPEDITA.png" alt="Expedita" className="h-14 w-auto object-contain" />
          </picture>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-semibold leading-tight">Expedita</span>
            <span className="text-xs text-muted-foreground">Painel do supervisor</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-base font-semibold">{titulo}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Mensagem de erro geral (ex.: resposta da API), no estilo do alerta de atraso. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
    >
      {children}
    </div>
  )
}

/** Mensagem de erro de um campo. */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <span id={id} className="text-xs text-destructive">
      {children}
    </span>
  )
}

/** Campo de senha com botão para mostrar/ocultar. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visivel ? "text" : "password"} className={cn(inputClass, "pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
