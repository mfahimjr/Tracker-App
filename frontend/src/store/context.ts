import { createContext } from 'react'
import type { AppData } from './types'

export interface DataState {
  data: AppData
  // Applies a change to the in-browser demo data.
  update: (change: (d: AppData) => AppData) => void
}

export const DataContext = createContext<DataState | null>(null)
