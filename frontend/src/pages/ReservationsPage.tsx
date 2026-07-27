export default function ReservationsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Reservations</h1>
          <p className="text-surface-500 mt-1">Create and manage hotel reservations.</p>
        </div>
        <button className="btn-primary">New Reservation</button>
      </div>
      <div className="card mt-6">
        <p className="text-surface-400 text-center py-12">
          Reservation management interface will be built in Phase 8.
        </p>
      </div>
    </div>
  )
}
