import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sentir Extranjero - Portal de extranjeria y nacionalidad",
  description:
    "Espacio privado del equipo de Sentir Extranjero para seguir expedientes, documentos y mensajes de clientes.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
      {
        url: "/favicon-150x150.png",
        type: "image/png",
        sizes: "150x150",
      },
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
