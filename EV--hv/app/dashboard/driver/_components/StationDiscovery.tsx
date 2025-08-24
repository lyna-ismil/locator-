"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Wifi,
  Coffee,
  Utensils,
  ShoppingBag,
  MapPin,
  Heart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
  X,
} from "lucide-react"
import type { CarOwner, ConnectorType, Station, Connector } from "../types"

const DashboardMap = dynamic(() => import("@/components/map/dashboard-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Loading map...</div>
  ),
})

type ViewMode = "map" | "list"
type SortOption = "distance" | "price" | "availability" | "rating"

interface Props {
  user: CarOwner
  location: { lat: number; lng: number } | null
  stations: Station[] // optional (fallback if provided)
  onSelectStation: (station: Station) => void
  favorites: string[]
  setFavorites: (ids: string[]) => void
}

const MAP_HEIGHT = "450px"

/* --- Helpers inserted here --- */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function adaptBackendStation(raw: any, userLoc: { lat: number; lng: number } | null): Station {
  const coord = raw?.location?.coordinates
  const lng = Array.isArray(coord) && isFinite(coord?.[0]) ? +coord[0] : undefined
  const lat = Array.isArray(coord) && isFinite(coord?.[1]) ? +coord[1] : undefined

  const connectors = (raw.connectors || []).map((c: any, idx: number) => ({
    id: c._id || `${raw._id}-c${idx}`,
    type: c.type,
    power: c.powerKW,
    status: (c.status || "").toLowerCase(),
  }))

  const amenitiesArr: string[] = []
  if (raw.amenities) {
    Object.entries(raw.amenities).forEach(([k, v]) => {
      if (v) amenitiesArr.push(k.charAt(0).toUpperCase() + k.slice(1))
    })
  }

  let pricingDisplay = ""
  if (raw.pricing) {
    const parts: string[] = []
    if (raw.pricing.perkWh) parts.push(`${raw.pricing.perkWh} /kWh`)
    if (raw.pricing.perHour) parts.push(`${raw.pricing.perHour}/h`)
    if (raw.pricing.sessionFee) parts.push(`Fee ${raw.pricing.sessionFee}`)
    pricingDisplay = parts.join(" • ") || raw.pricing.notes || ""
  }

  let distance: number | undefined
  if (userLoc && typeof lat === "number" && typeof lng === "number") {
    distance = haversine(userLoc.lat, userLoc.lng, lat, lng)
  }

  return {
    id: raw._id || raw.id,
    name: raw.stationName || raw.name || "Unnamed",
    network: raw.network || "Unknown",
    address: `${raw.address?.street || ""} ${raw.address?.city || ""}`.trim(),
    distance,
    pricing: pricingDisplay,
    availability: connectors.filter((c) => c.status === "available").length,
    operatingHours: "",
    connectors,
    amenities: amenitiesArr,
    photos: raw.photoUrl ? [raw.photoUrl] : [],
    location: {
      lat: lat ?? 0,
      lng: lng ?? 0,
    },
  }
}
/* --- End helpers --- */

export default function StationDiscovery({
  user,
  location,
  stations,
  onSelectStation,
  favorites,
  setFavorites,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [sortBy, setSortBy] = useState<SortOption>("distance")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    maxDistance: 10,
    minPower: 0,
    networks: [] as string[],
    amenities: [] as string[],
    availableOnly: false,
  })

  // New backend integration state
  const [backendStations, setBackendStations] = useState<Station[]>([])
  const [loadingStations, setLoadingStations] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  function normalizeConnector(t?: string): ConnectorType | string {
    if (!t) return ""
    const up = t.replace(/[\s_-]/g, "").toUpperCase()
    if (up === "TYPE2" || up === "MENNEKES") return "TYPE2"
    if (up === "TYPE1" || up === "J1772") return "TYPE1"
    if (up.startsWith("CCS2")) return "CCS2"
    if (up.startsWith("CCS1")) return "CCS1"
    if (up.startsWith("CCS")) return "CCS"
    if (up === "CHADEMO") return "CHADEMO"
    if (up === "TESLA") return "TESLA"
    if (up === "GBT" || up === "GB_T") return "GB_T"
    if (up.includes("SCHUKO")) return "SCHUKO"
    return up
  }

  // Extend fetchNearby to send driver connector preferences
  const fetchNearby = useCallback(async () => {
    if (!location) return
    try {
      setLoadingStations(true)
      setLoadError(null)
      const base = (process.env.NEXT_PUBLIC_STATION_SERVICE_URL || "http://localhost:5000").replace(/\/+$/, "")
      const driverConnectors = [user?.vehicle?.primaryConnector, ...(user?.vehicle?.adapters || [])]
        .filter(Boolean)
        .join(",")
      const radius = 10000
      const url = `${base}/stations/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}&connectors=${encodeURIComponent(driverConnectors)}`
      console.debug("[fetchNearby] GET", url)
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const text = await res.text()
          msg += `: ${text}`
          console.error("[fetchNearby] body:", text)
        } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      const adapted = data
        .map((d: any) => adaptBackendStation(d, location))
        .filter((s: Station) => isFinite(s.location.lat) && isFinite(s.location.lng))
      setBackendStations(adapted)
    } catch (e: any) {
      setLoadError(e.message || "Error loading stations")
    } finally {
      setLoadingStations(false)
    }
  }, [location, user?.vehicle?.primaryConnector, user?.vehicle?.adapters])

  useEffect(() => {
    fetchNearby()
  }, [fetchNearby])

  // Normalize stations passed in via props (they may be raw backend objects)
  const normalizedPropStations = useMemo(() => {
    if (!stations || !stations.length) return []
    return stations.map((s) => {
      // detect already-normalized shape: has location.lat and pricing is a string
      if (s?.location && typeof s.location.lat === "number" && typeof s.pricing === "string") {
        return s
      }
      // otherwise adapt the backend shape into the normalized Station shape
      return adaptBackendStation(s, location)
    })
  }, [stations, location])

  // Use provided (and normalized) stations if present, otherwise use backendStations
  const combinedStations = useMemo(
    () => (normalizedPropStations.length ? normalizedPropStations : backendStations),
    [normalizedPropStations, backendStations],
  )

  const filteredStations = useMemo(() => {
    if (!combinedStations.length) return []

    // combinedStations already contains normalized stations
    let filtered = [...combinedStations]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.network.toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q),
      )
    }

    if (filters.maxDistance > 0) filtered = filtered.filter((s: any) => (s.distance ?? 0) <= filters.maxDistance)

    if (filters.minPower > 0)
      filtered = filtered.filter((s: any) => s.connectors.some((c: any) => c.power >= filters.minPower))

    if (filters.networks.length) filtered = filtered.filter((s: any) => filters.networks.includes(s.network))

    if (filters.amenities.length)
      filtered = filtered.filter((s: any) => filters.amenities.every((a) => s.amenities?.includes(a)))

    if (filters.availableOnly) filtered = filtered.filter((s: any) => (s.availability ?? 0) > 0)

    // In filteredStations memo add compatibility filter (before sorting)
    if (user?.vehicle?.primaryConnector) {
      const owned = new Set([user.vehicle.primaryConnector, ...(user.vehicle.adapters || [])].map(normalizeConnector))

      filtered = filtered.filter((s: any) => s.connectors?.some((c: any) => owned.has(normalizeConnector(c.type))))
    }

    filtered.sort((a: any, b: any) => {
      const favA = favorites.includes(a.id) ? -1 : 0
      const favB = favorites.includes(b.id) ? -1 : 0
      if (favA !== favB) return favA - favB
      switch (sortBy) {
        case "distance":
          return (a.distance ?? 0) - (b.distance ?? 0)
        case "price":
          return Number.parseFloat(a.pricing?.split(" ")[0] || "0") - Number.parseFloat(b.pricing?.split(" ")[0] || "0")
        case "availability":
          return (b.availability ?? 0) - (a.availability ?? 0)
        case "rating":
          return (b.reviews?.[0]?.rating ?? 0) - (a.reviews?.[0]?.rating ?? 0)
        default:
          return 0
      }
    })

    return filtered
  }, [
    combinedStations,
    searchQuery,
    filters,
    sortBy,
    favorites,
    user?.vehicle?.primaryConnector,
    user?.vehicle?.adapters,
  ])

  function toggleFavorite(stationId: string) {
    setFavorites(favorites.includes(stationId) ? favorites.filter((id) => id !== stationId) : [...favorites, stationId])
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="w-4 h-4" />
      case "coffee":
        return <Coffee className="w-4 h-4" />
      case "food":
        return <Utensils className="w-4 h-4" />
      case "shopping":
        return <ShoppingBag className="w-4 h-4" />
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500"
      case "busy":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const StationCard = ({ station }: { station: Station }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/95 overflow-hidden group ${
          selectedStationId === station.id ? "ring-2 ring-emerald-500 shadow-2xl" : ""
        }`}
        onClick={() => handleStationSelect(station)}
      >
        <CardContent className="p-0">
          <div className="relative h-36 bg-gradient-to-br from-emerald-400 via-lime-300 to-yellow-200 overflow-hidden">
            <img
              src={station.photos?.[0] || "/placeholder.svg?height=144&width=400&query=modern charging station"}
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-medium shadow-lg border-0">
                {station.distance?.toFixed(1)} km
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg border-0 ${
                  favorites.includes(station.id)
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-gray-400 hover:text-yellow-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(station.id)
                }}
              >
                <Heart className={`w-4 h-4 ${favorites.includes(station.id) ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-emerald-700 transition-colors">
                  {station.name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {station.network}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  {station.pricing}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {station.connectors.map((connector: Connector) => (
                <div
                  key={connector.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-xs shadow-sm border border-gray-100"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(connector.status)} shadow-sm`} />
                  <span className="font-semibold text-gray-700">{connector.type}</span>
                  <span className="text-gray-500 font-medium">{connector.power}kW</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {station.amenities?.slice(0, 4).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-lime-50 rounded-full text-xs text-emerald-700 border border-emerald-100"
                  >
                    {getAmenityIcon(amenity)}
                    <span className="font-medium">{amenity}</span>
                  </div>
                ))}
                {station.amenities && station.amenities.length > 4 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    +{station.amenities.length - 4}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-700 font-semibold">{station.availability} available</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const handleStationSelect = useCallback(
    (station: Station) => {
      // Clear any existing selection first to prevent overlaps
      setSelectedStationId(null)

      // Small delay to ensure cleanup, then set new selection
      setTimeout(() => {
        setSelectedStationId(station.id)
        onSelectStation(station)
      }, 50)
    },
    [onSelectStation],
  )

  const clearStationSelection = useCallback(() => {
    setSelectedStationId(null)
  }, [])

  const renderMap = () => {
    if (!location) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">Detecting your location...</div>
      )
    }
    return (
      <DashboardMap
        center={location}
        stations={filteredStations}
        height={MAP_HEIGHT}
        onMarkerClick={(id: string) => {
          const st = filteredStations.find((s) => s.id === id)
          if (st) handleStationSelect(st)
        }}
        userLocation={location}
        showUserLocation={true}
        selectedStationId={selectedStationId}
      />
    )
  }

  const availableNetworks = ["ChargePoint", "Tesla", "EVgo", "IONITY"]

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 p-4 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search stations, networks, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm shadow-sm"
          />
        </div>
        {loadingStations && (
          <div className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full inline-block">
            Loading nearby stations...
          </div>
        )}
        {loadError && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full inline-block">
            Failed to load stations: {loadError}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 shadow-sm ${showFilters ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white/80 backdrop-blur-sm hover:bg-white"}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="availability">Availability</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 font-semibold shadow-sm border border-emerald-200"
            >
              {filteredStations.length} stations
            </Badge>
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-gray-200">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className={`h-8 px-3 rounded-lg ${viewMode === "map" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : "hover:bg-gray-100"}`}
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-8 px-3 rounded-lg ${viewMode === "list" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : "hover:bg-gray-100"}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200/50 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Max Distance (km)</Label>
                  <Input
                    type="number"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                    className="h-10 bg-white/80 backdrop-blur-sm shadow-sm border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Min Power (kW)</Label>
                  <Input
                    type="number"
                    value={filters.minPower}
                    onChange={(e) => setFilters({ ...filters, minPower: Number(e.target.value) })}
                    className="h-10 bg-white/80 backdrop-blur-sm shadow-sm border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Networks</Label>
                  <Select
                    value={filters.networks.join(",")}
                    onValueChange={(value) => setFilters({ ...filters, networks: value ? value.split(",") : [] })}
                  >
                    <SelectTrigger className="h-10 bg-white/80 backdrop-blur-sm shadow-sm border-gray-200">
                      <SelectValue placeholder="All networks" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNetworks.map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {viewMode === "map" ? (
          <div className="flex flex-col h-full">
            {/* Map Container */}
            <div className="flex-1 min-h-0 relative">
              <div style={{ height: MAP_HEIGHT }} className="w-full">
                {renderMap()}
              </div>

              {selectedStationId && (
                <div className="absolute inset-0 z-10 pointer-events-none" onClick={clearStationSelection} />
              )}
            </div>

            {/* Details Section - No longer overlapping */}
            <div className="flex-shrink-0 p-4 relative z-20">
              <Card className="bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-lime-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      Nearby Stations
                    </CardTitle>
                    {selectedStationId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearStationSelection}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto">
                  {filteredStations.length === 0 ? (
                    <div className="py-6 text-sm text-gray-500 text-center">No stations match your filters.</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredStations.slice(0, 4).map((station, idx) => (
                        <div
                          key={station.id ?? station._id ?? station.stationId ?? `${station.name ?? "station"}-${idx}`}
                          className={`flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-200 group ${
                            selectedStationId === station.id
                              ? "border-emerald-500 bg-emerald-50/50 shadow-md"
                              : "border-gray-100"
                          }`}
                          onClick={() => handleStationSelect(station)}
                        >
                          <div className="flex-1">
                            <h5
                              className={`font-semibold transition-colors ${
                                selectedStationId === station.id
                                  ? "text-emerald-700"
                                  : "text-gray-900 group-hover:text-emerald-700"
                              }`}
                            >
                              {station.name}
                            </h5>
                            <p className="text-sm text-gray-600 font-medium">
                              {station.distance?.toFixed(1)} km • {station.pricing}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                              {station.availability} avail
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 rounded-lg ${
                                favorites.includes(station.id)
                                  ? "text-yellow-500 bg-yellow-50"
                                  : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(station.id)
                              }}
                            >
                              <Heart className={`w-4 h-4 ${favorites.includes(station.id) ? "fill-current" : ""}`} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto h-full">
            {filteredStations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="text-sm">No stations match your filters.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {filteredStations.map((station) => (
                    <StationCard key={station.id} station={station} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
