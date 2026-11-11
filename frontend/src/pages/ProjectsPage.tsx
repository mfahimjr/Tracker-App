import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, Tag, TableScroll, td, th } from '../components/ui'
import { ProjectDialog } from '../features/projects/ProjectDialog'
import { currentStageIndex, deadlineInfo, stageName, stageStatusName } from '../features/projects/deadline'
import { TEAM } from '../lib/constants'
import { daysTo, fmtDate } from '../lib/format'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import type { Project, Task } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

const STATUS_COLOR = ['var(--s0)', 'var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']

const TASK_FIELDS: FieldDef[] = [
  { key: 'text', label: 'Action item' },
  { key: 'owner', label: 'Owner', type: 'select', options: TEAM },
  { key: 'due', label: 'Due date', type: 'date' },
  { key: 'done', label: 'Completed', type: 'check' },
]

export default function ProjectsPage() {
  // The dashboard calendar links here with the project to open (see CalendarPanel).
  const location = useLocation()
  const [openId, setOpenId] = useState<string | null>(
    (location.state as { openProjectId?: string } | null)?.openProjectId ?? null,
  )
  const [editing, setEditing] = useState<Project | 'new' | null>(null)
  const { data } = useData()

  const open = data.projects.find((p) => p.id === openId)
  if (open) return <ProjectDetail project={open} onBack={() => setOpenId(null)} />

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-mu">
          Track what needs doing for every project. Start dates, deadlines and action item due dates appear on the dashboard calendar.
        </p>
        <Button variant="primary" onClick={() => setEditing('new')}>
          + New project
        </Button>
      </div>

      <Card>
        <TableScroll>
          <table className="w-full min-w-250 border-collapse">
            <thead>
              <tr>
                {['Project', 'Client', 'Start', 'Deadline', 'Time left', 'Now at', 'Status', 'Action items', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => {
                const k = currentStageIndex(p)
                const dl = deadlineInfo(p)
                const done = p.tasks.filter((t) => t.done).length
                return (
                  <tr key={p.id}>
                    <td className={td}><b>{p.name}</b></td>
                    <td className={td}>{p.client}</td>
                    <td className={td}>{fmtDate(p.start)}</td>
                    <td className={td}>{fmtDate(p.deadline)}</td>
                    <td className={td}><Tag color={dl.color}>{dl.text}</Tag></td>
                    <td className={td}>{stageName(k)}</td>
                    <td className={td}><Tag color={STATUS_COLOR[p.stages[k]]}>{stageStatusName(p.stages[k])}</Tag></td>
                    <td className={td}>
                      <Button variant="ghost" onClick={() => setOpenId(p.id)}>{done}/{p.tasks.length} done</Button>
                    </td>
                    <td className={td + ' whitespace-nowrap'}>
                      <Button variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                      <CalendarLink projectId={p.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {editing && (
        <ProjectDialog project={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function CalendarLink({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  return (
    <Button variant="ghost" onClick={() => navigate('/', { state: { focusProjectId: projectId } })}>
      Calendar
    </Button>
  )
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const { update } = useData()
  const { confirm } = useFeedback()
  const [taskDialog, setTaskDialog] = useState<{ task?: Task } | null>(null)
  const done = project.tasks.filter((t) => t.done).length
  const pct = project.tasks.length ? (done / project.tasks.length) * 100 : 0

  function replaceTasks(tasks: Task[]) {
    update((d) => ({ ...d, projects: d.projects.map((p) => (p.id === project.id ? { ...p, tasks } : p)) }))
  }

  async function remove(task: Task) {
    if (!(await confirm(`Delete the action item "${task.text}"?`))) return
    replaceTasks(project.tasks.filter((t) => t.id !== task.id))
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Button variant="ghost" onClick={onBack}>← Projects</Button>{' '}
          <b>{project.name}</b> <span className="text-mu">· {done}/{project.tasks.length} done</span>
        </div>
        <Button variant="primary" onClick={() => setTaskDialog({})}>+ Action item</Button>
      </div>

      <div className="mb-3 h-3.5 overflow-hidden rounded-sm bg-s4">
        <div className="h-full bg-s0" style={{ width: `${pct}%` }} />
      </div>

      <Card>
        <TableScroll>
          <table className="w-full min-w-160 border-collapse">
            <thead>
              <tr>
                {['', 'Action item', 'Owner', 'Due', 'Status', ''].map((h, i) => (
                  <th key={i} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.tasks.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-mu">No action items yet. Add the first one.</td></tr>
              )}
              {project.tasks.map((t) => {
                const status = t.done
                  ? { text: 'Done', color: 'var(--s0)' }
                  : t.due && daysTo(t.due) < 0
                    ? { text: 'Overdue', color: 'var(--s2)' }
                    : { text: 'Open', color: 'var(--s3)' }
                return (
                  <tr key={t.id}>
                    <td className={td}>
                      <input
                        type="checkbox"
                        aria-label="Mark done"
                        checked={t.done}
                        className="size-4.5"
                        onChange={(e) =>
                          replaceTasks(project.tasks.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x)))
                        }
                      />
                    </td>
                    <td className={td}>{t.text}</td>
                    <td className={td}>{t.owner}</td>
                    <td className={td}>{fmtDate(t.due)}</td>
                    <td className={td}><Tag color={status.color}>{status.text}</Tag></td>
                    <td className={td + ' whitespace-nowrap'}>
                      <Button variant="ghost" onClick={() => setTaskDialog({ task: t })}>Edit</Button>
                      <Button variant="danger" onClick={() => void remove(t)}>Delete</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {taskDialog && (
        <FormDialog
          title={taskDialog.task ? 'Edit action item' : 'New action item'}
          fields={TASK_FIELDS}
          initial={
            taskDialog.task
              ? { text: taskDialog.task.text, owner: taskDialog.task.owner, due: taskDialog.task.due ?? '', done: taskDialog.task.done }
              : { owner: TEAM[0], due: '', done: false }
          }
          onClose={() => setTaskDialog(null)}
          onSubmit={(values: FormValues) => {
            const text = String(values.text).trim()
            if (!text) return 'Enter the action item.'
            const task: Task = {
              id: taskDialog.task?.id ?? newId(),
              text,
              owner: String(values.owner),
              due: String(values.due) || null,
              done: Boolean(values.done),
            }
            replaceTasks(
              taskDialog.task
                ? project.tasks.map((t) => (t.id === task.id ? task : t))
                : [...project.tasks, task],
            )
            setTaskDialog(null)
          }}
        />
      )}
    </>
  )
}
