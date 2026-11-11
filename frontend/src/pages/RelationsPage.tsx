import { useState } from 'react'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, TableScroll, td, th } from '../components/ui'
import { CONTACT_GROUPS } from '../lib/constants'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import type { Contact } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

const FIELDS: FieldDef[] = [
  { key: 'group', label: 'Group', type: 'select', options: CONTACT_GROUPS },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'phone', label: 'Contact number' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'email', label: 'Email', type: 'email' },
]

export default function RelationsPage() {
  const { data, update } = useData()
  const { confirm } = useFeedback()
  const [group, setGroup] = useState<Contact['group']>('Staff')
  const [editing, setEditing] = useState<Contact | 'new' | null>(null)

  const rows = data.contacts.filter((c) => c.group === group)

  function save(values: FormValues, existing: Contact | null) {
    if (!String(values.name).trim()) return 'Enter a name.'
    const contact: Contact = {
      id: existing?.id ?? newId(),
      group: String(values.group) as Contact['group'],
      name: String(values.name).trim(),
      designation: String(values.designation).trim(),
      phone: String(values.phone).trim(),
      organisation: String(values.organisation).trim(),
      email: String(values.email).trim(),
    }
    update((d) => ({
      ...d,
      contacts: existing ? d.contacts.map((c) => (c.id === contact.id ? contact : c)) : [...d.contacts, contact],
    }))
    setGroup(contact.group)
    setEditing(null)
  }

  async function remove(c: Contact) {
    if (!(await confirm(`Delete ${c.name} from contacts?`))) return
    update((d) => ({ ...d, contacts: d.contacts.filter((x) => x.id !== c.id) }))
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {CONTACT_GROUPS.map((g) => (
            <Button key={g} variant={g === group ? 'primary' : 'default'} onClick={() => setGroup(g)}>
              {g}
            </Button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setEditing('new')}>Add contact</Button>
      </div>

      <Card>
        <TableScroll>
          <table className="w-full min-w-175 border-collapse">
            <thead>
              <tr>
                {['Name', 'Designation', 'Contact', 'Organisation', 'Email', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-mu">No contacts yet.</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className={td}><b>{c.name}</b></td>
                  <td className={td}>{c.designation}</td>
                  <td className={td}>{c.phone}</td>
                  <td className={td}>{c.organisation}</td>
                  <td className={td}>{c.email}</td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
                    <Button variant="danger" onClick={() => void remove(c)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {editing && (
        <FormDialog
          title={editing === 'new' ? 'Add contact' : 'Edit contact'}
          fields={FIELDS}
          initial={editing === 'new' ? { group } : { ...editing }}
          onSubmit={(values) => save(values, editing === 'new' ? null : editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
