import { useState } from 'react'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, Tag, TableScroll, td, th } from '../components/ui'
import { LEAVE_PERIODS, LEAVE_TYPES, TEAM } from '../lib/constants'
import { addDays, fmtDate, today } from '../lib/format'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import { useMe } from '../store/useMe'
import type { LeaveRequest } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

const TYPE_COLOR: Record<LeaveRequest['type'], string> = {
  Annual: 'var(--ac)',
  Medical: 'var(--s2)',
  Unpaid: 'var(--s3)',
  Replacement: 'var(--s1)',
}

const PERIOD_LABEL: Record<LeaveRequest['period'], string> = { Full: 'Full day', AM: 'AM', PM: 'PM' }

export default function LeavePage() {
  const { data, update } = useData()
  const me = useMe()
  const { toast, confirm } = useFeedback()
  const [rosterDay, setRosterDay] = useState(today())
  const [editing, setEditing] = useState<LeaveRequest | 'new' | null>(null)

  const rows = data.leaves.filter((l) => me.isManager || l.who === me.name)
  const roster = data.leaves.filter((l) => l.from <= rosterDay && rosterDay <= l.to)
  const reliefOptions = ['None', ...TEAM.filter((n) => n !== me.name)]

  const fields: FieldDef[] = [
    { key: 'type', label: 'Leave type', type: 'select', options: LEAVE_TYPES },
    { key: 'from', label: 'From', type: 'date' },
    { key: 'to', label: 'To', type: 'date' },
    { key: 'period', label: 'Period', type: 'select', options: LEAVE_PERIODS },
    { key: 'why', label: 'Reason', type: 'area' },
    { key: 'attachment', label: 'Attachment (optional)', type: 'file' },
    { key: 'relief', label: 'Relief person (optional)', type: 'select', options: reliefOptions },
  ]

  function save(values: FormValues) {
    const from = String(values.from)
    const to = String(values.to)
    const period = String(values.period) as LeaveRequest['period']
    if (!from || !to) return 'Choose the leave dates.'
    if (to < from) return 'The end date cannot be before the start date.'
    if (period !== 'Full' && from !== to) return 'AM or PM leave must be a single day.'

    const request: LeaveRequest = {
      id: editing && editing !== 'new' ? editing.id : newId(),
      who: me.name,
      type: String(values.type) as LeaveRequest['type'],
      from,
      to,
      period,
      why: String(values.why).trim(),
      attachment: typeof values.attachment === 'string' ? values.attachment : editing && editing !== 'new' ? editing.attachment : null,
      relief: String(values.relief) === 'None' ? '' : String(values.relief),
    }
    update((d) => ({
      ...d,
      leaves: editing && editing !== 'new' ? d.leaves.map((l) => (l.id === request.id ? request : l)) : [...d.leaves, request],
    }))
    toast(editing && editing !== 'new' ? 'Leave updated.' : 'Leave application submitted.')
    setEditing(null)
  }

  async function remove(l: LeaveRequest) {
    if (!(await confirm('Delete this leave application?'))) return
    update((d) => ({ ...d, leaves: d.leaves.filter((x) => x.id !== l.id) }))
  }

  const editInitial = (l: LeaveRequest) => ({
    type: l.type,
    from: l.from,
    to: l.to,
    period: l.period,
    why: l.why,
    attachment: l.attachment,
    relief: l.relief || 'None',
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-mu">Apply for leave and see who is away each day.</p>
        <Button variant="primary" onClick={() => setEditing('new')}>+ Apply for leave</Button>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Daily leave roster · {fmtDate(rosterDay)}
            {rosterDay === today() ? ' (today)' : ''}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Button aria-label="Previous day" onClick={() => setRosterDay(addDays(rosterDay, -1))}>‹</Button>
            <input
              type="date"
              aria-label="Roster date"
              value={rosterDay}
              onChange={(e) => e.target.value && setRosterDay(e.target.value)}
              className="rounded-md border border-bd bg-card px-2 py-1.5"
            />
            <Button aria-label="Next day" onClick={() => setRosterDay(addDays(rosterDay, 1))}>›</Button>
            <Button onClick={() => setRosterDay(today())}>Today</Button>
          </div>
        </div>
        <TableScroll>
          <table className="w-full min-w-130 border-collapse">
            <thead>
              <tr>
                {['Employee', 'Type', 'Period', 'Relief person'].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 && (
                <tr><td colSpan={4} className="py-3 text-mu">No one is on leave this day.</td></tr>
              )}
              {roster.map((l) => (
                <tr key={l.id}>
                  <td className={td}><b>{l.who}</b></td>
                  <td className={td}><Tag color={TYPE_COLOR[l.type]}>{l.type}</Tag></td>
                  <td className={td}>{PERIOD_LABEL[l.period]}</td>
                  <td className={td}>{l.relief || <span className="text-mu">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">{me.isManager ? 'All leave applications' : 'My leave applications'}</h3>
        <TableScroll>
          <table className="w-full min-w-190 border-collapse">
            <thead>
              <tr>
                {[...(me.isManager ? ['Employee'] : []), 'Type', 'Dates', 'Period', 'Reason', 'Attachment', 'Relief person', ''].map((h, i) => (
                  <th key={i} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={me.isManager ? 8 : 7} className="py-3 text-mu">No applications yet.</td></tr>
              )}
              {rows.map((l) => (
                <tr key={l.id}>
                  {me.isManager && <td className={td}>{l.who}</td>}
                  <td className={td}><Tag color={TYPE_COLOR[l.type]}>{l.type}</Tag></td>
                  <td className={td}>{l.from === l.to ? fmtDate(l.from) : `${fmtDate(l.from)} – ${fmtDate(l.to)}`}</td>
                  <td className={td}>{PERIOD_LABEL[l.period]}</td>
                  <td className={td}>{l.why}</td>
                  <td className={td}>{l.attachment ?? <span className="text-mu">none</span>}</td>
                  <td className={td}>{l.relief || <span className="text-mu">-</span>}</td>
                  <td className={td + ' whitespace-nowrap'}>
                    {l.who === me.name && (
                      <>
                        <Button variant="ghost" onClick={() => setEditing(l)}>Edit</Button>
                        <Button variant="danger" onClick={() => void remove(l)}>Delete</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {editing && (
        <FormDialog
          title={editing === 'new' ? 'Apply for leave' : 'Edit leave'}
          submitLabel={editing === 'new' ? 'Submit' : 'Save'}
          fields={fields}
          initial={editing === 'new' ? { type: LEAVE_TYPES[0], from: today(), to: today(), period: 'Full', relief: 'None' } : editInitial(editing)}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
