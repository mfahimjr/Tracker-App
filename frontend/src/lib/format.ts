// Date and money helpers. Dates are ISO yyyy-mm-dd strings in local time; money is integer sen.

const pad = (n: number) => String(n).padStart(2, '0')

export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const today = () => toIso(new Date())

// Today plus n days.
export const offsetDate = (days: number) => {
  const t = new Date()
  return toIso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + days))
}

// Day n of the current month (n may be 0 or negative to reach earlier months).
export const dayOfMonth = (n: number) => {
  const t = new Date()
  return toIso(new Date(t.getFullYear(), t.getMonth(), n))
}

// An ISO date moved by n days.
export const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return toIso(new Date(y, m - 1, d + n))
}

export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const daysTo = (s: string) => Math.round((parseIso(s).getTime() - parseIso(today()).getTime()) / 864e5)

export const fmtDate = (s: string | null | undefined) =>
  s ? parseIso(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export const fmtDuration = (ms: number) => `${Math.floor(ms / 36e5)}h ${pad(Math.floor((ms % 36e5) / 6e4))}m`

export const toSen = (ringgit: number) => Math.round(ringgit * 100)

export const money = (sen: number) =>
  'RM ' + (sen / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
