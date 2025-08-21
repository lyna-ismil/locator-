"use client"

import { useState, useEffect } from "react"
import React from "react"
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
import { AddStationModal } from "./AddStationModal"

export interface Station {
  _id?: string
  stationName: string
  network: string
  ownerId: string
  location?: any
  connectors?: any[]
  address?: { street?: string; city?: string; state?: string; zipCode?: string }
  operatingHours?: any
  pricing?: any
  amenities?: Record<string, boolean>
  [k: string]: any
}

interface StationListProps {
  stations: Station[]
  onEdit: (station: Station | null) => void
  onDataChange: () => void
}

// Removed internal loading & error state (parent controls those)
export function StationList({ stations, onEdit, onDataChange }: StationListProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [connectorStatus, setConnectorStatus] = useState<Record<string, any>>({})
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      if (Math.random() > 0.95) {
        setConnectorStatus((prev) => {
          const newStatus = { ...prev }
            ; const keys = Object.keys(newStatus)
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

  const toggleConnectorStatus = async (stationId: string, connectorIndex: number) => {
    const connectorId = `${stationId}-${connectorIndex}`
    setUpdatingStatus(connectorId)
    try {
      await new Promise((r) => setTimeout(r, 500))
      setConnectorStatus((prev) => ({
        ...prev,
        [connectorId]: {
          ...prev[connectorId],
            available: !prev[connectorId]?.available,
            lastActivity: new Date().toISOString(),
        },
      }))
      setLastUpdate(new Date())
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusIndicator = (connectorId: string) => {
    const status = connectorStatus[connectorId]
    if (!status) return { icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-100" }
    if (status.isCharging) return { icon: Zap, color: "text-blue-600", bg: "bg-blue-100" }
    if (status.available) return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" }
    return { icon: XCircle, color: "text-red-600", bg: "bg-red-100" }
  }

  // First condition: empty list
  if (!stations || stations.length === 0) {
    return (
      <Card className="bg-white/90 border border-gray-100 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stations found</h3>
          <p className="text-gray-600 text-center">
            You haven't added any stations yet. Click the Add button to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Single incomplete station prompt
  if (stations.length === 1 && (!stations[0].address?.street || !stations[0].connectors?.length)) {
    const station = stations[0]
    return (
      <>
        <Card className="bg-white/90 border border-gray-100 shadow">
          <CardHeader>
            <CardTitle>Your Station (Incomplete)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Name" value={station.stationName} />
            <InfoRow label="Network" value={station.network} />
            <InfoRow label="Email" value={station.email} />
            <InfoRow
              label="Location"
              value={
                station.location?.coordinates
                  ? `Lng: ${station.location.coordinates[0]}, Lat: ${station.location.coordinates[1]}`
                  : "N/A"
              }
            />
            <InfoRow
              label="Address"
              value={
                station.address
                  ? [station.address.street, station.address.city, station.address.state, station.address.zipCode]
                      .filter(Boolean)
                      .join(", ")
                  : "N/A"
              }
            />
            <InfoRow
              label="Connectors"
              value={
                station.connectors?.length
                  ? station.connectors
                      .map(
                        (c: any) =>
                          `${c.type} (${c.chargerLevel || ""}${c.powerKW ? `, ${c.powerKW}kW` : ""})`
                      )
                      .join(" | ")
                  : "None added yet"
              }
            />
            <p className="text-amber-600 mt-4">
              Your station profile is incomplete. Add address, connectors, pricing and amenities to finish setup.
            </p>
            <Button className="mt-2" onClick={() => onEdit(station)}>
              Complete Station Details
            </Button>
          </CardContent>
        </Card>
        <AddStationModal
          open={showModal}
          setOpen={setShowModal}
          startStep={modalStep}
          onStationAdded={onDataChange}
        />
      </>
    )
  }

  // Default: list stations
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
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLastUpdate(new Date())
          }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station, i) => {
          const coordPart = Array.isArray(station.location?.coordinates)
            ? station.location!.coordinates.join("_")
            : ""
          const stationKey =
            station._id ||
            station.id ||
            (station.stationName ? `${station.stationName.replace(/\s+/g, "-")}-${coordPart}` : null) ||
            `station-${i}`

          return (
            <Card key={stationKey} className="bg-white/90 border border-gray-100 shadow-xl">
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
                    <Row icon={MapPin} text={station.address
                      ? [station.address.street, station.address.city, station.address.state].filter(Boolean).join(", ")
                      : "N/A"} />
                    <Row
                      icon={Clock}
                      text={
                        station.operatingHours && typeof station.operatingHours === "object"
                          ? "Custom schedule"
                          : "24/7"
                      }
                    />
                    <Row
                      icon={DollarSign}
                      text={station.pricing?.perkWh ? `$${station.pricing.perkWh}/kWh` : "No pricing"}
                    />
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
                          const connectorId = `${stationKey}-c-${connector._id || index}`
                          const indicator = getStatusIndicator(`${station._id}-${index}`)
                          const IconComponent = indicator.icon
                          const status = connectorStatus[`${station._id}-${index}`]
                          return (
                            <div
                              key={connectorId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${indicator.bg}`}>
                                  <IconComponent className={`h-4 w-4 ${indicator.color}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {connector.type} ({connector.powerKW ?? connector.power}kW)
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {status?.isCharging
                                      ? "Charging"
                                      : status?.available
                                      ? "Available"
                                      : "Unavailable"}
                                    {status?.sessionsToday && (
                                      <span className="ml-2">
                                        • {status.sessionsToday} sessions today
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Switch
                                checked={status?.available || false}
                                onCheckedChange={() => toggleConnectorStatus(station._id!, index)}
                                disabled={
                                  updatingStatus === `${station._id}-${index}` || status?.isCharging
                                }
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
          )
        })}
      </div>
    </div>
  )
}

// Small helpers
function Row({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-400" />
      <span className="text-gray-600">{text}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="mb-1">
      <strong>{label}:</strong> {value}
    </div>
  )
}
