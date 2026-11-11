import { STAGES, STAGE_STATUSES } from '../../config/lifecycle'
import { daysTo } from '../../lib/format'
import type { Project } from '../../store/types'

// A project is complete when every stage is Complete (status index 0).
export const isProjectDone = (p: Project) => p.stages.every((s) => s === 0)

// Deadline indicator text and colour, as in the prototype's dlInfo().
export function deadlineInfo(p: Project): { text: string; color: string } {
  if (!p.deadline) return { text: 'No deadline', color: 'var(--s3)' }
  if (isProjectDone(p)) return { text: 'Completed', color: 'var(--s0)' }
  const n = daysTo(p.deadline)
  const abs = Math.abs(n)
  const unit = abs === 1 ? ' day' : ' days'
  if (n < 0) return { text: abs + unit + ' overdue', color: 'var(--s2)' }
  if (n === 0) return { text: 'Due today', color: 'var(--s1)' }
  return { text: n + unit + ' left', color: n <= 7 ? 'var(--s1)' : 'var(--s3)' }
}

// The stage the project is "now at": the first In progress or On hold stage, otherwise the first
// stage not yet started, otherwise the last stage.
export function currentStageIndex(p: Project) {
  let k = p.stages.findIndex((s) => s === 1 || s === 2)
  if (k < 0) k = p.stages.findIndex((s) => s >= 3)
  if (k < 0) k = STAGES.length - 1
  return k
}

export const stageStatusName = (s: number) => STAGE_STATUSES[s]
export const stageName = (i: number) => STAGES[i]
