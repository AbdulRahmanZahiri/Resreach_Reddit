import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Reddit Primary Care Discourse · Canada · MUN Research',
  description: 'Interactive analysis of 89,398 Reddit posts and comments on primary health care access in Canada — Faculty of Medicine, Memorial University of Newfoundland.',
  keywords: ['primary care', 'Canada', 'Reddit', 'health care', 'MUN', 'research'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
