import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { MaintenanceRecord, RoomListItem } from '../types'

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportRoomId, setReportRoomId] = useState(0)
  const [reportIssueType, setReportIssueType] = useState('PLUMBING')
  const [reportDescription, setReportDescription] = useState('')
  const [rooms, setRooms] = useState<RoomListItem[]>([])

  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolveId, setResolveId] = useState(0)
  const [resolveNotes, setResolveNotes] = useState('')

  useEffect(() => {
    loadRecords()
    loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadRecords() {
    setLoading(true)
    let endpoint = '/maintenance'
    if (statusFilter) endpoint += `?status=${statusFilter}`
    const res = await api.get<MaintenanceRecord[]>(endpoint)
    if (res.success && res.data) {
      setRecords(res.data)
    } else {
      setError(res.error || 'Failed to load maintenance records')
    }
    setLoading(false)
  }

  async function loadRooms() {
    const res = await api.get<{ items: RoomListItem[] }>('/rooms?pageSize=50')
    if (res.success && res.data) {
      setRooms(res.data.items)
    }
  }

  async function handleReport() {
    if (!reportRoomId || !reportIssueType || !reportDescription) return
    const res = await api.post('/maintenance', {
      room_id: reportRoomId,
      issue_type: reportIssueType,
      description: reportDescription,
    })
    if (res.success) {
      setShowReportModal(false)
      setReportRoomId(0)
      setReportIssueType('PLUMBING')
      setReportDescription('')
      loadRecords()
    } else {
      setError(res.error || 'Failed to report issue')
    }
  }

  async function handleResolve() {
    if (!resolveId || !resolveNotes) return
    const today = new Date().toISOString().split('T')[0]
    const res = await api.post(`/maintenance/${resolveId}/resolve`, {
      notes: resolveNotes,
      resolved_date: today,
    })
    if (res.success) {
      setShowResolveModal(false)
      setResolveId(0)
      setResolveNotes('')
      loadRecords()
    } else {
      setError(res.error || 'Failed to resolve issue')
    }
  }

  const filters = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED']

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Maintenance</h1>
          <p className="text-surface-500 mt-1">Track and manage room maintenance issues.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowReportModal(true)}>
          Report Issue
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {filters.map(f => (
          <button
            key={f}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
            onClick={() => setStatusFilter(f)}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="card mt-4">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No maintenance records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Issue Type</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Assigned To</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">{r.room_number}</td>
                    <td className="py-3 px-4">{r.issue_type}</td>
                    <td className="py-3 px-4 text-surface-500 max-w-xs truncate">{r.description}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || 'bg-surface-100 text-surface-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(r.created_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{r.assigned_to || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== 'RESOLVED' && (
                        <button
                          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                          onClick={() => { setResolveId(r.id); setResolveNotes(''); setShowResolveModal(true) }}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Report Maintenance Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Room *</label>
                <select className="input-field" value={reportRoomId} onChange={e => setReportRoomId(Number(e.target.value))}>
                  <option value={0}>Select a room...</option>
                  {rooms.map(r => (
                    <option key={r.ROOM_ID} value={r.ROOM_ID}>Room {r.ROOM_NUMBER}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Issue Type *</label>
                <select className="input-field" value={reportIssueType} onChange={e => setReportIssueType(e.target.value)}>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="APPLIANCE">Appliance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Description *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="Describe the issue..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleReport}
                disabled={!reportRoomId || !reportDescription}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Resolve Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Resolution Notes *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Describe the resolution..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleResolve}
                disabled={!resolveNotes}
              >
                Confirm Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
