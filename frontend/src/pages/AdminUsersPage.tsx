import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { AdminUser } from '../types'

const ROLES = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'RECEPTIONIST' },
  { id: 3, name: 'MANAGER' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const res = await api.get<AdminUser[]>('/users')
    if (res.success && res.data) {
      setUsers(res.data)
    } else {
      setError(res.error || 'Failed to load users')
    }
    setLoading(false)
  }

  async function handleRoleChange(userId: number, roleId: number) {
    setError('')
    setSuccess('')
    const res = await api.put(`/users/${userId}/role`, { role_id: roleId })
    if (res.success) {
      setSuccess('User role updated')
      loadUsers()
    } else {
      setError(res.error || 'Failed to update role')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">User Management</h1>
          <p className="text-surface-500 mt-1">Manage system user roles and permissions.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      <div className="card mt-6">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Username</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Role</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">{u.full_name}</td>
                    <td className="py-3 px-4 text-surface-600">{u.username}</td>
                    <td className="py-3 px-4 text-surface-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        className="input-field text-sm py-1"
                        value={u.role_id}
                        onChange={e => handleRoleChange(u.user_id, Number(e.target.value))}
                      >
                        {ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-surface-600">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
