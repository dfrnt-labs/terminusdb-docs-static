'use client'

import { ThemeProvider } from 'next-themes'
import { ConnectionProvider } from '@/components/ConnectionSettings/ConnectionContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <ConnectionProvider>
        {children}
      </ConnectionProvider>
    </ThemeProvider>
  )
}
