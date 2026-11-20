import { useState } from 'react'
import { Button, Card, Modal, TableScroll, td, th } from '../components/ui'
import { EPF_RATE, SOCSO_EIS_SEN, TEAM } from '../lib/constants'
import { MONTHS, money } from '../lib/format'
import { useMe } from '../store/useMe'

// Monthly basic pay and allowances in sen. Demo figures from the prototype.
const PAY: Record<string, { basic: number; allowance: number }> = {
  'Aina Rahman': { basic: 650000, allowance: 50000 },
  'Daniel Lee': { basic: 520000, allowance: 30000 },
  'Siti Noor': { basic: 480000, allowance: 30000 },
}

interface Slip {
  name: string
  year: number
  month: number
  basic: number
  allowance: number
  epf: number
  socso: number
  deductions: number
  net: number
}

function slipFor(name: string, year: number, month: number): Slip {
  const p = PAY[name]
  const epf = Math.round(p.basic * EPF_RATE)
  const deductions = epf + SOCSO_EIS_SEN
  return {
    name,
    year,
    month,
    basic: p.basic,
    allowance: p.allowance,
    epf,
    socso: SOCSO_EIS_SEN,
    deductions,
    net: p.basic + p.allowance - deductions,
  }
}

export default function PayrollPage() {
  const me = useMe()
  // Read the date once per visit, not on every render.
  const [clock] = useState(() => new Date())
  const thisYear = clock.getFullYear()
  const [year, setYear] = useState(thisYear)
  const [month, setMonth] = useState('all')
  const [employee, setEmployee] = useState('all')
  const [slip, setSlip] = useState<Slip | null>(null)

  // Earlier years show all twelve months; the current year stops at the current month.
  const lastMonth = year < thisYear ? 11 : clock.getMonth()
  const months = month === 'all' ? Array.from({ length: lastMonth + 1 }, (_, i) => i) : Number(month) <= lastMonth ? [Number(month)] : []
  const names = me.isManager ? (employee === 'all' ? TEAM.filter((n) => n in PAY) : [employee]) : [me.name].filter((n) => n in PAY)

  const list: Slip[] = []
  for (const name of names) for (const m of months) list.push(slipFor(name, year, m))
  list.sort((a, b) => b.month - a.month || a.name.localeCompare(b.name))
  const total = list.reduce((sum, s) => sum + s.net, 0)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-mu">Filter by year and month, then open a sample payslip.</p>
        <div className="flex flex-wrap gap-1.5">
          {me.isManager && (
            <select aria-label="Employee" value={employee} onChange={(e) => setEmployee(e.target.value)} className="rounded-md border border-bd bg-card px-2 py-1.5">
              <option value="all">All employees</option>
              {TEAM.filter((n) => n in PAY).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}
          <select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-bd bg-card px-2 py-1.5">
            {[thisYear, thisYear - 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-bd bg-card px-2 py-1.5">
            <option value="all">All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <TableScroll>
          <table className="w-full min-w-160 border-collapse">
            <thead>
              <tr>
                {['Period', ...(me.isManager ? ['Employee'] : []), 'Basic', 'Allowances', 'Deductions', 'Net pay', ''].map((h, i) => (
                  <th key={i} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={me.isManager ? 7 : 6} className="py-3 text-mu">No payslips for this selection.</td></tr>
              )}
              {list.map((s) => (
                <tr key={`${s.name}-${s.month}`}>
                  <td className={td}>{MONTHS[s.month]} {s.year}</td>
                  {me.isManager && <td className={td}>{s.name}</td>}
                  <td className={td}>{money(s.basic)}</td>
                  <td className={td}>{money(s.allowance)}</td>
                  <td className={td}>{money(s.deductions)}</td>
                  <td className={td}><b>{money(s.net)}</b></td>
                  <td className={td}><Button variant="ghost" onClick={() => setSlip(s)}>Payslip</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        {list.length > 0 && (
          <p className="mt-2.5 text-xs text-mu">
            Total net pay for this selection: <b>{money(total)}</b>. Sample figures only.
          </p>
        )}
      </Card>

      {slip && (
        <Modal title="Payslip" onClose={() => setSlip(null)}>
          <PayslipView slip={slip} />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setSlip(null)}>Close</Button>
            <Button variant="primary" onClick={() => window.print()}>Print / Save as PDF</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

function PayslipView({ slip }: { slip: Slip }) {
  const row = (label: string, value: number, strong = false) => (
    <tr className={strong ? 'font-bold' : ''}>
      <td className="border-b border-bd py-1.5">{label}</td>
      <td className="border-b border-bd py-1.5 text-right">{money(value)}</td>
    </tr>
  )
  return (
    <div>
      <p className="text-sm text-mu">{MONTHS[slip.month]} {slip.year}</p>
      <p className="mb-3"><b>{slip.name}</b></p>
      <h4 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-mu uppercase">Earnings</h4>
      <table className="w-full border-collapse">
        <tbody>
          {row('Basic salary', slip.basic)}
          {row('Allowances', slip.allowance)}
        </tbody>
      </table>
      <h4 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-mu uppercase">Deductions</h4>
      <table className="w-full border-collapse">
        <tbody>
          {row('EPF (11%)', slip.epf)}
          {row('SOCSO & EIS', slip.socso)}
        </tbody>
      </table>
      <table className="mt-3 w-full border-collapse">
        <tbody>{row('Net pay', slip.net, true)}</tbody>
      </table>
      <p className="mt-3 text-xs text-mu">Sample payslip generated by the Tracker demo. Figures are illustrative only.</p>
    </div>
  )
}
