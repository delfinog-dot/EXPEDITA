import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EXPEDITA | Painel do Supervisor',
  description: 'Sistema de controle de estoque e logística: métricas, expedição de carregamentos e gestão de mercadorias.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/EXPEDITA.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/EXPEDITA.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/gemini-svg.png',
        type: 'image/png',
      },
    ],
    apple: '/EXPEDITA.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
return (
    <html lang="pt-br">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
  
