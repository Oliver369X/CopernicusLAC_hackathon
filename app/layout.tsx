import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Doctor Soya - Monitoreo Agrícola',
  description: 'Datos satelitales Copernicus y análisis de salud de cultivos para agricultura inteligente',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Doctor Soya',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.svg',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased bg-background scrollbar-thin">
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
