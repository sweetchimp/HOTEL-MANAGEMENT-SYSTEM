import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import type { StaffMember, PayrollRecord } from '../types'

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [payrollLoading, setPayrollLoading] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', department: 'Front Desk', position: '', salary: '', hire_date: '' })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState(0)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', department: '', position: '', salary: '' })

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [deactivateId, setDeactivateId] = useState(0)
  const [deactivateName, setDeactivateName] = useState('')

  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [payrollStaffId, setPayrollStaffId] = useState(0)
  const [payrollMonth, setPayrollMonth] = useState('')
  const [payrollSalary, setPayrollSalary] = useState('')
  const [payrollDate, setPayrollDate] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    setLoading(true)
    const res = await api.get<StaffMember[]>('/staff')
    if (res.success && res.data) {
      setStaff(res.data)
    } else {
      setError(res.error || 'Failed to load staff')
    }
    setLoading(false)
  }

  async function loadPayroll(staffId: number) {
    setSelectedStaffId(staffId)
    setPayrollLoading(true)
    const res = await api.get<PayrollRecord[]>(`/payroll/${staffId}`)
    if (res.success && res.data) {
      setPayrollRecords(res.data)
    }
    setPayrollLoading(false)
  }

  async function handleAdd() {
    if (!addForm.full_name || !addForm.email || !addForm.position) return
    const res = await api.post('/staff', {
      ...addForm,
      salary: Number(addForm.salary) || 0,
      hire_date: addForm.hire_date || new Date().toISOString().split('T')[0],
    })
    if (res.success) {
      setShowAddModal(false)
      setAddForm({ full_name: '', email: '', phone: '', department: 'Front Desk', position: '', salary: '', hire_date: '' })
      loadStaff()
    } else {
      setError(res.error || 'Failed to create staff')
    }
  }

  async function handleEdit() {
    const body: Record<string, unknown> = {}
    if (editForm.full_name) body.full_name = editForm.full_name
    if (editForm.email) body.email = editForm.email
    if (editForm.phone) body.phone = editForm.phone
    if (editForm.department) body.department = editForm.department
    if (editForm.position) body.position = editForm.position
    if (editForm.salary) body.salary = Number(editForm.salary)

    const res = await api.put(`/staff/${editId}`, body)
    if (res.success) {
      setShowEditModal(false)
      loadStaff()
    } else {
      setError(res.error || 'Failed to update staff')
    }
  }

  async function handleDeactivate() {
    const res = await api.post(`/staff/${deactivateId}/deactivate`)
    if (res.success) {
      setShowDeactivateConfirm(false)
      loadStaff()
      if (selectedStaffId === deactivateId) {
        setSelectedStaffId(null)
        setPayrollRecords([])
      }
    } else {
      setError(res.error || 'Failed to deactivate staff')
    }
  }

  async function handleAddPayroll() {
    if (!payrollStaffId || !payrollMonth || !payrollSalary) return
    const res = await api.post('/payroll', {
      staff_id: payrollStaffId,
      month: payrollMonth,
      salary_paid: Number(payrollSalary),
      payment_date: payrollDate || new Date().toISOString().split('T')[0],
    })
    if (res.success) {
      setShowPayrollModal(false)
      setPayrollMonth('')
      setPayrollSalary('')
      setPayrollDate('')
      if (selectedStaffId === payrollStaffId) loadPayroll(payrollStaffId)
    } else {
      setError(res.error || 'Failed to add payroll record')
    }
  }

  function openEdit(m: StaffMember) {
    setEditId(m.id)
    setEditForm({ full_name: m.full_name, email: m.email, phone: m.phone, department: m.department, position: m.position, salary: String(m.salary) })
    setShowEditModal(true)
  }

  function openDeactivate(m: StaffMember) {
    setDeactivateId(m.id)
    setDeactivateName(m.full_name)
    setShowDeactivateConfirm(true)
  }

  function openPayroll(staffId: number) {
    setPayrollStaffId(staffId)
    const now = new Date()
    setPayrollMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    setPayrollDate(now.toISOString().split('T')[0])
    setShowPayrollModal(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Staff Directory</h1>
          <p className="text-surface-500 mt-1">Manage hotel staff and payroll records.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>Add Staff</button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="card mt-6">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : staff.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No staff members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Position</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Salary</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-600">Payroll</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(m => (
                  <tr key={m.id} className={`border-b border-surface-100 hover:bg-surface-50 ${selectedStaffId === m.id ? 'bg-primary-50' : ''}`}>
                    <td className="py-3 px-4 font-medium">{m.full_name}</td>
                    <td className="py-3 px-4 text-surface-600">{m.email}</td>
                    <td className="py-3 px-4">{m.department}</td>
                    <td className="py-3 px-4">{m.position}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(m.salary)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                        onClick={() => loadPayroll(m.id)}
                      >
                        {selectedStaffId === m.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button className="text-sm text-primary-600 hover:text-primary-800 font-medium" onClick={() => openEdit(m)}>Edit</button>
                      <button className="text-sm text-red-600 hover:text-red-800 font-medium" onClick={() => openDeactivate(m)}>Deactivate</button>
                      <button className="text-sm text-green-600 hover:text-green-800 font-medium" onClick={() => openPayroll(m.id)}>+ Pay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStaffId && (
        <div className="card mt-4">
          <h2 className="text-lg font-semibold mb-4">Payroll Records</h2>
          {payrollLoading ? (
            <p className="text-center py-4 text-surface-400">Loading...</p>
          ) : payrollRecords.length === 0 ? (
            <p className="text-center py-4 text-surface-400">No payroll records</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-3 px-4 font-medium text-surface-600">Month</th>
                    <th className="text-right py-3 px-4 font-medium text-surface-600">Amount Paid</th>
                    <th className="text-left py-3 px-4 font-medium text-surface-600">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map(p => (
                    <tr key={p.id} className="border-b border-surface-100">
                      <td className="py-3 px-4">{p.month}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(p.salary_paid)}</td>
                      <td className="py-3 px-4">{p.payment_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Add Staff Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Full Name *</label>
                <input className="input-field" value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Email *</label>
                <input className="input-field" type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Phone</label>
                <input className="input-field" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Department *</label>
                <select className="input-field" value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })}>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Concierge">Concierge</option>
                  <option value="Management">Management</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Position *</label>
                <input className="input-field" value={addForm.position} onChange={e => setAddForm({ ...addForm, position: e.target.value })} placeholder="e.g. Receptionist" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Annual Salary</label>
                <input className="input-field" type="number" value={addForm.salary} onChange={e => setAddForm({ ...addForm, salary: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Hire Date</label>
                <input className="input-field" type="date" value={addForm.hire_date} onChange={e => setAddForm({ ...addForm, hire_date: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={!addForm.full_name || !addForm.email || !addForm.position}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Staff Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Full Name</label>
                <input className="input-field" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Email</label>
                <input className="input-field" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Phone</label>
                <input className="input-field" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Department</label>
                <select className="input-field" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Concierge">Concierge</option>
                  <option value="Management">Management</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Position</label>
                <input className="input-field" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Annual Salary</label>
                <input className="input-field" type="number" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Deactivate Staff</h2>
            <p className="text-sm text-surface-600">Deactivate <strong>{deactivateName}</strong>? They will no longer appear in the active staff directory.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowDeactivateConfirm(false)}>Cancel</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700" onClick={handleDeactivate}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Add Payroll Record</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Month (YYYY-MM) *</label>
                <input className="input-field" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} placeholder="2026-07" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Amount Paid *</label>
                <input className="input-field" type="number" value={payrollSalary} onChange={e => setPayrollSalary(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Payment Date</label>
                <input className="input-field" type="date" value={payrollDate} onChange={e => setPayrollDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowPayrollModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddPayroll} disabled={!payrollMonth || !payrollSalary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
