import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Button, Modal } from '../components/ui'
import { FeedbackContext } from './context'

interface Toast {
  id: number
  message: string
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<{ message: string } | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  const nextId = useRef(0)

  const toast = useCallback((message: string) => {
    const id = ++nextId.current
    setToasts((list) => [...list, { id, message }])
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500)
  }, [])

  const confirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setPending({ message })
      }),
    [],
  )

  function answer(ok: boolean) {
    resolver.current?.(ok)
    resolver.current = null
    setPending(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-md bg-nav px-4 py-2.5 text-sm text-white shadow-lg">
            {t.message}
          </div>
        ))}
      </div>
      {pending && (
        <Modal title="Please confirm" onClose={() => answer(false)}>
          <p className="mb-4">{pending.message}</p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => answer(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => answer(true)}>
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  )
}
