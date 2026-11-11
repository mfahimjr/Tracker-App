import type { PlaceKey } from '../lib/constants'

export interface Task {
  id: string
  text: string
  owner: string
  due: string | null
  done: boolean
}

export interface Project {
  id: string
  name: string
  client: string
  start: string | null
  deadline: string | null
  // One index per lifecycle stage, into STAGE_STATUSES (0 Complete ... 4 Not set).
  stages: number[]
  tasks: Task[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  by: string
  approved: boolean
}

export interface Invoice {
  id: string
  no: string
  project: string
  amountSen: number
  status: 'Pending' | 'Paid' | 'Overdue'
  file: string | null
}

export interface Subscription {
  id: string
  name: string
  vendor: string
  amountSen: number
  cycle: 'Monthly' | 'Quarterly' | 'Yearly'
  nextBilling: string
  status: 'Active' | 'Paused' | 'Cancelled'
}

export interface Transaction {
  id: string
  date: string
  description: string
  project: string
  type: 'Income' | 'Expense'
  amountSen: number
  status: 'Completed' | 'Pending' | 'Failed'
}

export interface Reminder {
  id: string
  text: string
  to: string
  // yyyy-mm-ddTHH:mm, the value a datetime-local input produces.
  remindAt: string
  viaGmail: boolean
  by: string
  sent: boolean
}

export interface Contact {
  id: string
  group: 'Staff' | 'Partner' | 'Client'
  name: string
  designation: string
  phone: string
  organisation: string
  email: string
}

export interface LeaveRequest {
  id: string
  who: string
  type: 'Annual' | 'Medical' | 'Unpaid' | 'Replacement'
  from: string
  to: string
  period: 'Full' | 'AM' | 'PM'
  why: string
  attachment: string | null
  relief: string
}

export interface AttendanceRecord {
  id: string
  who: string
  place: PlaceKey
  tin: number
  tout: number | null
  lat: number
  lng: number
  link: string
  demo: boolean
}

export interface FileItem {
  id: string
  name: string
  note: string
}

export interface FolderNode {
  id: string
  name: string
  folders: FolderNode[]
  files: FileItem[]
}

export interface NotifySettings {
  inbox: boolean
  gmail: boolean
  ann: boolean
  inv: boolean
  lead: string
}

export interface Profile {
  name: string
  phone: string
  email: string
  photo: string | null
  notify: NotifySettings
}

export interface AppData {
  projects: Project[]
  announcements: Announcement[]
  invoices: Invoice[]
  subscriptions: Subscription[]
  transactions: Transaction[]
  reminders: Reminder[]
  contacts: Contact[]
  leaves: LeaveRequest[]
  attendance: AttendanceRecord[]
  root: FolderNode
  profile: Profile
}
