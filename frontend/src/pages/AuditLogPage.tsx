import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { AuditEntry } from '../types'

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  useEffect(() => {
    loadAudit()
  }, [actionFilter, page])

  async function loadAudit() {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const res = await api.get<{ items: AuditEntry[]; total: number; page: number; pageSize: number }>(`/audit?${params}`)
    if (res.success && res.data) {
      setEntries(res.data.items)
      setTotal(res.data.total)
    } else {
      setError(res.error || 'Failed to load audit log')
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Audit Log</h1>
          <p className="text-surface-500 mt-1">Track all system activity and changes.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="mt-6 flex gap-3 items-center">
        <label className="text-sm font-medium text-surface-600">Action:</label>
        <select className="input-field w-48" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }}>
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="CHECKIN">Check-in</option>
          <option value="CHECKOUT">Check-out</option>
          <option value="PAYMENT">Payment</option>
        </select>
        <span className="text-sm text-surface-400 ml-auto">{total} entries</span>
      </div>

      <div className="card mt-4">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No audit entries found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Entity</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 text-surface-600 whitespace-nowrap">{new Date(e.performed_at).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        e.action === 'LOGIN' || e.action === 'LOGOUT' ? 'bg-blue-100 text-blue-700' :
                        e.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                        e.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                        e.action === 'PAYMENT' ? 'bg-purple-100 text-purple-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>{e.action}</span>
                    </td>
                    <td className="py-3 px-4 text-surface-600">{e.entity_type}{e.entity_id ? ` #${e.entity_id}` : ''}</td>
                    <td className="py-3 px-4">{e.performed_by_name || `User #${e.performed_by}`}</td>
                    <td className="py-3 px-4 text-surface-600 max-w-xs truncate">{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-surface-600">Page {page} of {totalPages}</span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
