import { AuthProvider } from "@/components/auth/auth-provider"
import { UserMenu } from "@/components/auth/user-menu"
import { ChatProvider } from "@/components/chat/chat-provider"
import { ExpeditionTable } from "@/components/dashboard/expedition-table"
import { InventoryProvider } from "@/components/dashboard/inventory-provider"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { ProductsTable } from "@/components/dashboard/products-table"

export default function Page() {
  return (
    // Sem sessão, o AuthProvider redireciona para /login.
    <AuthProvider>
      <InventoryProvider>
        <ChatProvider>
          <div className="min-h-screen bg-muted/30">
            <header className="border-b border-border bg-card">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

                {/* Lado Esquerdo: Logo + Textos */}
                <div className="flex items-center gap-3">
                  <div className="logo">
                    <img src="/gemini-svg.png" alt="Logo Expedita" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <h1 className="text-lg font-semibold leading-tight">Expedita</h1>
                    <p className="text-xs text-muted-foreground">Painel do supervisor</p>
                  </div>
                </div>

                {/* Lado Direito: usuário logado + Botão Sair */}
                <UserMenu />

              </div>
            </header>

            <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
              <MetricCards />
              <ExpeditionTable />
              <ProductsTable />
            </main>
          </div>
        </ChatProvider>
      </InventoryProvider>
    </AuthProvider>
  )
}
