import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Geist_Mono, Jost } from 'next/font/google'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jost',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TradeLink - Connect · Trade · Grow',
  description: 'La plateforme B2B qui unifie votre catalogue, vos commandes, vos règlements multi-devises et le suivi logistique avec vos partenaires en Afrique et à l\'international.',
  openGraph: {
    title: 'TradeLink - Connect · Trade · Grow',
    description: 'Plateforme B2B pour le commerce international en Afrique',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${geistMono.variable} ${jost.variable}`}>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}