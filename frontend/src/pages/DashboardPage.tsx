import { useState } from 'react'
import { FormDialog, type FieldDef } from '../components/FormDialog'
import { Button, Card, Legend, Stat, TableScroll, td, th } from '../components/ui'
import { CalendarPanel } from '../features/dashboard/CalendarPanel'
import { isProjectDone, stageName, stageStatusName } from '../features/projects/deadline'
import { STAGES, STAGE_STATUSES } from '../config/lifecycle'
import { daysTo, money } from '../lib/format'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import { useMe } from '../store/useMe'
import { useFeedback } from '../feedback/useFeedback'

const STATUS_COLOR = ['var(--s0)', 'var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']

const ANNOUNCEMENT_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'body', label: 'Message', type: 'area' },
]

export default function DashboardPage() {
  const { data, update } = useData()
  const me = useMe()
  const { toast } = useFeedback()
  const [posting, setPosting] = useState(false)

  const visible = data.announcements.filter((a) => a.approved || me.isManager || a.by === me.name)
  const open = data.projects.filter((p) => p.deadline && !isProjectDone(p))
  const overdue = open.filter((p) => daysTo(p.deadline!) < 0).length
  const dueSoon = open.filter((p) => daysTo(p.deadline!) >= 0 && daysTo(p.deadline!) <= 7).length
  const inProgress = data.projects.filter((p) => p.stages.includes(1)).length
  const onHold = data.projects.filter((p) => p.stages.includes(2)).length
  const outstanding = data.invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + i.amountSen, 0)
  const total = data.projects.length

  function post(values: Record<string, unknown>) {
    const title = String(values.title).trim()
    if (!title) return 'Enter a title.'
    update((d) => ({
      ...d,
      announcements: [
        { id: newId(), title, body: String(values.body).trim(), by: me.name, approved: me.isManager },
        ...d.announcements,
      ],
    }))
    if (!me.isManager) toast('Your announcement will go live after an admin approves it.')
    setPosting(false)
  }

  function decide(id: string, approve: boolean) {
    update((d) => ({
      ...d,
      announcements: approve
        ? d.announcements.map((a) => (a.id === id ? { ...a, approved: true } : a))
        : d.announcements.filter((a) => a.id !== id),
    }))
  }

  return (
    <>
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-pop">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-2xl font-semibold tracking-tight">Welcome back, {me.name.split(' ')[0]}</h2>
        <p className="relative mt-1.5 text-white/85">
          {total} projects in the pipeline · {overdue} overdue · {dueSoon} due in the next 7 days
        </p>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Announcements</h3>
          <Button variant="primary" onClick={() => setPosting(true)}>+ Announce</Button>
        </div>
        {visible.length === 0 && <p className="text-mu">No announcements.</p>}
        {visible.map((a) => (
          <div key={a.id} className="mb-2.5 rounded-xl border border-bd bg-bg/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <b className="font-semibold">{a.title}</b>
              {!a.approved && <span className="rounded-full bg-s1/15 px-2 py-0.5 text-xs font-medium text-s1">Pending approval</span>}
            </div>
            <div className="mt-0.5 text-sm">{a.body}</div>
            <div className="mt-1 text-xs text-mu">by {a.by}</div>
            {!a.approved && me.isManager && (
              <div className="mt-1 flex gap-1">
                <Button variant="ghost" onClick={() => decide(a.id, true)}>Approve</Button>
                <Button variant="danger" onClick={() => decide(a.id, false)}>Reject</Button>
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-mu">Anyone can post. Announcements go live after an admin approves.</p>
      </Card>

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <Stat label="Projects" value={total} accent="#4f46e5" />
        <Stat label="In progress" value={inProgress} accent="#16a34a" />
        <Stat label="On hold" value={onHold} accent="#d97706" />
        <Stat label="Outstanding billing" value={money(outstanding)} accent="#e11d48" small />
      </div>

      <Card>
        <CalendarPanel />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold">Project lifecycle</h3>
        <p className="mb-2 text-mu">Each row is a project, each column a stage of the POC pipeline.</p>
        <TableScroll>
          <table className="w-full min-w-170 border-collapse text-center">
            <thead>
              <tr>
                <th className={th + ' text-left'}>Project</th>
                {STAGES.map((s) => (
                  <th key={s} className={th + ' text-[10px] normal-case'}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id}>
                  <td className={td + ' text-left'}><b>{p.name}</b></td>
                  {p.stages.map((s, i) => (
                    <td key={i} className={td}>
                      <span
                        className="inline-block size-4 rounded"
                        style={{ background: STATUS_COLOR[s] }}
                        title={`${stageName(i)}: ${stageStatusName(s)}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Legend items={STAGE_STATUSES.map((s, i) => ({ color: STATUS_COLOR[i], label: s }))} />
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold">Stage summary (all projects)</h3>
        {STAGES.map((stage, i) => (
          <div key={stage} className="my-1.5 flex items-center gap-2">
            <span className="w-35 shrink-0 text-right text-xs">{stage}</span>
            <div className="flex h-3.5 flex-1 overflow-hidden rounded-sm bg-s4">
              {STAGE_STATUSES.map((status, k) => {
                const n = data.projects.filter((p) => p.stages[i] === k).length
                return (
                  <b
                    key={status}
                    title={`${status}: ${n}`}
                    className="block"
                    style={{ width: total ? `${(n / total) * 100}%` : '0%', background: STATUS_COLOR[k] }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </Card>

      {posting && (
        <FormDialog title="New announcement" fields={ANNOUNCEMENT_FIELDS} submitLabel="Post" onSubmit={post} onClose={() => setPosting(false)} />
      )}
    </>
  )
}
