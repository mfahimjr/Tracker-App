// Shared constants. Keep stage and status names in sync with the backend enums.

export const LEAVE_TYPES = ['Annual', 'Medical', 'Unpaid', 'Replacement'] as const
export const LEAVE_PERIODS = ['Full', 'AM', 'PM'] as const

export const PLACES = [
  { key: 'WFO', label: 'Office' },
  { key: 'WFH', label: 'Home' },
  { key: 'OnSite', label: 'On site' },
] as const

export type PlaceKey = (typeof PLACES)[number]['key']

export const PLACE_LABEL: Record<PlaceKey, string> = { WFO: 'Office', WFH: 'Home', OnSite: 'On site' }

// Accepted Google Maps link hosts (spec 5.9).
export const GOOGLE_MAPS_RE = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i

export const CONTACT_GROUPS = ['Staff', 'Partner', 'Client'] as const
export const INVOICE_STATUSES = ['Pending', 'Paid', 'Overdue'] as const
export const SUBSCRIPTION_CYCLES = ['Monthly', 'Quarterly', 'Yearly'] as const
export const SUBSCRIPTION_STATUSES = ['Active', 'Paused', 'Cancelled'] as const
export const TRANSACTION_TYPES = ['Income', 'Expense'] as const
export const TRANSACTION_STATUSES = ['Completed', 'Pending', 'Failed'] as const
export const REMIND_LEAD_TIMES = ['At due time', '1 hour before', '1 day before'] as const

// Placeholder payroll rates from the prototype. Real rates come from the statutory table (spec 5.10).
export const EPF_RATE = 0.11
export const SOCSO_EIS_SEN = 4000

// Team members used as task owners and reminder recipients in the demo data.
export const TEAM = ['Aina Rahman', 'Daniel Lee', 'Siti Noor'] as const
