import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { createDemoData } from './demo'
import { DataContext } from './context'
import type { AppData } from './types'

// Holds the demo data for the signed-in session. Lives only in memory: a reload resets it.
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<AppData>(() =>
    createDemoData({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }),
  )

  return <DataContext.Provider value={{ data, update: (change) => setData(change) }}>{children}</DataContext.Provider>
}
