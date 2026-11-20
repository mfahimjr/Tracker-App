// Demo content ported from the prototype (Tracker.html). Replaced by API data as each module ships.
import { dayOfMonth, offsetDate, toSen } from '../lib/format'
import type { AppData, AttendanceRecord, Profile } from './types'

export const newId = () => crypto.randomUUID()

// Mirrors the prototype's four attendance days for the three demo staff.
function demoAttendance(): AttendanceRecord[] {
  const out: AttendanceRecord[] = []
  const now = new Date()
  let back = 0
  let counted = 0
  while (counted < 4) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ++back)
    if (d.getDay() % 6 === 0) continue
    counted++
    const people: [string, 'WFO' | 'WFH' | 'OnSite'][] = [
      ['Aina Rahman', 'WFO'],
      ['Daniel Lee', counted % 2 ? 'WFH' : 'WFO'],
      ['Siti Noor', 'OnSite'],
    ]
    people.forEach(([who, place], k) => {
      const tin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8 + (k % 2), 15 + counted * 7).getTime()
      const lat = Number((3.139 + k * 0.004).toFixed(5))
      const lng = Number((101.6869 + counted * 0.002).toFixed(5))
      out.push({
        id: newId(),
        who,
        place,
        tin,
        tout: tin + 8.5 * 36e5 + counted * 3e5,
        lat,
        lng,
        link: place === 'OnSite' ? `https://www.google.com/maps?q=${lat},${lng}` : '',
        demo: true,
      })
    })
  }
  return out
}

export function createDemoData(profile: Pick<Profile, 'name' | 'email' | 'phone'>): AppData {
  const p = (name: string, client: string, start: string, deadline: string, stages: number[], tasks: [string, string, string, boolean][]) => ({
    id: newId(),
    name,
    client,
    start,
    deadline,
    stages,
    tasks: tasks.map(([text, owner, due, done]) => ({ id: newId(), text, owner, due, done })),
  })

  return {
    projects: [
      p('Smart Complaint Agent', 'Ministry A', dayOfMonth(3), dayOfMonth(33), [0, 0, 0, 0, 1, 4, 4, 4, 4, 4], [
        ['Confirm POC scope with client', 'Aina Rahman', dayOfMonth(5), true],
        ['Prepare workflow presentation deck', 'Daniel Lee', dayOfMonth(14), false],
        ['Book immersion session', 'Aina Rahman', dayOfMonth(20), false],
      ]),
      p('Service Chatbot', 'Agency B', dayOfMonth(1), dayOfMonth(31), [0, 0, 0, 1, 3, 4, 4, 4, 4, 4], [
        ['Send requirement mapping draft', 'Daniel Lee', dayOfMonth(9), false],
        ['Collect sample chat transcripts', 'Siti Noor', dayOfMonth(12), false],
      ]),
      p('Document Intake', 'Agency C', dayOfMonth(6), dayOfMonth(12), [0, 2, 3, 3, 4, 4, 4, 4, 4, 4], [
        ['Follow up on fact finding access', 'Aina Rahman', dayOfMonth(-2), false],
      ]),
      p('Knowledge Search', 'Ministry D', dayOfMonth(-14), dayOfMonth(30), [0, 0, 0, 0, 0, 0, 1, 4, 4, 3], [
        ['Finetuning review', 'Daniel Lee', dayOfMonth(16), false],
        ['Draft CFA paper outline', 'Siti Noor', dayOfMonth(24), false],
      ]),
      p('Policy Summariser', 'Agency E', dayOfMonth(21), dayOfMonth(50), [3, 3, 3, 3, 4, 4, 4, 4, 4, 4], []),
    ],
    announcements: [
      { id: newId(), title: 'Lunch&Learn on 14 Nov', body: 'Please confirm attendance with your project lead.', by: 'Aina Rahman', approved: true },
      { id: newId(), title: 'Q4 invoices', body: 'Upload all signed invoices by 25 Nov.', by: 'Daniel Lee', approved: false },
    ],
    invoices: [
      { id: newId(), no: 'INV-0042', project: 'Service Chatbot', amountSen: toSen(18000), status: 'Paid', file: 'inv-0042.pdf' },
      { id: newId(), no: 'INV-0043', project: 'Document Intake', amountSen: toSen(30200), status: 'Overdue', file: null },
    ],
    subscriptions: [
      { id: newId(), name: 'Hosting plan', vendor: 'CloudCo', amountSen: toSen(1200), cycle: 'Monthly', nextBilling: offsetDate(12), status: 'Active' },
      { id: newId(), name: 'AI usage', vendor: 'Anthropic', amountSen: toSen(650), cycle: 'Monthly', nextBilling: offsetDate(12), status: 'Active' },
      { id: newId(), name: 'Design tool', vendor: 'Figma', amountSen: toSen(1800), cycle: 'Yearly', nextBilling: offsetDate(120), status: 'Paused' },
    ],
    transactions: [
      { id: newId(), date: offsetDate(-18), description: 'Payment received for INV-0042', project: 'Service Chatbot', type: 'Income', amountSen: toSen(18000), status: 'Completed' },
      { id: newId(), date: offsetDate(-18), description: 'Hosting plan', project: 'General', type: 'Expense', amountSen: toSen(1200), status: 'Completed' },
      { id: newId(), date: offsetDate(-18), description: 'AI usage', project: 'General', type: 'Expense', amountSen: toSen(650), status: 'Completed' },
      { id: newId(), date: offsetDate(-2), description: 'Milestone payment, Document Intake', project: 'Document Intake', type: 'Income', amountSen: toSen(30200), status: 'Pending' },
    ],
    reminders: [
      { id: newId(), text: 'Review Fact Finding notes', to: 'Daniel Lee', remindAt: '2026-11-03T09:00', viaGmail: true, by: 'Aina Rahman', sent: false },
      { id: newId(), text: 'Send draft CFA paper', to: 'Aina Rahman', remindAt: '2026-11-10T10:00', viaGmail: false, by: 'Daniel Lee', sent: false },
    ],
    contacts: [
      { id: newId(), group: 'Staff', name: 'Aina Rahman', designation: 'Project Lead', phone: '012-345 6789', organisation: 'Pepper Labs', email: 'aina@pepper.my' },
      { id: newId(), group: 'Staff', name: 'Daniel Lee', designation: 'Engineer', phone: '013-222 1100', organisation: 'Pepper Labs', email: 'daniel@pepper.my' },
      { id: newId(), group: 'Partner', name: 'Siti Noor', designation: 'Account Manager', phone: '011-998 8776', organisation: 'CloudCo', email: 'siti@cloudco.my' },
      { id: newId(), group: 'Client', name: 'Dato’ Hamid', designation: 'Director', phone: '019-887 6655', organisation: 'Ministry A', email: 'hamid@ministry-a.gov.my' },
      { id: newId(), group: 'Client', name: 'Puan Rosni', designation: 'IT Head', phone: '016-554 4433', organisation: 'Agency B', email: 'rosni@agency-b.gov.my' },
    ],
    leaves: [
      { id: newId(), who: 'Daniel Lee', type: 'Annual', from: offsetDate(-1), to: offsetDate(1), period: 'Full', why: 'Family trip', attachment: null, relief: 'Aina Rahman' },
      { id: newId(), who: 'Siti Noor', type: 'Medical', from: offsetDate(0), to: offsetDate(0), period: 'AM', why: 'Clinic appointment', attachment: 'mc-slip.pdf', relief: '' },
      { id: newId(), who: 'Aina Rahman', type: 'Replacement', from: offsetDate(10), to: offsetDate(10), period: 'Full', why: 'Replacement for weekend event', attachment: null, relief: 'Daniel Lee' },
    ],
    attendance: demoAttendance(),
    root: {
      id: newId(),
      name: '',
      files: [],
      folders: [
        { id: newId(), name: 'Organisation (All Staff)', folders: [], files: [{ id: newId(), name: 'Staff-Handbook.pdf', note: 'Applies to every staff member' }] },
        { id: newId(), name: 'Operations', folders: [{ id: newId(), name: 'Templates', folders: [], files: [] }], files: [{ id: newId(), name: 'SOP-v1.pdf', note: 'Onboarding steps' }] },
        { id: newId(), name: 'Engineering', folders: [], files: [] },
        { id: newId(), name: 'Finance', folders: [], files: [] },
        { id: newId(), name: 'Inventory', folders: [], files: [] },
        { id: newId(), name: 'Documentation', folders: [], files: [] },
        { id: newId(), name: 'Artifacts', folders: [], files: [] },
      ],
    },
    profile: {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      photo: null,
      notify: { inbox: true, gmail: true, ann: true, inv: true, lead: '1 hour before' },
    },
  }
}
