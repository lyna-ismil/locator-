export function ReservationList({ reservations }) {
  if (!reservations.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No reservations found.
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {reservations.map((r) => (
        <div key={r._id} className="border rounded p-4">
          <div><strong>User:</strong> {r.userId}</div>
          <div><strong>Station:</strong> {r.stationId}</div>
          <div><strong>Connector:</strong> {r.connectorId}</div>
          <div><strong>Start:</strong> {new Date(r.startTime).toLocaleString()}</div>
          <div><strong>End:</strong> {new Date(r.endTime).toLocaleString()}</div>
          <div><strong>Status:</strong> {r.status}</div>
        </div>
      ))}
    </div>
  )
}
