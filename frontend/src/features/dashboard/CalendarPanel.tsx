import { useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Legend } from '../../components/ui'
import { MONTHS, fmtDate, parseIso, today, toIso } from '../../lib/format'
import { useData } from '../../store/useData'
import type { Project, Task } from '../../store/types'
import { ProjectDialog } from '../projects/ProjectDialog'
import { deadlineInfo, isProjectDone } from '../projects/deadline'

type CalEvent =
  | { kind: 'deadline'; project: Project }
  | { kind: 'start'; project: Project }
  | { kind: 'task'; project: Project; task: Task }

function eventsOn(day: string, projects: Project[], filter: string): CalEvent[] {
  const out: CalEvent[] = []
  for (const p of projects) {
    if (filter !== 'all' && filter !== p.id) continue
    if (p.deadline === day) out.push({ kind: 'deadline', project: p })
    if (p.start === day) out.push({ kind: 'start', project: p })
    for (const task of p.tasks) if (task.due === day) out.push({ kind: 'task', project: p, task })
  }
  return out
}

function chipStyle(e: CalEvent): { className: string; style: CSSProperties; label: string } {
  if (e.kind === 'task') {
    return {
      className: `border border-bd border-l-3 border-l-s1 bg-bg text-tx ${e.task.done ? 'line-through opacity-70' : ''}`,
      style: {},
      label: `Task · ${e.task.text}`,
    }
  }
  if (e.kind === 'start') return { className: 'text-white', style: { background: 'var(--ac)' }, label: `Start · ${e.project.name}` }
  return { className: 'text-white', style: { background: deadlineInfo(e.project).color }, label: `Due · ${e.project.name}` }
}

export function CalendarPanel() {
  const { data } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const focusId = (location.state as { focusProjectId?: string } | null)?.focusProjectId
  const focus = data.projects.find((p) => p.id === focusId)
  const startDay = focus?.deadline ?? focus?.start ?? today()

  const [month, setMonth] = useState(() => parseIso(startDay))
  const [selected, setSelected] = useState(startDay)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Project | null>(null)

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const cells = Math.ceil((leading + new Date(year, monthIndex + 1, 0).getDate()) / 7) * 7
  const todayIso = today()

  function shift(n: number) {
    setMonth(n === 0 ? new Date() : new Date(year, monthIndex + n, 1))
    if (n === 0) setSelected(todayIso)
  }

  const selectedEvents = eventsOn(selected, data.projects, filter)
  const upcoming = data.projects
    .filter((p) => p.deadline && !isProjectDone(p) && (filter === 'all' || filter === p.id))
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
    .slice(0, 6)

  return (
    <div className="grid grid-cols-1 items-start gap-4.5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Project calendar · {MONTHS[monthIndex]} {year}</h3>
          <div className="flex flex-wrap gap-1.5">
            <select
              aria-label="Filter by project"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-bd bg-card px-2 py-1.5 text-sm"
            >
              <option value="all">All projects</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button onClick={() => shift(-1)} aria-label="Previous month">‹</Button>
            <Button onClick={() => shift(0)}>Today</Button>
            <Button onClick={() => shift(1)} aria-label="Next month">›</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-bd">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
            <div key={w} className="border-r border-b border-bd bg-bg py-1.5 text-center text-[11px] font-semibold text-mu">{w}</div>
          ))}
          {Array.from({ length: cells }, (_, k) => {
            const d = new Date(year, monthIndex, 1 - leading + k)
            const day = toIso(d)
            const events = eventsOn(day, data.projects, filter)
            const isOther = d.getMonth() !== monthIndex
            const isToday = day === todayIso
            const isSelected = day === selected
            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                aria-label={`${fmtDate(day)}, ${events.length} events`}
                onClick={() => setSelected(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(day)
                  }
                }}
                className={`min-h-22 cursor-pointer overflow-hidden border-r border-b border-bd p-1 hover:bg-acs ${
                  isOther ? 'bg-bg text-mu' : ''
                } ${isSelected ? 'outline-2 -outline-offset-2 outline-ac' : ''}`}
              >
                <span
                  className={`inline-flex size-5.5 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? 'bg-ac text-white' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                {events.slice(0, 2).map((e, i) => {
                  const c = chipStyle(e)
                  return (
                    <span
                      key={i}
                      title={c.label}
                      style={c.style}
                      className={`mt-0.5 block truncate rounded-sm px-1.5 py-px text-[10.5px] leading-snug ${c.className} max-md:hidden`}
                    >
                      {c.label}
                    </span>
                  )
                })}
                {events.length > 0 && (
                  <span className="mt-0.5 block size-1.5 rounded-full bg-ac md:hidden" />
                )}
                {events.length > 2 && <span className="block text-[10px] text-mu max-md:hidden">+{events.length - 2} more</span>}
              </div>
            )
          })}
        </div>
        <Legend
          items={[
            { color: 'var(--ac)', label: 'Start' },
            { color: 'var(--s1)', label: 'Action item due' },
            { color: 'var(--s0)', label: 'Deadline, completed' },
            { color: 'var(--s3)', label: 'Deadline, later' },
            { color: 'var(--s1)', label: 'Due within 7 days' },
            { color: 'var(--s2)', label: 'Overdue' },
          ]}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          {fmtDate(selected)}
          {selected === todayIso ? ' (today)' : ''}
        </h3>
        {selectedEvents.length === 0 && <p className="text-mu">No start dates, deadlines or action items on this day.</p>}
        {selectedEvents.map((e, i) => (
          <EventRow key={i} event={e} onEditDates={() => setEditing(e.project)} onOpenTasks={() => navigate('/projects', { state: { openProjectId: e.project.id } })} />
        ))}

        <h3 className="mt-4 mb-2 text-sm font-semibold">Upcoming deadlines</h3>
        {upcoming.length === 0 && <p className="text-mu">No open deadlines.</p>}
        {upcoming.map((p) => {
          const dl = deadlineInfo(p)
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 border-b border-bd py-2">
              <div>
                <span className="mb-0.5 inline-block rounded px-2 py-0.5 text-xs text-white" style={{ background: dl.color }}>{dl.text}</span>
                <div><b>{p.name}</b></div>
                <div className="text-xs text-mu">{fmtDate(p.deadline)} · {p.client}</div>
              </div>
              <Button variant="ghost" onClick={() => setEditing(p)}>Edit dates</Button>
            </div>
          )
        })}
      </div>

      {editing && <ProjectDialog project={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EventRow({ event, onEditDates, onOpenTasks }: { event: CalEvent; onEditDates: () => void; onOpenTasks: () => void }) {
  if (event.kind === 'task') {
    return (
      <div className="flex items-center justify-between gap-2 border-b border-bd py-2">
        <div>
          <span className="mb-0.5 inline-block rounded bg-s1 px-2 py-0.5 text-xs text-white">Task</span>{' '}
          <b>{event.task.text}</b>
          <div className="text-xs text-mu">{event.project.name} · {event.task.owner}{event.task.done ? ' · done' : ''}</div>
        </div>
        <Button variant="ghost" onClick={onOpenTasks}>Open tasks</Button>
      </div>
    )
  }
  const isStart = event.kind === 'start'
  const dl = deadlineInfo(event.project)
  return (
    <div className="flex items-center justify-between gap-2 border-b border-bd py-2">
      <div>
        <span className="mb-0.5 inline-block rounded px-2 py-0.5 text-xs text-white" style={{ background: isStart ? 'var(--ac)' : dl.color }}>
          {isStart ? 'Start' : 'Deadline'}
        </span>{' '}
        <b>{event.project.name}</b>
        <div className="text-xs text-mu">{event.project.client}{isStart ? '' : ` · ${dl.text}`}</div>
      </div>
      <Button variant="ghost" onClick={onEditDates}>Edit dates</Button>
    </div>
  )
}
