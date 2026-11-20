import { useState, type FormEvent } from 'react'

interface Message {
  from: 'you' | 'assistant'
  text: string
}

// Floating assistant from the prototype. Replies are mocked until the backend AI endpoint exists (spec 5.11).
export function Assistant() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { from: 'assistant', text: 'Hi! Ask me anything. The live version answers from the web via the backend.' },
  ])

  function ask(e: FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q) return
    setMessages((m) => [
      ...m,
      { from: 'you', text: q },
      { from: 'assistant', text: 'Mock reply. The live version searches the web through the backend and cites sources.' },
    ])
    setQuestion('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="fixed right-4.5 bottom-4.5 z-20 h-11 cursor-pointer rounded-full bg-ac px-4.5 font-medium text-white"
      >
        Assistant
      </button>
      {open && (
        <div className="fixed right-4.5 bottom-18 z-20 flex h-96 w-[min(320px,calc(100vw-36px))] flex-col rounded-lg border border-bd bg-card p-3 shadow-xl">
          <h3 className="mb-2 text-sm font-semibold">Tracker Assistant</h3>
          <div className="flex-1 overflow-auto text-sm" aria-live="polite">
            {messages.map((m, i) => (
              <p
                key={i}
                className={`my-1.5 rounded-md px-2.5 py-1.5 ${m.from === 'you' ? 'ml-7 bg-ac text-white' : 'bg-bg'}`}
              >
                {m.text}
              </p>
            ))}
          </div>
          <form onSubmit={ask} className="mt-2 flex gap-1.5">
            <input
              aria-label="Your question"
              placeholder="Type a question…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-bd bg-card px-2.5 py-2"
            />
            <button type="submit" className="cursor-pointer rounded-md bg-ac px-3 text-white">Send</button>
          </form>
        </div>
      )}
    </>
  )
}
