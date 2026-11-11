import { useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, TableScroll, td, th } from '../components/ui'
import { REMIND_LEAD_TIMES, TEAM } from '../lib/constants'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import { useMe } from '../store/useMe'
import type { Profile, Reminder } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

type ProfileField = 'name' | 'phone' | 'email'

const PROFILE_FIELD_LABEL: Record<ProfileField, string> = { name: 'Full name', phone: 'Mobile phone', email: 'Email' }

const PROFILE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Full name' },
  { key: 'phone', label: 'Mobile phone' },
  { key: 'email', label: 'Email', type: 'email' },
]

const profileFieldDef = (k: ProfileField): FieldDef => ({
  key: k,
  label: PROFILE_FIELD_LABEL[k],
  type: k === 'email' ? 'email' : 'text',
})

const REMINDER_FIELDS: FieldDef[] = [
  { key: 'text', label: 'Reminder' },
  { key: 'to', label: 'Send to', type: 'select', options: TEAM },
  { key: 'remindAt', label: 'When', type: 'datetime' },
  { key: 'viaGmail', label: 'Also send via Gmail', type: 'check' },
]

export default function ProfilePage() {
  const { data, update } = useData()
  const me = useMe()
  const { user, logout } = useAuth()
  const { toast, confirm } = useFeedback()
  const [editingField, setEditingField] = useState<ProfileField | 'all' | null>(null)
  const [reminderDialog, setReminderDialog] = useState<{ item?: Reminder } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const profile = data.profile

  function setProfile(change: (p: Profile) => Profile) {
    update((d) => ({ ...d, profile: change(d.profile) }))
  }

  function onPhoto(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2e6) return toast('Choose an image under 2 MB.')
    const reader = new FileReader()
    reader.onload = () => setProfile((p) => ({ ...p, photo: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const myReminders = data.reminders.filter((r) => r.to === me.name && profile.notify.inbox)
  const overdueInvoices = data.invoices.filter((i) => i.status === 'Overdue')

  function gmailLink(to: string, subject: string, body: string) {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function sendGmail(r: Reminder) {
    const to = data.contacts.find((c) => c.name === r.to)?.email ?? ''
    const body = `Hi ${r.to},\n\nReminder: ${r.text}\nDue: ${r.remindAt.replace('T', ' ')}\n\nFrom ${me.name}`
    window.open(gmailLink(to, `Reminder: ${r.text}`, body), '_blank', 'noopener')
    update((d) => ({ ...d, reminders: d.reminders.map((x) => (x.id === r.id ? { ...x, sent: true } : x)) }))
  }

  async function removeReminder(r: Reminder) {
    if (!(await confirm('Delete this reminder?'))) return
    update((d) => ({ ...d, reminders: d.reminders.filter((x) => x.id !== r.id) }))
  }

  function saveReminder(values: FormValues) {
    const text = String(values.text).trim()
    if (!text) return 'Enter the reminder text.'
    const reminder: Reminder = {
      id: reminderDialog?.item?.id ?? newId(),
      text,
      to: String(values.to),
      remindAt: String(values.remindAt),
      viaGmail: Boolean(values.viaGmail),
      by: me.name,
      sent: reminderDialog?.item?.sent ?? false,
    }
    update((d) => ({
      ...d,
      reminders: reminderDialog?.item
        ? d.reminders.map((r) => (r.id === reminder.id ? reminder : r))
        : [...d.reminders, reminder],
    }))
    setReminderDialog(null)
  }

  const photoInitial = me.name.charAt(0)
  const notifyRows: { key: 'inbox' | 'gmail' | 'ann' | 'inv'; label: string; hint: string }[] = [
    { key: 'inbox', label: 'In-app inbox alerts', hint: 'Show reminders and alerts assigned to you' },
    { key: 'gmail', label: 'Email me via Gmail', hint: 'Receive reminders in your email' },
    { key: 'ann', label: 'Announcement updates', hint: 'New announcements and approval decisions' },
    { key: 'inv', label: 'Billing alerts', hint: 'Overdue and newly added invoices' },
  ]

  return (
    <>
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-nav text-2xl font-semibold text-white">
          {profile.photo ? <img src={profile.photo} alt="" className="size-full object-cover" /> : photoInitial}
        </div>
        <div className="min-w-40 flex-1">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-mu">{me.role} · {profile.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => fileInput.current?.click()}>Change photo</Button>
          {profile.photo && <Button variant="danger" onClick={() => setProfile((p) => ({ ...p, photo: null }))}>Remove</Button>}
          <Button variant="primary" onClick={() => setEditingField('all')}>Edit profile</Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          aria-label="Profile photo"
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Personal information</h3>
        <TableScroll>
          <table className="w-full border-collapse">
            <tbody>
              {(['name', 'phone', 'email'] as ProfileField[]).map((k) => (
                <tr key={k}>
                  <td className={td + ' w-36 text-mu'}>{PROFILE_FIELD_LABEL[k]}</td>
                  <td className={td}>{profile[k] || <span className="text-mu">-</span>}</td>
                  <td className={td + ' text-right'}>
                    <Button variant="ghost" onClick={() => setEditingField(k)}>Edit</Button>
                  </td>
                </tr>
              ))}
              <tr>
                <td className={td + ' text-mu'}>Role</td>
                <td className={td}>{me.role}</td>
                <td className={td} />
              </tr>
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Notification settings</h3>
        {notifyRows.map((n) => (
          <div key={n.key} className="flex items-center justify-between gap-2 border-b border-bd py-2.5">
            <div>
              {n.label}
              <br />
              <span className="text-xs text-mu">{n.hint}</span>
            </div>
            <input
              type="checkbox"
              aria-label={n.label}
              checked={profile.notify[n.key]}
              onChange={(e) => setProfile((p) => ({ ...p, notify: { ...p.notify, [n.key]: e.target.checked } }))}
              className="size-4.5"
            />
          </div>
        ))}
        <label htmlFor="lead" className="mt-3 block text-xs font-medium text-mu">Remind me</label>
        <select
          id="lead"
          value={profile.notify.lead}
          onChange={(e) => setProfile((p) => ({ ...p, notify: { ...p.notify, lead: e.target.value } }))}
          className="mt-1 rounded-md border border-bd bg-card px-2.5 py-2"
        >
          {REMIND_LEAD_TIMES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Inbox</h3>
        {myReminders.length === 0 && !(profile.notify.inv && overdueInvoices.length) && <p className="text-mu">Nothing for you.</p>}
        {myReminders.map((r) => (
          <div key={r.id} className="mb-2 rounded-r border-l-3 border-ac bg-acs px-3 py-2">
            <b>{r.text}</b>
            <div className="text-xs text-mu">from {r.by} · {r.remindAt.replace('T', ' ')}</div>
          </div>
        ))}
        {profile.notify.inv &&
          overdueInvoices.map((i) => (
            <div key={i.id} className="mb-2 rounded-r border-l-3 border-ac bg-acs px-3 py-2">
              <b>{i.no} is overdue</b>
            </div>
          ))}
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Reminders</h3>
          <div className="flex gap-2">
            <Button onClick={() => window.open(gmailLink('', '', ''), '_blank', 'noopener')}>Compose Gmail</Button>
            <Button variant="primary" onClick={() => setReminderDialog({})}>Set reminder</Button>
          </div>
        </div>
        <TableScroll>
          <table className="w-full min-w-160 border-collapse">
            <thead>
              <tr>
                {['Reminder', 'To', 'When', 'Gmail', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.reminders.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-mu">No reminders yet.</td></tr>
              )}
              {data.reminders.map((r) => (
                <tr key={r.id}>
                  <td className={td}>{r.text}</td>
                  <td className={td}>{r.to}</td>
                  <td className={td}>{r.remindAt.replace('T', ' ')}</td>
                  <td className={td}>{r.sent ? 'Sent' : r.viaGmail ? 'Scheduled' : '-'}</td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => sendGmail(r)}>Send Gmail</Button>
                    <Button variant="ghost" onClick={() => setReminderDialog({ item: r })}>Edit</Button>
                    <Button variant="danger" onClick={() => void removeReminder(r)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Preferences</h3>
        <div className="flex items-center justify-between gap-2 border-b border-bd py-2.5">
          <div>
            Theme
            <br />
            <span className="text-xs text-mu">Switch between light and dark</span>
          </div>
          <Button onClick={toggleTheme}>Switch theme</Button>
        </div>
        <div className="flex items-center justify-between gap-2 py-2.5">
          <div>
            Session
            <br />
            <span className="text-xs text-mu">Sign out of this device</span>
          </div>
          <Button variant="danger" onClick={() => void logout()}>Log out</Button>
        </div>
        {user && <p className="mt-2 text-xs text-mu">Signed in as {user.email}</p>}
      </Card>

      {editingField && (
        <FormDialog
          title={editingField === 'all' ? 'Edit profile' : `Edit ${PROFILE_FIELD_LABEL[editingField].toLowerCase()}`}
          fields={editingField === 'all' ? PROFILE_FIELDS : [profileFieldDef(editingField)]}
          initial={editingField === 'all' ? { name: profile.name, phone: profile.phone, email: profile.email } : { [editingField]: profile[editingField] }}
          onSubmit={(values) => {
            const keys: ProfileField[] = editingField === 'all' ? ['name', 'phone', 'email'] : [editingField]
            if (keys.includes('name') && !String(values.name).trim()) return 'Enter a name.'
            const next: Partial<Profile> = {}
            for (const k of keys) next[k] = String(values[k]).trim()
            setProfile((p) => ({ ...p, ...next }))
            setEditingField(null)
          }}
          onClose={() => setEditingField(null)}
        />
      )}

      {reminderDialog && (
        <FormDialog
          title={reminderDialog.item ? 'Edit reminder' : 'Set reminder'}
          fields={REMINDER_FIELDS}
          initial={
            reminderDialog.item
              ? { text: reminderDialog.item.text, to: reminderDialog.item.to, remindAt: reminderDialog.item.remindAt, viaGmail: reminderDialog.item.viaGmail }
              : { to: me.name, viaGmail: false }
          }
          onSubmit={saveReminder}
          onClose={() => setReminderDialog(null)}
        />
      )}
    </>
  )
}

// Light and dark themes, switched the same way as the prototype.
function toggleTheme() {
  const root = document.documentElement
  const isDark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = isDark ? 'light' : 'dark'
}
