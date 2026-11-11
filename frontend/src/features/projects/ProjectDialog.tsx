import { FormDialog, type FieldDef, type FormValues } from '../../components/FormDialog'
import { STAGES, STAGE_STATUSES } from '../../config/lifecycle'
import { today } from '../../lib/format'
import { newId } from '../../store/demo'
import { useData } from '../../store/useData'
import type { Project } from '../../store/types'

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Project name' },
  { key: 'client', label: 'Client / organisation' },
  { key: 'start', label: 'Start date', type: 'date' },
  { key: 'deadline', label: 'Deadline', type: 'date' },
  { key: 'stages', label: 'Lifecycle status per stage', type: 'stages', options: STAGE_STATUSES, stageOptions: STAGES },
]

// Create or edit a project. Used by the Projects page and the dashboard calendar.
export function ProjectDialog({ project, onClose }: { project?: Project; onClose: () => void }) {
  const { update } = useData()

  function save(values: FormValues) {
    const name = String(values.name).trim()
    const start = String(values.start) || null
    const deadline = String(values.deadline) || null
    if (!name) return 'Enter a project name.'
    if (start && deadline && deadline < start) return 'The deadline cannot be before the start date.'

    const fields = {
      name,
      client: String(values.client).trim(),
      start,
      deadline,
      stages: values.stages as number[],
    }
    update((d) => ({
      ...d,
      projects: project
        ? d.projects.map((p) => (p.id === project.id ? { ...p, ...fields } : p))
        : [...d.projects, { id: newId(), ...fields, tasks: [] }],
    }))
    onClose()
  }

  return (
    <FormDialog
      title={project ? 'Edit project' : 'New project'}
      fields={FIELDS}
      initial={
        project
          ? { name: project.name, client: project.client, start: project.start ?? '', deadline: project.deadline ?? '', stages: project.stages }
          : { start: today() }
      }
      onSubmit={save}
      onClose={onClose}
    />
  )
}
