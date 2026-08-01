import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import type {
  InvoiceListItem, InvoiceDetail, InvoiceBalance,
  CreateInvoiceRequest, AddInvoiceItemRequest, RecordPaymentRequest,
  PaginatedResponse,
} from '../types'

type InvoiceStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED'

const STATUS_STYLES: Record<InvoiceStatus | string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<InvoiceDetail | null>(null)
  const [balance, setBalance] = useState<InvoiceBalance | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createBookingId, setCreateBookingId] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [payRef, setPayRef] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let endpoint = `/billing/invoices?page=${page}&pageSize=${pageSize}`
      if (statusFilter) endpoint += `&status=${statusFilter}`
      const res = await api.get<PaginatedResponse<InvoiceListItem>>(endpoint)
      if (res.success && res.data) {
        setInvoices(res.data.items)
        setTotal(res.data.total)
      } else {
        setError(res.error || 'Failed to load invoices')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const loadDetail = async (invoiceId: number) => {
    if (expandedId === invoiceId) {
      setExpandedId(null)
      setDetail(null)
      setBalance(null)
      return
    }
    setExpandedId(invoiceId)
    setDetailLoading(true)
    try {
      const [detailRes, balanceRes] = await Promise.all([
        api.get<InvoiceDetail>(`/billing/invoices/${invoiceId}`),
        api.get<InvoiceBalance>(`/billing/invoices/${invoiceId}/balance`),
      ])
      if (detailRes.success && detailRes.data) setDetail(detailRes.data)
      else setDetail(null)
      if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data)
      else setBalance(null)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createBookingId) return
    setActionLoading(true)
    setActionError('')
    try {
      const body: CreateInvoiceRequest = { booking_id: Number(createBookingId) }
      const res = await api.post('/billing/invoices', body)
      if (res.success) {
        setShowCreateModal(false)
        setCreateBookingId('')
        fetchInvoices()
      } else {
        setActionError(res.error || 'Failed to create invoice')
      }
    } catch {
      setActionError('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!expandedId || !itemDesc || !itemQty || !itemPrice) return
    setActionLoading(true)
    setActionError('')
    try {
      const body: AddInvoiceItemRequest = {
        description: itemDesc,
        quantity: Number(itemQty),
        unit_price: Number(itemPrice),
      }
      const res = await api.post(`/billing/invoices/${expandedId}/items`, body)
      if (res.success) {
        setShowItemModal(false)
        setItemDesc('')
        setItemQty('1')
        setItemPrice('')
        loadDetail(expandedId)
        fetchInvoices()
      } else {
        setActionError(res.error || 'Failed to add item')
      }
    } catch {
      setActionError('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!expandedId || !payAmount) return
    setActionLoading(true)
    setActionError('')
    try {
      const body: RecordPaymentRequest = {
        amount: Number(payAmount),
        payment_method: payMethod,
        reference_number: payRef || undefined,
      }
      const res = await api.post(`/billing/invoices/${expandedId}/payments`, body)
      if (res.success) {
        setShowPaymentModal(false)
        setPayAmount('')
        setPayRef('')
        loadDetail(expandedId)
        fetchInvoices()
      } else {
        setActionError(res.error || 'Failed to record payment')
      }
    } catch {
      setActionError('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const filters: (InvoiceStatus | '')[] = ['', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED']

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Billing</h1>
          <p className="text-surface-500 mt-1">Manage invoices and record payments.</p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setActionError('') }} className="btn-primary">
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f || 'all'}
            onClick={() => { setStatusFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Invoice #</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Booking ID</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Guest ID</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Total</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Status</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Date</th>
              <th className="p-3 text-xs font-medium text-surface-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-surface-400">Loading...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-surface-400">No invoices found.</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.invoice_id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="p-3 text-sm font-medium text-surface-900">#{inv.invoice_id}</td>
                  <td className="p-3 text-sm text-surface-600">{inv.booking_id}</td>
                  <td className="p-3 text-sm text-surface-600">{inv.guest_id}</td>
                  <td className="p-3 text-sm font-medium text-surface-900">{formatCurrency(Number(inv.total_amount))}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status] || ''}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-surface-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => loadDetail(inv.invoice_id)}
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      {expandedId === inv.invoice_id ? 'Collapse' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
            {expandedId && detail && (
              <tr>
                <td colSpan={7} className="p-4 bg-surface-50">
                  {detailLoading ? (
                    <p className="text-center text-surface-400 py-4">Loading details...</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-surface-200">
                          <p className="text-xs text-surface-500 uppercase font-medium">Total Amount</p>
                          <p className="text-lg font-semibold text-surface-900">{formatCurrency(Number(detail.invoice.total_amount))}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-surface-200">
                          <p className="text-xs text-surface-500 uppercase font-medium">Total Paid</p>
                          <p className="text-lg font-semibold text-surface-900">{formatCurrency(balance ? Number(balance.total_paid) : 0)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-surface-200">
                          <p className="text-xs text-surface-500 uppercase font-medium">Balance</p>
                          <p className="text-lg font-semibold text-surface-900">{formatCurrency(balance ? Number(balance.balance) : 0)}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-surface-700">Items</h4>
                          <button
                            onClick={() => { setShowItemModal(true); setActionError('') }}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                          >
                            + Add Item
                          </button>
                        </div>
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-surface-200">
                              <th className="p-2 text-xs text-surface-500 uppercase">Description</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Qty</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Unit Price</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.items.map((item) => (
                              <tr key={item.item_id} className="border-b border-surface-100">
                                <td className="p-2 text-surface-700">{item.description}</td>
                                <td className="p-2 text-surface-600">{item.quantity}</td>
                                <td className="p-2 text-surface-600">{formatCurrency(Number(item.unit_price))}</td>
                                <td className="p-2 font-medium text-surface-900">{formatCurrency(Number(item.total))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-surface-700">Payments</h4>
                          <button
                            onClick={() => { setShowPaymentModal(true); setActionError('') }}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                          >
                            + Record Payment
                          </button>
                        </div>
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-surface-200">
                              <th className="p-2 text-xs text-surface-500 uppercase">Date</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Method</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Amount</th>
                              <th className="p-2 text-xs text-surface-500 uppercase">Reference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.payments.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-surface-400">No payments recorded.</td>
                              </tr>
                            ) : (
                              detail.payments.map((p) => (
                                <tr key={p.payment_id} className="border-b border-surface-100">
                                  <td className="p-2 text-surface-600">{new Date(p.payment_date).toLocaleDateString()}</td>
                                  <td className="p-2">
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-surface-200 text-surface-700">
                                      {p.payment_method}
                                    </span>
                                  </td>
                                  <td className="p-2 font-medium text-surface-900">{formatCurrency(Number(p.amount))}</td>
                                  <td className="p-2 text-surface-500">{p.reference_number || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-surface-500">Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Create Invoice</h3>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Booking ID</label>
                <input type="number" value={createBookingId} onChange={(e) => setCreateBookingId(e.target.value)} className="input-field" placeholder="Enter booking ID" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={actionLoading || !createBookingId} className="btn-primary disabled:opacity-50">
                {actionLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Add Invoice Item</h3>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <input type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="input-field" placeholder="Item description" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Quantity</label>
                  <input type="number" min="1" value={itemQty} onChange={(e) => setItemQty(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Unit Price</label>
                  <input type="number" min="0" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} className="input-field" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowItemModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddItem} disabled={actionLoading || !itemDesc || !itemPrice} className="btn-primary disabled:opacity-50">
                {actionLoading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Record Payment</h3>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Amount</label>
                <input type="number" min="0.01" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER')} className="input-field">
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Reference Number (optional)</label>
                <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="input-field" placeholder="TXN-12345" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleRecordPayment} disabled={actionLoading || !payAmount} className="btn-primary disabled:opacity-50">
                {actionLoading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
