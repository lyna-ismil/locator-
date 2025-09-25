"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MapPin,
  Search,
  Filter,
  Eye,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Plus,
} from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"
import { AddStationModal } from "@/app/dashboard/owner/_components/AddStationModal"

interface Station {
  _id: string
  stationName: string
  network: string
  ownerId: string
  ownerName?: string
  ownerEmail?: string
  location?: {
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
  operatingHours?: any
  pricing?: {
    perkWh?: number
    perHour?: number
    sessionFee?: number
  }
  amenities?: Record<string, boolean>
  status: "active" | "inactive" | "maintenance" | "pending"
  createdAt: string
  lastActivity?: string
  stats: {
    totalSessions: number
    totalRevenue: number
    averageRating: number
    utilizationRate: number
  }
}

export default function StationManagement() {
  const [stations, setStations] = useState<Station[]>([])
  const [filteredStations, setFilteredStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [showStationDetails, setShowStationDetails] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchStations()
  }, [])

  useEffect(() => {
    filterStations()
  }, [stations, searchTerm, statusFilter, networkFilter])

  // Fetch stations directly, owner info comes from station fields
  const fetchStations = async () => {
    try {
      setIsLoading(true)
      const stationsRes = await fetch("http://localhost:5000/stations")
      const stationsData = stationsRes.ok ? await stationsRes.json() : []

      const processedStations = stationsData.map((station: any) => {
        const totalConnectors = station.connectors?.length || 0
        const activeConnectors = station.connectors?.filter((c: any) => c.status === "available").length || 0
        const utilizationRate = totalConnectors > 0 ? (activeConnectors / totalConnectors) * 100 : 0

        return {
          _id: station._id,
          stationName: station.stationName || "Unnamed Station",
          network: station.network || "Independent",
          ownerId: station.ownerId,
          ownerName: station.ownerId || "Unknown Owner", // If you store name, use it here
          ownerEmail: station.email || "No email",
          location: station.location,
          address: station.address,
          connectors: station.connectors || [],
          operatingHours: station.operatingHours,
          pricing: station.pricing,
          amenities: station.amenities,
          status: station.status || "active",
          createdAt: station.createdAt || new Date().toISOString(),
          lastActivity: station.lastActivity || station.updatedAt || new Date().toISOString(),
          stats: {
            totalSessions: station.stats?.totalSessions || 0,
            totalRevenue: station.stats?.totalRevenue || 0,
            averageRating: station.stats?.averageRating || 0,
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

  const getStatusColor = (status: string) => {
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

  const getConnectorStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" }
      case "busy":
        return { icon: Zap, color: "text-blue-600", bg: "bg-blue-100" }
      case "offline":
        return { icon: WifiOff, color: "text-red-600", bg: "bg-red-100" }
      case "maintenance":
        return { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100" }
      default:
        return { icon: XCircle, color: "text-gray-600", bg: "bg-gray-100" }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const uniqueNetworks = [...new Set(stations.map((s) => s.network))].filter(Boolean)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Station Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Add this handler to refresh stations after adding
  const handleStationAdded = (station?: any) => {
    setShowAddModal(false)
    fetchStations()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Station Management</h2>
          <p className="text-gray-600">Monitor and manage all charging stations across the network</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
            <Wifi className="h-4 w-4" />
            Online
          </div>
          <Button variant="outline" size="sm" onClick={fetchStations} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-emerald-600 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Add Station Modal */}
      <AddStationModal
        open={showAddModal}
        setOpen={setShowAddModal}
        onStationAdded={handleStationAdded}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Stations",
            value: stations.length,
            icon: MapPin,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Active Stations",
            value: stations.filter((s) => s.status === "active").length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            title: "Total Connectors",
            value: stations.reduce((sum, s) => sum + s.connectors.length, 0),
            icon: Zap,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            title: "Total Revenue",
            value: `DT${stations.reduce((sum, s) => sum + s.stats.totalRevenue, 0).toFixed(2)}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
          },
        ].map((stat, i) => (
          <TiltCard key={i} className="bg-white border border-gray-100 shadow-sm">
            <Card className="border-none shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
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
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by network" />
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

      {/* Stations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStations.map((station) => (
          <TiltCard key={station._id} className="bg-white border border-gray-100 shadow-sm">
            <Card className="border-none shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{station.stationName}</h3>
                      <p className="text-sm text-gray-600">{station.network}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <UserCheck className="h-3 w-3 mr-1" />
                          {station.ownerName}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {station.address?.city}, {station.address?.state}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Added {formatDate(station.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Connectors Info */}
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {station.connectors.length} connector{station.connectors.length !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {station.connectors.slice(0, 3).map((connector, idx) => {
                          const statusInfo = getConnectorStatusIcon(connector.status)
                          const IconComponent = statusInfo.icon
                          return (
                            <div key={idx} className={`p-1 rounded-full ${statusInfo.bg}`}>
                              <IconComponent className={`h-3 w-3 ${statusInfo.color}`} />
                            </div>
                          )
                        })}
                        {station.connectors.length > 3 && (
                          <span className="text-xs text-gray-500">+{station.connectors.length - 3}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{station.stats.totalSessions} sessions</div>
                      <div className="text-xs text-gray-500">
                        ${station.stats.totalRevenue} • {station.stats.averageRating}★ • {station.stats.utilizationRate}
                        %
                      </div>
                    </div>

                    {/* Status */}
                    <Badge className={getStatusColor(station.status)}>{station.status}</Badge>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Dialog
                        open={showStationDetails && selectedStation?._id === station._id}
                        onOpenChange={setShowStationDetails}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStation(station)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Station Details</DialogTitle>
                          </DialogHeader>
                          {selectedStation && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Station Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Name:</span>
                                      <p className="font-medium">{selectedStation.stationName}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Network:</span>
                                      <p className="font-medium">{selectedStation.network}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Status:</span>
                                      <Badge className={getStatusColor(selectedStation.status)}>
                                        {selectedStation.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Address:</span>
                                      <p className="font-medium">
                                        {selectedStation.address
                                          ? [
                                              selectedStation.address.street,
                                              selectedStation.address.city,
                                              selectedStation.address.state,
                                              selectedStation.address.zipCode,
                                            ]
                                              .filter(Boolean)
                                              .join(", ")
                                          : "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Owner Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Owner:</span>
                                      <p className="font-medium">{selectedStation.ownerName}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Email:</span>
                                      <p className="font-medium">{selectedStation.ownerEmail}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Created:</span>
                                      <p className="font-medium">{formatDate(selectedStation.createdAt)}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Last Activity:</span>
                                      <p className="font-medium">
                                        {selectedStation.lastActivity
                                          ? formatDate(selectedStation.lastActivity)
                                          : "No recent activity"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Connectors */}
                              <div>
                                <h4 className="font-semibold mb-3">Connectors ({selectedStation.connectors.length})</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {selectedStation.connectors.map((connector, idx) => {
                                    const statusInfo = getConnectorStatusIcon(connector.status)
                                    const IconComponent = statusInfo.icon
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className={`p-2 rounded-full ${statusInfo.bg}`}>
                                            <IconComponent className={`h-4 w-4 ${statusInfo.color}`} />
                                          </div>
                                          <div>
                                            <div className="font-medium">{connector.type}</div>
                                            <div className="text-sm text-gray-500">{connector.powerKW} kW</div>
                                          </div>
                                        </div>
                                        <Badge className={getStatusColor(connector.status)}>{connector.status}</Badge>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              <Separator />

                              {/* Statistics */}
                              <div>
                                <h4 className="font-semibold mb-3">Performance Statistics</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {selectedStation.stats.totalSessions}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Sessions</div>
                                  </div>
                                  <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                      DT{selectedStation.stats.totalRevenue}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Revenue</div>
                                  </div>
                                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-600">
                                      {selectedStation.stats.averageRating}
                                    </div>
                                    <div className="text-sm text-gray-600">Average Rating</div>
                                  </div>
                                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {selectedStation.stats.utilizationRate}%
                                    </div>
                                    <div className="text-sm text-gray-600">Utilization Rate</div>
                                  </div>
                                </div>
                              </div>

                              {/* Pricing & Amenities */}
                              {(selectedStation.pricing || selectedStation.amenities) && (
                                <>
                                  <Separator />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedStation.pricing && (
                                      <div>
                                        <h4 className="font-semibold mb-3">Pricing</h4>
                                        <div className="space-y-2 text-sm">
                                          {selectedStation.pricing.perkWh && (
                                            <div className="flex justify-between">
                                              <span>Per kWh:</span>
                                              <span className="font-medium">DT{selectedStation.pricing.perkWh}</span>
                                            </div>
                                          )}
                                          {selectedStation.pricing.perHour && (
                                            <div className="flex justify-between">
                                              <span>Per Hour:</span>
                                              <span className="font-medium">DT{selectedStation.pricing.perHour}</span>
                                            </div>
                                          )}
                                          {selectedStation.pricing.sessionFee && (
                                            <div className="flex justify-between">
                                              <span>Session Fee:</span>
                                              <span className="font-medium">DT{selectedStation.pricing.sessionFee}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {selectedStation.amenities && (
                                      <div>
                                        <h4 className="font-semibold mb-3">Amenities</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {Object.entries(selectedStation.amenities)
                                            .filter(([_, value]) => value)
                                            .map(([key]) => (
                                              <Badge key={key} variant="secondary" className="text-xs">
                                                {key}
                                              </Badge>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Actions */}
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                {selectedStation.status === "active" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange(selectedStation._id, "inactive")}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate Station
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleStatusChange(selectedStation._id, "active")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate Station
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(selectedStation._id, "maintenance")}
                                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Set Maintenance
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {station.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(station._id, "inactive")}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(station._id, "active")}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stations found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || networkFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No stations have been registered yet."}
          </p>
        </div>
      )}
    </div>
  )
}
