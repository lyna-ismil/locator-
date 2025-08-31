import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Car, Clock, Zap } from "lucide-react"

/**
 * ReservationList
 * Displays station, customer and vehicle details for each reservation.
 */
export function ReservationList({ reservations }: { reservations: any[] }) {
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

  return (
    <div className="space-y-4">
      {reservations.map((r) => {
        const stationName =
          r.stationId?.stationName ||
          r.station?.name ||
            r.stationId?.name ||
          r.stationId ||
          "Station"

        const customerName =
          r.customer?.name ||
          r.customer?.fullName ||
          r.user?.name ||
          r.userId ||
          "User"

        const vehicle = r.vehicleInfo || r.vehicle || {}
        const vehicleLabel = vehicle.make
          ? `${vehicle.make} ${vehicle.model || ""} ${vehicle.year ? `(${vehicle.year})` : ""}`.trim()
          : "—"

        return (
          <Card key={r._id || r.id} className="bg-white/90 border border-gray-100 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{stationName}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <User className="h-3 w-3" />
                    {customerName}
                  </div>
                </div>
                <Badge className={getStatusColor(r.status)}>{r.status || "—"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <strong>Start:</strong>{" "}
                    {r.startTime ? new Date(r.startTime).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <strong>End:</strong>{" "}
                    {r.endTime ? new Date(r.endTime).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <strong>Connector:</strong> {r.connectorId || r.chargerId || "—"}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Car className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <strong>Vehicle:</strong> {vehicleLabel}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
