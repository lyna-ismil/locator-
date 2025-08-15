"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import MapTunisia from "@/components/map/tunisia-map"
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
  Star,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
} from "lucide-react"
import type { CarOwner, Station, Preferences, Connector } from "../types"

// Integrate with backend via gateway
const api = {
  getStations: async (
    location: { lat: number; lng: number },
    connectors: string[],
    preferences?: Preferences,
  ): Promise<Station[]> => {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      connectors: connectors.join(","),
      ...(preferences?.preferredNetworks?.length
        ? { networks: preferences.preferredNetworks.join(",") }
        : {}),
      ...(preferences?.requiredAmenities?.length
        ? { amenities: preferences.requiredAmenities.join(",") }
        : {}),
    })
    const res = await fetch(`http://localhost:5000/stations/nearby?${params.toString()}`)
    if (!res.ok) throw new Error("Failed to fetch stations")
    return await res.json()
  },
  toggleFavorite: async (stationId: string, isFav: boolean) => {
    // You may want to call your backend here
    return { success: true }
  },
}

type ViewMode = "map" | "list"
type SortOption = "distance" | "price" | "availability" | "rating"

export default function StationDiscovery({
  user,
  location,
  onSelectStation,
  favorites,
  setFavorites,
}: {
  user: CarOwner
  location: { lat: number; lng: number }
  onSelectStation: (station: Station) => void
  favorites: string[]
  setFavorites: (ids: string[]) => void
}) {
  const [stations, setStations] = useState<Station[]>([])
  const [filteredStations, setFilteredStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [sortBy, setSortBy] = useState<SortOption>("distance")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    maxDistance: 10,
    minPower: 0,
    networks: [] as string[],
    amenities: [] as string[],
    availableOnly: false,
  })

  const availableNetworks = ["ChargePoint", "Tesla", "EVgo", "Electrify America", "IONITY"]
  const availableAmenities = ["WiFi", "Coffee", "Food", "Shopping", "Restrooms", "Parking"]

  useEffect(() => {
    async function fetchStations() {
      setLoading(true)
      const connectors = [user.vehicleDetails.primaryConnector, ...(user.vehicleDetails.adapters || [])]
      try {
        const stationsData = await api.getStations(location, connectors, user.preferences)
        setStations(stationsData)
      } catch (err) {
        setStations([])
      }
      setLoading(false)
    }
    fetchStations()
  }, [location, user])

  useEffect(() => {
    let filtered = [...stations]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply filters
    if (filters.maxDistance > 0) {
      filtered = filtered.filter((station) => (station.distance ?? 0) <= filters.maxDistance)
    }

    if (filters.minPower > 0) {
      filtered = filtered.filter((station) => station.connectors.some((c: Connector) => c.power >= filters.minPower))
    }

    if (filters.networks.length > 0) {
      filtered = filtered.filter((station) => filters.networks.includes(station.network))
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter((station) =>
        filters.amenities.every((amenity) => station.amenities?.includes(amenity)),
      )
    }

    if (filters.availableOnly) {
      filtered = filtered.filter((station) => station.availability > 0)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const favA = favorites.includes(a.id) ? -1 : 0
      const favB = favorites.includes(b.id) ? -1 : 0
      if (favA !== favB) return favA - favB

      switch (sortBy) {
        case "distance":
          return (a.distance ?? 0) - (b.distance ?? 0)
        case "price":
          return Number.parseFloat(a.pricing.split(" ")[0]) - Number.parseFloat(b.pricing.split(" ")[0])
        case "availability":
          return b.availability - a.availability
        case "rating":
          return (b.reviews?.[0]?.rating ?? 0) - (a.reviews?.[0]?.rating ?? 0)
        default:
          return 0
      }
    })

    setFilteredStations(filtered)
  }, [stations, searchQuery, filters, sortBy, favorites])

  function toggleFavorite(stationId: string) {
    const isFav = favorites.includes(stationId)
    api.toggleFavorite(stationId, !isFav)
    setFavorites(isFav ? favorites.filter((id) => id !== stationId) : [...favorites, stationId])
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-emerald-300 overflow-hidden"
        onClick={() => onSelectStation(station)}
      >
        <CardContent className="p-0">
          {/* Station Image */}
          <div className="relative h-32 bg-gradient-to-br from-emerald-100 to-lime-100">
            <img
              src={station.photos?.[0] || "/placeholder.svg?height=128&width=400&query=charging station"}
              alt={station.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge className="bg-white/90 text-gray-700 text-xs">{station.distance?.toFixed(1)} km</Badge>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 bg-white/90 hover:bg-white ${
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

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">{station.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline" className="text-xs">
                    {station.network}
                  </Badge>
                  {station.reviews?.[0] && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{station.reviews[0].rating}</span>
                      <span className="text-xs text-gray-400">({station.reviews[0].count})</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-emerald-600">{station.pricing}</div>
                <div className="text-xs text-gray-500">{station.operatingHours}</div>
              </div>
            </div>

            {/* Connectors */}
            <div className="flex flex-wrap gap-2 mb-3">
              {station.connectors.map((connector: Connector) => (
                <div key={connector.id} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg text-xs">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(connector.status)}`} />
                  <span className="font-medium">{connector.type}</span>
                  <span className="text-gray-500">{connector.power}kW</span>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {station.amenities?.slice(0, 4).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full text-xs text-emerald-700"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
                {station.amenities && station.amenities.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{station.amenities.length - 4}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-emerald-600 font-medium">{station.availability} available</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with Search and Controls */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search stations, networks, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              {filteredStations.length} stations
            </Badge>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="h-8 px-3"
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Distance (km)</Label>
                  <Input
                    type="number"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min Power (kW)</Label>
                  <Input
                    type="number"
                    value={filters.minPower}
                    onChange={(e) => setFilters({ ...filters, minPower: Number(e.target.value) })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Networks</Label>
                  <Select
                    value={filters.networks.join(",")}
                    onValueChange={(value) => setFilters({ ...filters, networks: value ? value.split(",") : [] })}
                  >
                    <SelectTrigger className="h-10">
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
          <>
            <MapTunisia center={location} stations={filteredStations} onMarkerClick={onSelectStation} />
            {/* Floating Station List */}
            <div className="absolute bottom-4 left-4 right-4 max-h-64 overflow-hidden">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Nearby Stations
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      <span className="ml-3 text-gray-600">Finding stations...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredStations.slice(0, 3).map((station) => (
                        <div
                          key={station.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-emerald-300 transition-colors"
                          onClick={() => onSelectStation(station)}
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{station.name}</h5>
                            <p className="text-sm text-gray-600">
                              {station.distance?.toFixed(1)} km • {station.pricing}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              {station.availability} available
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${
                                favorites.includes(station.id) ? "text-yellow-500" : "text-gray-400"
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
          </>
        ) : (
          <div className="p-4 overflow-y-auto h-full">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <span className="ml-4 text-lg text-gray-600">Finding stations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
