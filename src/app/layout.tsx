import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MyAlgorithm - Control Your Feed',
  description: 'The open-source social feed platform where you control your algorithms',
  keywords: 'tracker, social feed, algorithm, content curation, personalized feed',
  authors: [{ name: 'Joseph Nash' }],
  openGraph: {
    title: 'MyAlgorithm - Control Your Feed',
    description: 'Build your own feed in 60 seconds',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
