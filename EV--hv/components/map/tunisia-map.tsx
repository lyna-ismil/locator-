"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Zap, MapPin, Star } from 'lucide-react'

export type Station = {
  id: number
  name: string
  position: LatLngExpression
  city: string
  connectors: Array<"Type 2" | "CCS" | "CHAdeMO" | "Tesla">
  speedKw: number
  available: number
  total: number
  price: string
  rating: number
}

export const STATIONS: Station[] = [
  { id: 1, name: "Tunis Centre - Avenue Habib", position: [36.8065, 10.1815], city: "Tunis", connectors: ["Type 2", "CCS"], speedKw: 150, available: 3, total: 6, price: "0.35 TND/kWh", rating: 4.8 },
  { id: 2, name: "La Marsa Coastal Hub", position: [36.8782, 10.3246], city: "La Marsa", connectors: ["Type 2"], speedKw: 22, available: 5, total: 8, price: "0.28 TND/kWh", rating: 4.4 },
  { id: 3, name: "Sfax Business Park", position: [34.7406, 10.7603], city: "Sfax", connectors: ["CCS", "CHAdeMO"], speedKw: 50, available: 2, total: 4, price: "0.31 TND/kWh", rating: 4.5 },
  { id: 4, name: "Sousse Mall FastCharge", position: [35.8256, 10.6369], city: "Sousse", connectors: ["CCS", "Tesla"], speedKw: 250, available: 1, total: 6, price: "0.42 TND/kWh", rating: 4.9 },
  { id: 5, name: "Bizerte Port Station", position: [37.2746, 9.8739], city: "Bizerte", connectors: ["Type 2", "CHAdeMO"], speedKw: 50, available: 2, total: 3, price: "0.30 TND/kWh", rating: 4.3 },
  { id: 6, name: "Nabeul City Centre", position: [36.4513, 10.735], city: "Nabeul", connectors: ["Type 2"], speedKw: 22, available: 4, total: 5, price: "0.26 TND/kWh", rating: 4.2 },
  { id: 7, name: "Kairouan Historic Stop", position: [35.6781, 10.0963], city: "Kairouan", connectors: ["Type 2", "CCS"], speedKw: 150, available: 2, total: 4, price: "0.36 TND/kWh", rating: 4.6 },
  { id: 8, name: "Gabes Oasis Station", position: [33.8815, 10.0982], city: "Gabes", connectors: ["CCS"], speedKw: 150, available: 1, total: 3, price: "0.38 TND/kWh", rating: 4.4 },
  { id: 9, name: "Gafsa Transit Hub", position: [34.425, 8.7842], city: "Gafsa", connectors: ["CHAdeMO"], speedKw: 50, available: 1, total: 2, price: "0.29 TND/kWh", rating: 4.0 },
  { id: 10, name: "Monastir Airport Station", position: [35.7777, 10.8262], city: "Monastir", connectors: ["CCS", "Tesla"], speedKw: 250, available: 2, total: 5, price: "0.41 TND/kWh", rating: 4.7 },
  { id: 11, name: "Djerba Houmt Souk", position: [33.875, 10.857], city: "Djerba", connectors: ["Type 2", "CCS"], speedKw: 150, available: 3, total: 5, price: "0.34 TND/kWh", rating: 4.5 },
]

function FitToMarkers({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    if (!positions.length) return
    const bounds = L.latLngBounds(positions as [number, number][])
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [positions, map])
  return null
}

type Props = {
  className?: string
  height?: number
  defaultConnector?: "all" | "Type 2" | "CCS" | "CHAdeMO" | "Tesla"
  defaultMinKw?: "any" | "22" | "50" | "150" | "250"
  batteryCapacityKwh?: number
  currentSoC?: number
  vehicleMaxKw?: number
}

export default function MapTunisia({
  className,
  height = 480,
  defaultConnector = "all",
  defaultMinKw = "any",
  batteryCapacityKwh = 60,
  currentSoC = 30,
  vehicleMaxKw = 150,
}: Props) {
  const [connector, setConnector] = useState<typeof defaultConnector>(defaultConnector)
  const [minKw, setMinKw] = useState<typeof defaultMinKw>(defaultMinKw)
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const filtered = useMemo(() => {
    return STATIONS.filter((s) => {
      if (connector !== "all" && !s.connectors.includes(connector)) return false
      const minKwNum = minKw === "any" ? 0 : Number(minKw)
      if (s.speedKw < minKwNum) return false
      if (onlyAvailable && s.available <= 0) return false
      return true
    })
  }, [connector, minKw, onlyAvailable])

  const center: LatLngExpression = [33.8869, 9.5375] // Tunisia

  function colorBySpeed(kw: number) {
    if (kw >= 200) return "#059669" // emerald-600
    if (kw >= 100) return "#10b981" // emerald-500
    if (kw >= 50) return "#f59e0b" // amber-500
    return "#eab308" // amber-400
  }

  function estimateMinutes(stationKw: number) {
    const effKw = Math.min(vehicleMaxKw || Infinity, stationKw)
    const energyNeeded = batteryCapacityKwh * (1 - (currentSoC ?? 0) / 100)
    if (!(effKw > 0) || !(energyNeeded > 0)) return Infinity
    return (energyNeeded / effKw) * 60
  }

  function fmtEta(mins: number) {
    if (!Number.isFinite(mins) || mins <= 0) return "-"
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    if (h <= 0) return `${m} min`
    return `${h}h ${m}m`
  }

  return (
    <div className={cn("w-full rounded-2xl border border-gray-100 shadow-sm bg-white", className)}>
      {/* Header / Controls */}
      <div className="p-4 border-b flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold leading-none">Tunisia Charging Map</div>
            <div className="text-xs text-gray-500">
              Battery {batteryCapacityKwh} kWh · {currentSoC}% now · Vehicle max {vehicleMaxKw} kW
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Connector</Label>
            <Select value={connector} onValueChange={(v) => setConnector(v as any)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Type 2">Type 2</SelectItem>
                <SelectItem value="CCS">CCS</SelectItem>
                <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                <SelectItem value="Tesla">Tesla</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-600">Min kW</Label>
            <Select value={minKw} onValueChange={(v) => setMinKw(v as any)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="22">22 kW</SelectItem>
                <SelectItem value="50">50 kW</SelectItem>
                <SelectItem value="150">150 kW</SelectItem>
                <SelectItem value="250">250 kW</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="only-available" checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
            <Label htmlFor="only-available" className="text-sm text-gray-700">
              Only available
            </Label>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            {filtered.length} stations
          </Badge>
        </div>
      </div>

      {/* Map */}
      <div style={{ height }}>
        <MapContainer center={center} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitToMarkers positions={filtered.map((s) => s.position)} />
          {filtered.map((s) => {
            const eta = estimateMinutes(s.speedKw)
            const effective = Math.min(vehicleMaxKw || Infinity, s.speedKw)
            return (
              <CircleMarker
                key={s.id}
                center={s.position}
                radius={10}
                pathOptions={{
                  color: colorBySpeed(s.speedKw),
                  fillColor: colorBySpeed(s.speedKw),
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-1">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {s.city}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{s.speedKw} kW</span> • {s.connectors.join(", ")}
                    </div>
                    <div className="text-sm">
                      Availability: <span className="text-emerald-600 font-medium">{s.available}</span>/{s.total}
                    </div>
                    <div className="text-sm">Price: {s.price}</div>
                    <div className="text-sm">Effective: {effective} kW</div>
                    <div className="text-sm">Est. to 100%: {fmtEta(eta)}</div>
                    <div className="text-sm flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                      {s.rating.toFixed(1)}
                    </div>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${(s.position as [number, number])[0]},${(s.position as [number, number])[1]}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline text-sm mt-1"
                    >
                      Navigate
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
