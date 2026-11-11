import { createContext } from 'react'

export interface FeedbackState {
  toast: (message: string) => void
  confirm: (message: string) => Promise<boolean>
}

export const FeedbackContext = createContext<FeedbackState | null>(null)
