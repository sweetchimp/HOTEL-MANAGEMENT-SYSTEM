export default function GuestsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Guests</h1>
          <p className="text-surface-500 mt-1">Manage guest profiles and history.</p>
        </div>
        <button className="btn-primary">Add Guest</button>
      </div>
      <div className="card mt-6">
        <p className="text-surface-400 text-center py-12">
          Guest management interface will be built in Phase 7.
        </p>
      </div>
    </div>
  )
}
