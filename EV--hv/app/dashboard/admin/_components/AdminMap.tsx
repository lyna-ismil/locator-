"use client"

import { useState, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Users,
  RefreshCw,
  Activity,
} from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"

interface AdminStation {
  _id: string
  stationName: string
  network: string
  ownerId: string
  ownerName?: string
  location: {
    coordinates: [number, number]
  }
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
  }
  connectors: Array<{
    _id?: string
    type: string
    powerKW: number
    status: "available" | "busy" | "offline" | "maintenance"
  }>
  status: "active" | "inactive" | "maintenance" | "pending"
  stats: {
    totalSessions: number
    totalRevenue: number
    averageRating: number
    utilizationRate: number
  }
  createdAt: string
  lastActivity?: string
}

interface Props {
  height?: string
  className?: string
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "#059669" // Green
    case "inactive":
      return "#6b7280" // Gray
    case "maintenance":
      return "#f59e0b" // Yellow
    case "pending":
      return "#3b82f6" // Blue
    default:
      return "#6b7280"
  }
}

function getConnectorStatusColor(connectors: any[]) {
  if (!connectors.length) return "#6b7280"

  const available = connectors.filter((c) => c.status === "available").length
  const total = connectors.length

  if (available === 0) return "#dc2626" // Red - no available
  if (available === total) return "#059669" // Green - all available
  return "#f59e0b" // Yellow - partially available
}

const adminIconFactory = (() => {
  const cache = new Map<string, L.DivIcon>()
  return (status: string, connectorCount: number, availableCount: number) => {
    const key = `${status}-${connectorCount}-${availableCount}`
    if (cache.has(key)) return cache.get(key)!

    const statusColor = getStatusColor(status)
    const display = `${availableCount}/${connectorCount}`

    const gradientColor =
      status === "active"
        ? "linear-gradient(135deg, #059669, #10b981)"
        : status === "maintenance"
          ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
          : status === "inactive"
            ? "linear-gradient(135deg, #6b7280, #9ca3af)"
            : "linear-gradient(135deg, #3b82f6, #60a5fa)"

    const icon = L.divIcon({
      className: "admin-station-pin",
      html: `<div style="
        min-width:36px;height:36px;border-radius:50%;
        background:${gradientColor};
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:10px;font-weight:800;
        padding:0 4px;
        box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 6px 20px rgba(0,0,0,.3);
        border:2px solid rgba(255,255,255,0.8);
        transition:all 0.2s ease;
        position:relative;
      ">${display}
      ${status === "maintenance" ? '<div style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#f59e0b;border-radius:50%;border:2px solid #fff;">⚠</div>' : ""}
      ${status === "pending" ? '<div style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#3b82f6;border-radius:50%;border:2px solid #fff;">!</div>' : ""}
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    })
    cache.set(key, icon)
    return icon
  }
})()

function AdminFitBounds({ stations }: { stations: AdminStation[] }) {
  const map = useMap()
  useEffect(() => {
    const pts: L.LatLngExpression[] = []
    stations.forEach((s) => {
      if (s?.location?.coordinates && Array.isArray(s.location.coordinates)) {
        const [lng, lat] = s.location.coordinates
        if (isFinite(lat) && isFinite(lng)) {
          pts.push([lat, lng])
        }
      }
    })

    if (!pts.length) {
      map.setView([34.0, 9.0], 7)
      return
    }
    if (pts.length === 1) {
      map.setView(pts[0], 12)
      return
    }
    const bounds = L.latLngBounds(pts)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [stations, map])
  return null
}

export default function AdminMap({ height = "600px", className = "" }: Props) {
  const [stations, setStations] = useState<AdminStation[]>([])
  const [filteredStations, setFilteredStations] = useState<AdminStation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [selectedStation, setSelectedStation] = useState<AdminStation | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchStations()
  }, [])

  useEffect(() => {
    filterStations()
  }, [stations, searchTerm, statusFilter, networkFilter])

  const fetchStations = async () => {
    try {
      setIsLoading(true)
      const stationsRes = await fetch("http://localhost:5000/stations")
      const stationsData = stationsRes.ok ? await stationsRes.json() : []

      const processedStations = stationsData.map((station: any) => {
        const totalSessions = station.stats?.totalSessions || 0
        const totalRevenue = station.stats?.totalRevenue || 0
        const averageRating = station.stats?.averageRating || 0
        const totalConnectors = station.connectors?.length || 0
        const activeConnectors = station.connectors?.filter((c: any) => c.status === "available").length || 0
        const utilizationRate = totalConnectors > 0 ? (activeConnectors / totalConnectors) * 100 : 0

        return {
          _id: station._id,
          stationName: station.stationName || "Unnamed Station",
          network: station.network || "Independent",
          ownerId: station.ownerId,
          ownerName: station.ownerId || "Unknown Owner", // If you store name, use it here
          location: station.location,
          address: station.address,
          connectors: station.connectors || [],
          status: station.status || "active",
          createdAt: station.createdAt || new Date().toISOString(),
          lastActivity: station.lastActivity || station.updatedAt || new Date().toISOString(),
          stats: {
            totalSessions,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageRating: Math.round(averageRating * 10) / 10,
            utilizationRate: Math.round(utilizationRate),
          },
        }
      })

      setStations(processedStations)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to fetch stations:", error)
      setStations([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterStations = () => {
    let filtered = stations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (station) =>
          station.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((station) => station.status === statusFilter)
    }

    // Network filter
    if (networkFilter !== "all") {
      filtered = filtered.filter((station) => station.network === networkFilter)
    }

    setFilteredStations(filtered)
  }

  const handleStatusChange = async (stationId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/stations/${stationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStations((prev) =>
          prev.map((station) => (station._id === stationId ? { ...station, status: newStatus as any } : station)),
        )
      }
    } catch (error) {
      console.error("Failed to update station status:", error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const validStations = useMemo(() => {
    return filteredStations.filter((s) => {
      if (!s?.location?.coordinates || !Array.isArray(s.location.coordinates)) return false
      const [lng, lat] = s.location.coordinates
      return isFinite(lat) && isFinite(lng)
    })
  }, [filteredStations])

  const uniqueNetworks = [...new Set(stations.map((s) => s.network))].filter(Boolean)

  const mapCenter = useMemo(() => {
    if (validStations.length) {
      const sum = validStations.reduce(
        (acc, s) => {
          const [lng, lat] = s.location.coordinates
          acc.lat += lat
          acc.lng += lng
          return acc
        },
        { lat: 0, lng: 0 },
      )
      return {
        lat: sum.lat / validStations.length,
        lng: sum.lng / validStations.length,
      }
    }
    return { lat: 34.0, lng: 9.0 }
  }, [validStations])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Station Map</h2>
        </div>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Station Map</h2>
          <p className="text-gray-600">Interactive map view of all charging stations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <MapPin className="h-3 w-3 mr-1" />
            {validStations.length} Stations
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchStations} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Active Stations",
            value: stations.filter((s) => s.status === "active").length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            title: "Maintenance",
            value: stations.filter((s) => s.status === "maintenance").length,
            icon: AlertTriangle,
            color: "text-yellow-600",
            bg: "bg-yellow-100",
          },
          {
            title: "Inactive",
            value: stations.filter((s) => s.status === "inactive").length,
            icon: XCircle,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            title: "Total Connectors",
            value: stations.reduce((sum, s) => sum + s.connectors.length, 0),
            icon: Zap,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
        ].map((stat, i) => (
          <TiltCard key={i} className="bg-white border border-gray-100 shadow-sm">
            <Card className="border-none shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search stations by name, network, owner, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {uniqueNetworks.map((network) => (
                  <SelectItem key={network} value={network}>
                    {network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <TiltCard className="bg-white border border-gray-100 shadow-lg">
        <Card className="border-none shadow-none">
          <CardContent className="p-0">
            <div style={{ height }} className={`w-full relative rounded-lg overflow-hidden ${className}`}>
              {validStations.length > 0 && (
                <MapContainer
                  key={`admin-${mapCenter.lat}-${mapCenter.lng}`}
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={8}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                  preferCanvas
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <AdminFitBounds stations={validStations} />
                  {validStations.map((station) => {
                    const [lng, lat] = station.location.coordinates
                    const availableConnectors = station.connectors.filter((c) => c.status === "available").length
                    const totalConnectors = station.connectors.length

                    return (
                      <Marker
                        key={station._id}
                        position={[lat, lng]}
                        icon={adminIconFactory(station.status, totalConnectors, availableConnectors)}
                        eventHandlers={{
                          click: () => setSelectedStation(station),
                        }}
                      >
                        <Popup className="custom-popup" maxWidth={350}>
                          <div className="space-y-3 text-sm max-w-sm p-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-lg text-gray-900">{station.stationName}</div>
                                <div className="text-gray-600">{station.network}</div>
                              </div>
                              <Badge className={getStatusBadgeColor(station.status)}>{station.status}</Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Owner: {station.ownerName}</span>
                              </div>
                              {station.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {[station.address.city, station.address.state].filter(Boolean).join(", ")}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {availableConnectors}/{totalConnectors} connectors available
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {station.stats.totalSessions} sessions • DT{station.stats.totalRevenue} revenue
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-200">
                              <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              {station.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(station._id, "inactive")}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Disable
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(station._id, "active")}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Enable
                                </Button>
                              )}
                            </div>
                          </div>
                        </Popup>
                        <Tooltip direction="top" offset={[0, -12]} opacity={0.95} className="text-xs">
                          <div className="font-medium text-gray-800">
                            {station.stationName} ({availableConnectors}/{totalConnectors})
                          </div>
                        </Tooltip>
                      </Marker>
                    )
                  })}
                </MapContainer>
              )}

              {validStations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
                  <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-lg font-semibold text-gray-900 mb-2">No stations found</div>
                    <div className="text-sm text-gray-600">
                      {searchTerm || statusFilter !== "all" || networkFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "No stations with valid coordinates available."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TiltCard>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Map Legend</h3>
            <div className="text-xs text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { status: "active", label: "Active Station", color: "#059669" },
              { status: "maintenance", label: "Under Maintenance", color: "#f59e0b" },
              { status: "inactive", label: "Inactive Station", color: "#6b7280" },
              { status: "pending", label: "Pending Approval", color: "#3b82f6" },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ background: item.color }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
