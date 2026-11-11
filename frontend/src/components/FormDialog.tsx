import { useState, type FormEvent } from 'react'
import { Button, Modal } from './ui'

export type FormValue = string | number | boolean | number[] | File | null
export type FormValues = Record<string, FormValue>

export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'email' | 'date' | 'number' | 'datetime' | 'area' | 'select' | 'check' | 'file' | 'stages'
  options?: readonly string[]
  // Stage options for type "stages": index into the status list.
  stageOptions?: readonly string[]
}

interface Props {
  title: string
  fields: FieldDef[]
  initial?: Partial<FormValues>
  submitLabel?: string
  // Return an error message to keep the dialog open, or nothing to let the caller close it.
  onSubmit: (values: FormValues) => string | void
  onClose: () => void
}

function defaultFor(f: FieldDef): FormValue {
  if (f.type === 'check') return false
  if (f.type === 'stages') return Array.from({ length: f.stageOptions?.length ?? 0 }, () => 4)
  if (f.type === 'select') return f.options?.[0] ?? ''
  if (f.type === 'file') return null
  if (f.type === 'number') return 0
  return ''
}

export function FormDialog({ title, fields, initial = {}, submitLabel = 'Save', onSubmit, onClose }: Props) {
  const [values, setValues] = useState<FormValues>(() => {
    const v: FormValues = {}
    for (const f of fields) v[f.key] = initial[f.key] ?? defaultFor(f)
    return v
  })
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: FormValue) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const message = onSubmit(values)
    if (message) setError(message)
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {fields.map((f) => (
          <Field key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
        ))}
        {error && (
          <p role="alert" className="text-sm text-s2">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const CONTROL = 'mt-1 w-full rounded-md border border-bd bg-card px-2.5 py-2 text-tx'

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: FormValue | undefined
  onChange: (v: FormValue) => void
}) {
  const id = `field-${field.key}`
  const label = <label htmlFor={id} className="text-xs font-medium text-mu">{field.label}</label>

  if (field.type === 'check') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    )
  }

  if (field.type === 'stages') {
    const list = Array.isArray(value) ? value : []
    return (
      <fieldset>
        <legend className="text-xs font-medium text-mu">{field.label}</legend>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          {(field.stageOptions ?? []).map((name, i) => (
            <div key={name}>
              <label htmlFor={`${id}-${i}`} className="text-xs text-mu">{name}</label>
              <select
                id={`${id}-${i}`}
                value={list[i] ?? 4}
                onChange={(e) => {
                  const next = [...list]
                  next[i] = Number(e.target.value)
                  onChange(next)
                }}
                className={CONTROL}
              >
                {(field.options ?? []).map((s, j) => (
                  <option key={s} value={j}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </fieldset>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select id={id} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={CONTROL}>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'area') {
    return (
      <div>
        {label}
        <textarea id={id} rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={CONTROL} />
      </div>
    )
  }

  if (field.type === 'file') {
    return (
      <div>
        {label}
        <input
          id={id}
          type="file"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
        {typeof value === 'string' && value && <p className="mt-1 text-xs text-mu">Current: {value}</p>}
        {value instanceof File && <p className="mt-1 text-xs text-mu">Selected: {value.name}</p>}
      </div>
    )
  }

  const inputType = field.type === 'datetime' ? 'datetime-local' : field.type ?? 'text'
  return (
    <div>
      {label}
      <input
        id={id}
        type={inputType}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        className={CONTROL}
      />
    </div>
  )
}
