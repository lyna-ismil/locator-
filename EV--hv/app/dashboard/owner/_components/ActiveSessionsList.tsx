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
  sessions: ChargingSession[]
  onDataChange: () => void
}

export function ActiveSessionsList({ sessions, onDataChange }: ActiveSessionsListProps) {
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

  if (sessions.length === 0) {
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
      {sessions.map((session) => {
        const timeEstimate = calculateTimeEstimate(session)
        const progress = calculateProgress(session)

        return (
          <TiltCard key={session._id} className="bg-white/90 border border-gray-100 shadow-xl">
            <Card className="border-none shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {session.vehicleMake} {session.vehicleModel}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="h-3 w-3" />
                        {session.customerName}
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        {session.stationName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">{session.chargingSpeed}kW</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{session.connectorType}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{session.currentBatteryLevel}%</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{getSessionDuration(session)}</div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {timeEstimate.hours > 0 ? `${timeEstimate.hours}h ` : ""}
                        {timeEstimate.minutes}m
                      </div>
                      <div className="text-xs text-gray-500">Remaining</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">${session.estimatedCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Est. Cost</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Charging Progress</span>
                    <span className="font-medium">
                      {session.currentBatteryLevel}% → {session.targetBatteryLevel}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Estimated Completion</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {getEstimatedCompletionTime(session)} ({timeEstimate.hours > 0 ? `${timeEstimate.hours}h ` : ""}
                    {timeEstimate.minutes}m remaining)
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStopSession(session._id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Stop Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        )
      })}
    </div>
  )
}
