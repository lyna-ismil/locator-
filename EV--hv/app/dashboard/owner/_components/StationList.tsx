"use client"

import { useState, useEffect } from "react"
import type { Station } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Zap,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"

interface StationListProps {
  onEdit: (station: Station | null) => void
  onDataChange: () => void
}

export function StationList({ onEdit, onDataChange }: StationListProps) {
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [connectorStatus, setConnectorStatus] = useState<Record<string, any>>({})
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Get logged-in ownerId from localStorage
  const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Simulate random status changes for demo
      if (Math.random() > 0.95) {
        setConnectorStatus((prev) => {
          const newStatus = { ...prev }
          const keys = Object.keys(newStatus)
          if (keys.length > 0) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)]
            if (newStatus[randomKey]) {
              newStatus[randomKey] = {
                ...newStatus[randomKey],
                lastActivity: new Date().toISOString(),
                sessionsToday: (newStatus[randomKey].sessionsToday || 0) + (Math.random() > 0.7 ? 1 : 0),
              }
            }
          }
          return newStatus
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true)
      setError(null)
      try {
        if (!ownerId) throw new Error("Owner not logged in.")
        const response = await fetch(`http://localhost:5000/stations?ownerId=${ownerId}`)
        if (!response.ok) throw new Error("Failed to fetch stations.")
        const data = await response.json()
        setStations(data)

        const statusMap: Record<string, any> = {}
        data.forEach((station: Station) => {
          if (station.connectors) {
            station.connectors.forEach((connector: any, index: number) => {
              const connectorId = `${station._id}-${index}`
              statusMap[connectorId] = {
                available: connector.status === "available",
                isCharging: Math.random() > 0.7,
                lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                sessionsToday: Math.floor(Math.random() * 12),
                totalEnergy: Math.floor(Math.random() * 500) + 100,
                uptime: 95 + Math.random() * 5,
              }
            })
          }
        })
        setConnectorStatus(statusMap)
      } catch (err: any) {
        setError(err.message || "Unknown error")
        setStations([])
        setIsOnline(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStations()
  }, [ownerId, onDataChange])

  const toggleConnectorStatus = async (stationId: string, connectorIndex: number) => {
    const connectorId = `${stationId}-${connectorIndex}`
    setUpdatingStatus(connectorId)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setConnectorStatus((prev) => ({
        ...prev,
        [connectorId]: {
          ...prev[connectorId],
          available: !prev[connectorId]?.available,
          lastActivity: new Date().toISOString(),
        },
      }))

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to update connector status:", error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusIndicator = (connectorId: string) => {
    const status = connectorStatus[connectorId]
    if (!status) return { icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-100" }

    if (status.isCharging) {
      return { icon: Zap, color: "text-blue-600", bg: "bg-blue-100" }
    } else if (status.available) {
      return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" }
    } else {
      return { icon: XCircle, color: "text-red-600", bg: "bg-red-100" }
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin">
              <Zap className="h-12 w-12 text-emerald-600 mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading stations...</h3>
          </CardContent>
        </Card>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Connection Error</h3>
            <p className="text-gray-600 text-center">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </Card>
    )
  }

  if (stations.length === 0) {
    return (
      <Card className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stations found</h3>
            <p className="text-gray-600 text-center">
              You haven't added any stations yet. Click below to add your first charging station.
            </p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => onEdit(null)}>
              <Zap className="h-4 w-4 mr-2" />
              Add Station
            </Button>
          </CardContent>
        </Card>
      </Card>
    )
  }

  // If there is only one station and it's incomplete, prompt to complete details
  if (stations.length === 1 && (!stations[0].address?.street || !stations[0].connectors?.length)) {
    const station = stations[0]
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Station (Incomplete)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Name:</strong> {station.stationName || "N/A"}
          </div>
          <div className="mb-2">
            <strong>Network:</strong> {station.network || "N/A"}
          </div>
          <div className="mb-2">
            <strong>Address:</strong>{" "}
            {station.address
              ? [station.address.street, station.address.city, station.address.state, station.address.zipCode]
                  .filter(Boolean)
                  .join(", ")
              : "N/A"}
          </div>
          <div className="mb-2">
            <strong>Connectors:</strong>{" "}
            {station.connectors && station.connectors.length > 0
              ? station.connectors.map((c: any) => c.type).join(", ")
              : "None added yet"}
          </div>
          <p className="text-amber-600 mt-4">
            Your station profile is incomplete. Please add more details to make it available to drivers.
          </p>
          <Button className="mt-4" onClick={() => onEdit(station)}>
            Complete Station Details
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default: show all stations with real-time status control
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? "Online" : "Offline"}
          </div>
          <span className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <Card key={station._id} className="bg-white/90 border border-gray-100 shadow-xl">
            <Card className="border-none shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white grid place-items-center">
                    <Zap className="h-4 w-4" />
                  </div>
                  {station.stationName || "Unnamed Station"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {station.address
                        ? [station.address.street, station.address.city, station.address.state]
                            .filter(Boolean)
                            .join(", ")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{station.operatingHours || "24/7"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {station.pricing?.perkWh ? `$${station.pricing.perkWh}/kWh` : "No pricing"}
                    </span>
                  </div>
                </div>

                {station.connectors && station.connectors.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">Connector Status</span>
                      </div>
                      {station.connectors.map((connector: any, index: number) => {
                        const connectorId = `${station._id}-${index}`
                        const status = connectorStatus[connectorId]
                        const indicator = getStatusIndicator(connectorId)
                        const IconComponent = indicator.icon

                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-full ${indicator.bg}`}>
                                <IconComponent className={`h-4 w-4 ${indicator.color}`} />
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {connector.type} ({connector.power}kW)
                                </div>
                                <div className="text-xs text-gray-500">
                                  {status?.isCharging ? "Charging" : status?.available ? "Available" : "Unavailable"}
                                  {status?.sessionsToday && (
                                    <span className="ml-2">• {status.sessionsToday} sessions today</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={status?.available || false}
                              onCheckedChange={() => toggleConnectorStatus(station._id!, index)}
                              disabled={updatingStatus === connectorId || status?.isCharging}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {station.amenities && Object.values(station.amenities).some((v) => v) && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(station.amenities)
                        .filter(([_, v]) => v)
                        .map(([k]) => (
                          <Badge key={k} variant="secondary" className="text-xs">
                            {k}
                          </Badge>
                        ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(station)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    disabled={updatingStatus === station._id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Card>
        ))}
      </div>
    </div>
  )
}
