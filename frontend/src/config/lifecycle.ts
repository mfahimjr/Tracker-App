// Shared with the backend enums (App\Enums). Keep the order and keys in sync with CLAUDE.md.

export const STAGES = [
  'POC Agreement',
  'Fact Finding',
  'Requirement Mapping',
  'Workflow Presentation',
  'Immersion',
  'Solution Training',
  'Finetuning',
  'Lunch&Learn',
  'Post L&L',
  'CFA Paper',
] as const

export const STAGE_STATUSES = ['Complete', 'In progress', 'On hold', 'Not started', 'Not set'] as const

export type StageStatus = (typeof STAGE_STATUSES)[number]
