import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Car, Clock, Zap } from "lucide-react"

interface ReservationListProps {
  reservations: any[]
  refreshing?: boolean
  lastUpdated?: string
  onRefresh?: () => void
}

/**
 * ReservationList
 * Displays station, customer and vehicle details for each reservation.
 */
export function ReservationList({
  reservations,
  refreshing,
  lastUpdated,
  onRefresh,
}: ReservationListProps) {
  if (!reservations.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No reservations found.
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-blue-100 text-blue-800"
      case "Active":
        return "bg-green-100 text-green-800"
      case "Completed":
        return "bg-gray-100 text-gray-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  function fmt(dt?: string) {
    if (!dt) return "—"
    const d = new Date(dt)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Station Reservations</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Updated: {lastUpdated || "—"}</span>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-2 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {reservations.length === 0 && (
        <div className="p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          No reservations yet.
        </div>
      )}
      <div className="space-y-3">
        {reservations.map((r) => {
          const rid = r._id || r.id
          const station =
            typeof r.stationId === "object" ? r.stationId : { stationName: r.stationId }
          const status = r.status
          const vehicle = r.vehicleInfo || r.vehicle || {}
          const vehicleLabel = vehicle.make
            ? `${vehicle.make} ${vehicle.model || ""} ${vehicle.year ? `(${vehicle.year})` : ""}`.trim()
            : "—"

          return (
            <div
              key={rid}
              className="border rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {station.stationName || "Station"}
                </div>
                <div className="text-xs text-gray-500">
                  {fmt(r.startTime)} → {fmt(r.endTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Connector: {r.connectorId}
                  {r.connectorInfo?.type
                    ? ` (${r.connectorInfo.type}${
                        r.connectorInfo.powerKW ? ` ${r.connectorInfo.powerKW}kW` : ""
                      })`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    status === "Active"
                      ? "bg-emerald-600 text-white"
                      : status === "Completed"
                      ? "bg-gray-200 text-gray-700"
                      : status === "Cancelled"
                      ? "bg-red-100 text-red-600"
                      : status === "Expired"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {status}
                </span>
                {typeof r.cost === "number" && (
                  <span className="text-sm font-medium text-gray-700">
                    {(r.cost || r.reservationFee || 0).toFixed(2)} TND
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
