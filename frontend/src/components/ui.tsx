import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`mb-4 rounded-2xl border border-bd bg-card p-5 shadow-card ${className}`}>{children}</div>
  )
}

type Variant = 'primary' | 'default' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-transparent bg-ac text-white shadow-pop hover:brightness-110',
  default: 'border-bd bg-card text-tx shadow-card hover:bg-acs',
  ghost: 'border-transparent bg-transparent px-1.5 py-0.5 text-ac hover:underline',
  danger: 'border-transparent bg-transparent px-1.5 py-0.5 text-s2 hover:underline',
}

export function Button({
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Tag({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-white" style={{ background: color }}>
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  small = false,
  accent = 'var(--ac)',
}: {
  label: string
  value: ReactNode
  small?: boolean
  accent?: string
}) {
  return (
    <Card className="!mb-0 relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="text-xs font-medium tracking-wide text-mu uppercase">{label}</div>
      <div className={small ? 'mt-1.5 text-lg font-semibold' : 'mt-1.5 text-3xl font-bold tracking-tight'}>{value}</div>
    </Card>
  )
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3.5 text-xs text-mu">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-nav/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-2xl border border-bd bg-card p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
    </div>
  )
}

// Table wrapper that scrolls sideways on phones instead of breaking the layout.
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5">{children}</div>
}

export const th = 'px-2.5 py-3 text-left text-[11px] font-semibold tracking-wider text-mu uppercase'
export const td = 'border-t border-bd px-2.5 py-3 align-middle'
