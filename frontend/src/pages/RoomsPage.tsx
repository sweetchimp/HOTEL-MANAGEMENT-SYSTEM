export default function RoomsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Rooms</h1>
          <p className="text-surface-500 mt-1">Manage hotel rooms and their status.</p>
        </div>
        <button className="btn-primary">Add Room</button>
      </div>
      <div className="card mt-6">
        <p className="text-surface-400 text-center py-12">
          Room management interface will be built in Phase 6.
        </p>
      </div>
    </div>
  )
}
