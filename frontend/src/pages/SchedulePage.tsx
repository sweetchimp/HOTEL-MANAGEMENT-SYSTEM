import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { StaffMember } from '../types'

type ShiftType = 'OFF' | 'MORNING' | 'AFTERNOON' | 'NIGHT'

const SHIFT_COLORS: Record<ShiftType, string> = {
  OFF: 'bg-surface-100 text-surface-400',
  MORNING: 'bg-yellow-100 text-yellow-800',
  AFTERNOON: 'bg-blue-100 text-blue-800',
  NIGHT: 'bg-indigo-100 text-indigo-800',
}

const SHIFT_LABELS: Record<ShiftType, string> = {
  OFF: 'Off',
  MORNING: 'AM',
  AFTERNOON: 'PM',
  NIGHT: 'Night',
}

export default function SchedulePage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [schedule, setSchedule] = useState<Record<string, ShiftType>>({})

  useEffect(() => {
    loadStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadStaff() {
    setLoading(true)
    const res = await api.get<StaffMember[]>('/staff')
    if (res.success && res.data) {
      setStaff(res.data)
      initSchedule(res.data)
    } else {
      setError(res.error || 'Failed to load staff')
    }
    setLoading(false)
  }

  function initSchedule(staffList: StaffMember[]) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const sched: Record<string, ShiftType> = {}
    for (const m of staffList) {
      for (let d = 1; d <= daysInMonth; d++) {
        sched[`${m.id}-${d}`] = 'OFF'
      }
    }
    setSchedule(sched)
  }

  function getDaysInMonth() {
    return new Date(year, month + 1, 0).getDate()
  }

  function getDayName(d: number) {
    return new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short' })
  }

  function setShift(staffId: number, day: number, shift: ShiftType) {
    setSchedule(prev => ({ ...prev, [`${staffId}-${day}`]: shift }))
  }

  function getShift(staffId: number, day: number): ShiftType {
    return schedule[`${staffId}-${day}`] || 'OFF'
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const days = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1)
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const shifts: ShiftType[] = ['OFF', 'MORNING', 'AFTERNOON', 'NIGHT']

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Staff Schedule</h1>
          <p className="text-surface-500 mt-1">Manage shift assignments for staff members.</p>
        </div>
        <button className="btn-primary" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save Schedule'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="flex items-center gap-4 mt-6">
        <button className="btn-secondary" onClick={prevMonth}>&larr; Prev</button>
        <h2 className="text-lg font-semibold text-surface-800 min-w-[200px] text-center">{monthLabel}</h2>
        <button className="btn-secondary" onClick={nextMonth}>Next &rarr;</button>
      </div>

      {saved && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Schedule saved successfully
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No staff available</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-2 px-3 font-medium text-surface-600 sticky left-0 bg-white z-10 min-w-[140px]">Staff</th>
                {days.map(d => (
                  <th key={d} className="text-center py-2 px-1 font-medium text-surface-600 min-w-[60px]">
                    <div>{d}</div>
                    <div className="text-surface-400">{getDayName(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(m => (
                <tr key={m.id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="py-2 px-3 font-medium text-surface-800 sticky left-0 bg-white z-10">{m.full_name}</td>
                  {days.map(d => (
                    <td key={d} className="text-center py-2 px-1">
                      <select
                        className={`text-xs rounded px-1 py-1 border border-surface-200 w-full ${SHIFT_COLORS[getShift(m.id, d)]}`}
                        value={getShift(m.id, d)}
                        onChange={e => setShift(m.id, d, e.target.value as ShiftType)}
                      >
                        {shifts.map(s => (
                          <option key={s} value={s}>{SHIFT_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-sm text-surface-600">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-100"></span> Morning (6AM-2PM)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-100"></span> Afternoon (2PM-10PM)</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-indigo-100"></span> Night (10PM-6AM)</span>
      </div>
    </div>
  )
}
