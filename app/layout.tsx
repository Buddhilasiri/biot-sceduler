import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BIoT Innovations - Meeting Scheduler",
  description: "Book a call with our engineers",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-biot-raisin">
          <Navigation />
          <main className="container mx-auto px-4 py-8 max-w-[780px]">{children}</main>
          <footer className="border-t border-white/10 mt-16 py-8">
            <div className="container mx-auto px-4 max-w-[780px] text-center">
              <p className="text-neutral-400 text-sm">© 2025 BIoT Innovations – Built with love & automation</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
