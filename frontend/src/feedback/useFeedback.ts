import { useContext } from 'react'
import { FeedbackContext } from './context'

// Replaces the prototype's alert() and confirm() calls (spec 9.3).
export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider')
  return ctx
}
