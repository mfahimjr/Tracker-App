import { useEffect, useState } from 'react'
import { Button, Card, Stat, Tag, TableScroll, td, th } from '../components/ui'
import { GOOGLE_MAPS_RE, PLACES, PLACE_LABEL, type PlaceKey } from '../lib/constants'
import { fmtDate, fmtDuration, fmtTime, today, toIso } from '../lib/format'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import { useMe } from '../store/useMe'
import type { AttendanceRecord } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

const PLACE_COLOR: Record<PlaceKey, string> = { WFO: 'var(--ac)', WFH: 'var(--s0)', OnSite: 'var(--s1)' }

// Browser location, or the demo location when access is blocked or unavailable.
function currentPosition(): Promise<{ lat: number; lng: number; demo: boolean }> {
  const demo = { lat: 3.139, lng: 101.6869, demo: true }
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(demo)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Number(p.coords.latitude.toFixed(5)), lng: Number(p.coords.longitude.toFixed(5)), demo: false }),
      () => resolve(demo),
      { timeout: 4000 },
    )
  })
}

export default function AttendancePage() {
  const { data, update } = useData()
  const me = useMe()
  const { toast } = useFeedback()
  const [place, setPlace] = useState<PlaceKey>('WFO')
  const [mapLink, setMapLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [mapId, setMapId] = useState<string | null>(null)
  // Ticks once a minute so running durations stay current without reading the clock during render.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const active = data.attendance.find((a) => a.who === me.name && a.tout === null)
  const todayIso = today()
  const hoursToday = data.attendance
    .filter((a) => a.who === me.name && toIso(new Date(a.tin)) === todayIso)
    .reduce((sum, a) => sum + ((a.tout ?? now) - a.tin), 0)

  const rows = data.attendance
    .filter((a) => me.isManager || a.who === me.name)
    .sort((x, y) => y.tin - x.tin)
  const shown: AttendanceRecord | undefined = data.attendance.find((a) => a.id === mapId) ?? active ?? rows[0]

  async function clockIn() {
    const link = mapLink.trim()
    if (place === 'OnSite' && !link) return toast('Paste the Google Maps link of your on-site location.')
    if (link && !GOOGLE_MAPS_RE.test(link)) return toast('Enter a valid Google Maps link, for example https://maps.app.goo.gl/...')

    setBusy(true)
    const pos = await currentPosition()
    setBusy(false)
    if (active) return toast('You are already clocked in.')

    const record: AttendanceRecord = {
      id: newId(),
      who: me.name,
      place,
      tin: Date.now(),
      tout: null,
      lat: pos.lat,
      lng: pos.lng,
      link,
      demo: pos.demo,
    }
    update((d) => ({ ...d, attendance: [...d.attendance, record] }))
    setMapId(record.id)
    setMapLink('')
  }

  function clockOut() {
    if (!active) return
    update((d) => ({
      ...d,
      attendance: d.attendance.map((a) => (a.id === active.id ? { ...a, tout: Date.now() } : a)),
    }))
    setMapId(active.id)
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <Stat label="Status" value={active ? 'Clocked in' : 'Clocked out'} small />
        <Stat label="Working place" value={active ? PLACE_LABEL[active.place] : '-'} small />
        <Stat label="Hours today" value={fmtDuration(hoursToday)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <div>
          <Card>
            <h3 className="mb-2 text-sm font-semibold">Clock in / out</h3>
            {active ? (
              <>
                <p className="mb-2.5">
                  Clocked in at <b>{fmtTime(active.tin)}</b> · {PLACE_LABEL[active.place]}
                  {active.link && (
                    <>
                      {' '}· <a href={active.link} target="_blank" rel="noopener noreferrer">Location</a>
                    </>
                  )}
                </p>
                <Button variant="primary" onClick={clockOut}>Clock out</Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-mu" htmlFor="place">Working place</label>
                <select
                  id="place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value as PlaceKey)}
                  className="rounded-md border border-bd bg-card px-2.5 py-2"
                >
                  {PLACES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
                <label className="text-xs font-medium text-mu" htmlFor="maplink">Location (Google Maps link)</label>
                <input
                  id="maplink"
                  placeholder="https://maps.app.goo.gl/..."
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  className="rounded-md border border-bd bg-card px-2.5 py-2"
                />
                <p className="text-xs text-mu">Required for On site. Optional for Office and Home.</p>
                <div>
                  <Button variant="primary" disabled={busy} onClick={() => void clockIn()}>
                    {busy ? 'Locating…' : 'Clock in'}
                  </Button>
                </div>
                <p className="text-xs text-mu">
                  Your location is recorded when you clock in. If location access is blocked, a demo location is used.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">Attendance history</h3>
            <TableScroll>
              <table className="w-full min-w-190 border-collapse">
                <thead>
                  <tr>
                    {[...(me.isManager ? ['Employee'] : []), 'Date', 'Place', 'Location', 'In', 'Out', 'Duration', ''].map((h, i) => (
                      <th key={i} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={me.isManager ? 9 : 8} className="py-3 text-mu">No attendance yet.</td></tr>
                  )}
                  {rows.map((a) => (
                    <tr key={a.id}>
                      {me.isManager && <td className={td}>{a.who}</td>}
                      <td className={td}>{fmtDate(toIso(new Date(a.tin)))}</td>
                      <td className={td}><Tag color={PLACE_COLOR[a.place]}>{PLACE_LABEL[a.place]}</Tag></td>
                      <td className={td}>
                        {a.link ? <a href={a.link} target="_blank" rel="noopener noreferrer">Google Maps</a> : <span className="text-mu">-</span>}
                      </td>
                      <td className={td}>{fmtTime(a.tin)}</td>
                      <td className={td}>{a.tout ? fmtTime(a.tout) : <Tag color="var(--s0)">Active</Tag>}</td>
                      <td className={td}>{fmtDuration((a.tout ?? now) - a.tin)}</td>
                      <td className={td}><Button variant="ghost" onClick={() => setMapId(a.id)}>Map</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Card>
        </div>

        <Card>
          <h3 className="mb-2 text-sm font-semibold">Location</h3>
          {shown ? (
            <>
              <MapPreview />
              <p className="mt-2"><b>{shown.who}</b> · {fmtDate(toIso(new Date(shown.tin)))} {fmtTime(shown.tin)} · {PLACE_LABEL[shown.place]}</p>
              <p className="text-xs text-mu">{shown.lat}, {shown.lng}{shown.demo ? ' (demo location)' : ''}</p>
              <p className="mt-1.5">
                <a
                  href={shown.link || `https://www.google.com/maps?q=${shown.lat},${shown.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>
            </>
          ) : (
            <p className="text-mu">Clock in to record a location.</p>
          )}
        </Card>
      </div>
    </>
  )
}

// Stylised map placeholder from the prototype. Swap for a real map tile source later.
function MapPreview() {
  return (
    <svg viewBox="0 0 300 180" className="block w-full rounded-md border border-bd" role="img" aria-label="Map showing the clock-in location">
      <rect width="300" height="180" style={{ fill: 'var(--bg)' }} />
      <g style={{ stroke: 'var(--bd)', fill: 'none' }}>
        <path d="M0 120 L300 70" strokeWidth="7" />
        <path d="M90 0 L130 180" strokeWidth="7" />
        <path d="M200 0 L180 180" strokeWidth="5" />
        <path d="M0 40 L300 150" strokeWidth="3" />
      </g>
      <circle cx="150" cy="100" r="24" style={{ fill: 'var(--ac)' }} opacity=".18" />
      <g transform="translate(150 100)">
        <path d="M0 0 C-14 -16 -14 -36 0 -36 C14 -36 14 -16 0 0Z" style={{ fill: 'var(--s2)' }} />
        <circle cy="-24" r="5" fill="#fff" />
      </g>
    </svg>
  )
}
