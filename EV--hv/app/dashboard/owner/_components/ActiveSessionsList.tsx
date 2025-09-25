"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, Zap, Battery, User, MapPin, DollarSign, Timer } from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"

interface ChargingSession {
  _id: string
  userId: string
  stationId: string
  stationName: string
  connectorId: string
  connectorType: string
  customerName: string
  customerEmail: string
  startTime: string
  targetBatteryLevel: number
  currentBatteryLevel: number
  initialBatteryLevel: number
  chargingSpeed: number
  batteryCapacity: number
  estimatedCost: number
  actualCost?: number
  status: "active" | "completed" | "stopped"
  vehicleMake: string
  vehicleModel: string
}

interface ActiveSessionsListProps {
  reservations: any[]       // already filtered Active
  refreshing?: boolean
  onRefresh?: () => void
}

export function ActiveSessionsList({
  reservations = [], // <-- Default to empty array
  refreshing,
  onRefresh,
}: ActiveSessionsListProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const calculateTimeEstimate = (session: ChargingSession) => {
    const remainingCapacity =
      ((session.targetBatteryLevel - session.currentBatteryLevel) / 100) * session.batteryCapacity
    const estimatedMinutes = Math.ceil((remainingCapacity / session.chargingSpeed) * 60)

    const hours = Math.floor(estimatedMinutes / 60)
    const minutes = estimatedMinutes % 60

    return { hours, minutes, totalMinutes: estimatedMinutes }
  }

  const calculateProgress = (session: ChargingSession) => {
    const totalRange = session.targetBatteryLevel - session.initialBatteryLevel
    const currentProgress = session.currentBatteryLevel - session.initialBatteryLevel
    return Math.max(0, Math.min(100, (currentProgress / totalRange) * 100))
  }

  const getEstimatedCompletionTime = (session: ChargingSession) => {
    const { totalMinutes } = calculateTimeEstimate(session)
    const completionTime = new Date(currentTime.getTime() + totalMinutes * 60000)
    return completionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getSessionDuration = (session: ChargingSession) => {
    const startTime = new Date(session.startTime)
    const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000)
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}h ${minutes}m`
  }

  const handleStopSession = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/charging-sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "stopped",
          endTime: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        onDataChange()
      }
    } catch (error) {
      console.error("Error stopping session:", error)
    }
  }

  function fmt(dt?: string) {
    if (!dt) return "—"
    const d = new Date(dt)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleTimeString()
  }
  if (reservations.length === 0) {
    return (
      <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-600 text-center">All charging stations are currently available.</p>
          </CardContent>
        </Card>
      </TiltCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Active / In-Progress</h3>
        <button
          disabled={refreshing}
          onClick={onRefresh}
          className="px-2 py-1 text-xs border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {reservations.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 text-center">
          No active reservations.
        </div>
      )}
      <div className="grid gap-3">
        {reservations.map(r => {
          const rid = r._id || r.id
            const station =
            typeof r.stationId === "object" ? r.stationId : { stationName: r.stationId }
          return (
            <div
              key={rid}
              className="p-4 bg-white border rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="font-medium text-gray-800">
                  {station.stationName || "Station"} • {r.connectorId}
                </div>
                <div className="text-xs text-gray-500">
                  {fmt(r.startTime)} → {fmt(r.endTime)}
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-emerald-600 text-white self-start">
                Active
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
