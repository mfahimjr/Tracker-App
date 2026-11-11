import { useState } from 'react'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, Stat, Tag, TableScroll, td, th } from '../components/ui'
import {
  INVOICE_STATUSES,
  SUBSCRIPTION_CYCLES,
  SUBSCRIPTION_STATUSES,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../lib/constants'
import { fmtDate, money, today, toSen } from '../lib/format'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import type { Invoice, Subscription, Transaction } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

const STATUS_COLOR: Record<string, string> = {
  Paid: 'var(--s0)',
  Completed: 'var(--s0)',
  Active: 'var(--s0)',
  Income: 'var(--s0)',
  Overdue: 'var(--s2)',
  Failed: 'var(--s2)',
  Pending: 'var(--s1)',
  Paused: 'var(--s1)',
  Cancelled: 'var(--s3)',
  Expense: 'var(--s3)',
}

const CYCLE_DIVISOR: Record<Subscription['cycle'], number> = { Monthly: 1, Quarterly: 3, Yearly: 12 }

type Editing<T> = { item?: T } | null

export default function BillingPage() {
  const { data, update } = useData()
  const { confirm } = useFeedback()
  const [invoiceDialog, setInvoiceDialog] = useState<Editing<Invoice>>(null)
  const [subDialog, setSubDialog] = useState<Editing<Subscription>>(null)
  const [txDialog, setTxDialog] = useState<Editing<Transaction>>(null)
  const [days, setDays] = useState(20)
  const [rate, setRate] = useState(900)
  const [other, setOther] = useState(2000)

  const projectNames = data.projects.map((p) => p.name)
  const monthlySubs = data.subscriptions
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => sum + s.amountSen / CYCLE_DIVISOR[s.cycle], 0)
  const outstanding = data.invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + i.amountSen, 0)
  const transactions = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date))

  const invoiceFields: FieldDef[] = [
    { key: 'no', label: 'Invoice no.' },
    { key: 'project', label: 'Project', type: 'select', options: projectNames },
    { key: 'amount', label: 'Amount (RM)', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: INVOICE_STATUSES },
    { key: 'file', label: 'Invoice file (PDF/image)', type: 'file' },
  ]
  const subFields: FieldDef[] = [
    { key: 'name', label: 'Subscription' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'amount', label: 'Amount (RM)', type: 'number' },
    { key: 'cycle', label: 'Billing cycle', type: 'select', options: SUBSCRIPTION_CYCLES },
    { key: 'nextBilling', label: 'Next billing date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: SUBSCRIPTION_STATUSES },
  ]
  const txFields: FieldDef[] = [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'description', label: 'Description' },
    { key: 'project', label: 'Project', type: 'select', options: ['General', ...projectNames] },
    { key: 'type', label: 'Type', type: 'select', options: TRANSACTION_TYPES },
    { key: 'amount', label: 'Amount (RM)', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: TRANSACTION_STATUSES },
  ]

  function saveInvoice(values: FormValues) {
    const no = String(values.no).trim()
    if (!no) return 'Enter the invoice number.'
    const duplicate = data.invoices.some((i) => i.no === no && i.id !== invoiceDialog?.item?.id)
    if (duplicate) return 'That invoice number is already in use.'
    const invoice: Invoice = {
      id: invoiceDialog?.item?.id ?? newId(),
      no,
      project: String(values.project),
      amountSen: toSen(Number(values.amount)),
      status: String(values.status) as Invoice['status'],
      file: typeof values.file === 'string' ? values.file : (invoiceDialog?.item?.file ?? null),
    }
    update((d) => ({
      ...d,
      invoices: invoiceDialog?.item ? d.invoices.map((i) => (i.id === invoice.id ? invoice : i)) : [...d.invoices, invoice],
    }))
    setInvoiceDialog(null)
  }

  function saveSub(values: FormValues) {
    if (!String(values.name).trim()) return 'Enter the subscription name.'
    const sub: Subscription = {
      id: subDialog?.item?.id ?? newId(),
      name: String(values.name).trim(),
      vendor: String(values.vendor).trim(),
      amountSen: toSen(Number(values.amount)),
      cycle: String(values.cycle) as Subscription['cycle'],
      nextBilling: String(values.nextBilling),
      status: String(values.status) as Subscription['status'],
    }
    update((d) => ({
      ...d,
      subscriptions: subDialog?.item ? d.subscriptions.map((s) => (s.id === sub.id ? sub : s)) : [...d.subscriptions, sub],
    }))
    setSubDialog(null)
  }

  function saveTx(values: FormValues) {
    if (!String(values.description).trim()) return 'Enter a description.'
    const tx: Transaction = {
      id: txDialog?.item?.id ?? newId(),
      date: String(values.date),
      description: String(values.description).trim(),
      project: String(values.project),
      type: String(values.type) as Transaction['type'],
      amountSen: toSen(Number(values.amount)),
      status: String(values.status) as Transaction['status'],
    }
    update((d) => ({
      ...d,
      transactions: txDialog?.item ? d.transactions.map((t) => (t.id === tx.id ? tx : t)) : [...d.transactions, tx],
    }))
    setTxDialog(null)
  }

  async function removeInvoice(i: Invoice) {
    if (!(await confirm(`Delete invoice ${i.no}?`))) return
    update((d) => ({ ...d, invoices: d.invoices.filter((x) => x.id !== i.id) }))
  }
  async function removeSub(s: Subscription) {
    if (!(await confirm(`Delete the subscription "${s.name}"?`))) return
    update((d) => ({ ...d, subscriptions: d.subscriptions.filter((x) => x.id !== s.id) }))
  }
  async function removeTx(t: Transaction) {
    if (!(await confirm('Delete this transaction?'))) return
    update((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== t.id) }))
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <Stat label="Outstanding billing" value={money(outstanding)} small />
        <Stat label="Active subscriptions / month" value={money(monthlySubs)} small />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Invoices</h3>
          <Button variant="primary" onClick={() => setInvoiceDialog({})}>+ Add invoice</Button>
        </div>
        <TableScroll>
          <table className="w-full min-w-150 border-collapse">
            <thead>
              <tr>
                {['No.', 'Project', 'Amount', 'File', 'Status', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((i) => (
                <tr key={i.id}>
                  <td className={td}>{i.no}</td>
                  <td className={td}>{i.project}</td>
                  <td className={td}>{money(i.amountSen)}</td>
                  <td className={td}>{i.file ?? <span className="text-mu">none</span>}</td>
                  <td className={td}><Tag color={STATUS_COLOR[i.status]}>{i.status}</Tag></td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => setInvoiceDialog({ item: i })}>Edit</Button>
                    <Button variant="danger" onClick={() => void removeInvoice(i)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Subscriptions</h3>
          <Button variant="primary" onClick={() => setSubDialog({})}>+ Add subscription</Button>
        </div>
        <TableScroll>
          <table className="w-full min-w-170 border-collapse">
            <thead>
              <tr>
                {['Subscription', 'Vendor', 'Amount', 'Cycle', 'Next billing', 'Status', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.length === 0 && (
                <tr><td colSpan={7} className="py-3 text-mu">No subscriptions yet.</td></tr>
              )}
              {data.subscriptions.map((s) => (
                <tr key={s.id}>
                  <td className={td}><b>{s.name}</b></td>
                  <td className={td}>{s.vendor || <span className="text-mu">-</span>}</td>
                  <td className={td}>{money(s.amountSen)}</td>
                  <td className={td}>{s.cycle}</td>
                  <td className={td}>{fmtDate(s.nextBilling)}</td>
                  <td className={td}><Tag color={STATUS_COLOR[s.status]}>{s.status}</Tag></td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => setSubDialog({ item: s })}>Edit</Button>
                    <Button variant="danger" onClick={() => void removeSub(s)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="mt-2.5 text-xs text-mu">Active subscriptions cost about <b>{money(monthlySubs)}</b> per month.</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Transactions</h3>
          <Button variant="primary" onClick={() => setTxDialog({})}>+ Add transaction</Button>
        </div>
        <TableScroll>
          <table className="w-full min-w-190 border-collapse">
            <thead>
              <tr>
                {['Date', 'Description', 'Project', 'Type', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="py-3 text-mu">No transactions yet.</td></tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className={td}>{fmtDate(t.date)}</td>
                  <td className={td}>{t.description}</td>
                  <td className={td}>{t.project}</td>
                  <td className={td}><Tag color={STATUS_COLOR[t.type]}>{t.type}</Tag></td>
                  <td className={td}>{t.type === 'Expense' ? '- ' : '+ '}{money(t.amountSen)}</td>
                  <td className={td}><Tag color={STATUS_COLOR[t.status]}>{t.status}</Tag></td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => setTxDialog({ item: t })}>Edit</Button>
                    <Button variant="danger" onClick={() => void removeTx(t)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Costing calculator</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
          <NumberField label="Man-days" value={days} onChange={setDays} />
          <NumberField label="Rate (RM/day)" value={rate} onChange={setRate} />
          <NumberField label="Other costs (RM)" value={other} onChange={setOther} />
        </div>
        <div className="mt-3 text-mu">Total</div>
        <div className="text-3xl font-bold">RM {(days * rate + other).toLocaleString()}</div>
      </Card>

      {invoiceDialog && (
        <FormDialog
          title={invoiceDialog.item ? 'Edit invoice' : 'New invoice'}
          fields={invoiceFields}
          initial={
            invoiceDialog.item
              ? { no: invoiceDialog.item.no, project: invoiceDialog.item.project, amount: invoiceDialog.item.amountSen / 100, status: invoiceDialog.item.status, file: invoiceDialog.item.file }
              : { project: projectNames[0] ?? '', status: 'Pending' }
          }
          onSubmit={saveInvoice}
          onClose={() => setInvoiceDialog(null)}
        />
      )}
      {subDialog && (
        <FormDialog
          title={subDialog.item ? 'Edit subscription' : 'New subscription'}
          fields={subFields}
          initial={
            subDialog.item
              ? { name: subDialog.item.name, vendor: subDialog.item.vendor, amount: subDialog.item.amountSen / 100, cycle: subDialog.item.cycle, nextBilling: subDialog.item.nextBilling, status: subDialog.item.status }
              : { cycle: 'Monthly', status: 'Active', nextBilling: today() }
          }
          onSubmit={saveSub}
          onClose={() => setSubDialog(null)}
        />
      )}
      {txDialog && (
        <FormDialog
          title={txDialog.item ? 'Edit transaction' : 'New transaction'}
          fields={txFields}
          initial={
            txDialog.item
              ? { date: txDialog.item.date, description: txDialog.item.description, project: txDialog.item.project, type: txDialog.item.type, amount: txDialog.item.amountSen / 100, status: txDialog.item.status }
              : { date: today(), type: 'Income', status: 'Completed', project: 'General' }
          }
          onSubmit={saveTx}
          onClose={() => setTxDialog(null)}
        />
      )}
    </>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const id = `calc-${label}`
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-mu">{label}</label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-bd bg-card px-2.5 py-2"
      />
    </div>
  )
}
