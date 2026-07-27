export default function BillingPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Billing</h1>
          <p className="text-surface-500 mt-1">Manage invoices and process payments.</p>
        </div>
        <button className="btn-primary">Create Invoice</button>
      </div>
      <div className="card mt-6">
        <p className="text-surface-400 text-center py-12">
          Billing and invoicing interface will be built in Phase 10.
        </p>
      </div>
    </div>
  )
}
