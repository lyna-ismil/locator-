"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"

interface Station {
  id: string
  name: string
  location: { lat: number; lng: number }
  availability?: number
  network?: string
  pricing?: string
  connectors?: any[]
  [k: string]: any
}

interface Props {
  center?: { lat: number; lng: number } | null
  stations: Station[]
  onMarkerClick?: (id: string) => void
  height?: string
  className?: string
  userLocation?: { lat: number; lng: number } | null
  showUserLocation?: boolean
}

function colorFromAvailability(a?: number) {
  if (a == null) return "#6b7280"
  if (a === 0) return "#dc2626"
  if (a === 1) return "#f59e0b"
  return "#059669"
}

const dashboardIconFactory = (() => {
  const cache = new Map<string, L.DivIcon>()
  return (color: string, availability?: number) => {
    const key = `${color}-${availability ?? "na"}`
    if (cache.has(key)) return cache.get(key)!
    const display = typeof availability === "number" ? `${availability}` : "⚡"
    const gradientColor =
      color === "#059669"
        ? "linear-gradient(135deg, #059669, #10b981)"
        : color === "#f59e0b"
          ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
          : color === "#dc2626"
            ? "linear-gradient(135deg, #dc2626, #ef4444)"
            : `linear-gradient(135deg, ${color}, ${color})`

    const icon = L.divIcon({
      className: "dashboard-station-pin",
      html: `<div style="
        width:24px;height:24px;border-radius:50%;
        background:${gradientColor};
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:10px;font-weight:700;
        box-shadow:0 0 0 2px rgba(255,255,255,0.9),0 3px 12px rgba(0,0,0,.2);
        border:1px solid rgba(255,255,255,0.8);
        transition:all 0.2s ease;
      ">${display}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
    cache.set(key, icon)
    return icon
  }
})()

const dashboardUserIcon = L.divIcon({
  className: "dashboard-user-pin",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:linear-gradient(135deg, #2563eb, #3b82f6);
    box-shadow:0 0 0 3px rgba(59,130,246,.25),0 0 0 4px rgba(255,255,255,.95),0 2px 8px rgba(0,0,0,.15);
    border:1px solid #fff;
    animation:pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function DashboardFitBounds({
  stations,
  center,
  userLocation,
}: {
  stations: Station[]
  center: { lat: number; lng: number }
  userLocation?: { lat: number; lng: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    const pts: L.LatLngExpression[] = []
    stations.forEach((s) => {
      if (s?.location && isFinite(s.location.lat) && isFinite(s.location.lng)) {
        pts.push([s.location.lat, s.location.lng])
      }
    })
    if (userLocation) pts.push([userLocation.lat, userLocation.lng])
    if (!pts.length) {
      map.setView([center.lat, center.lng], 10)
      return
    }
    if (pts.length === 1) {
      map.setView(pts[0], 15)
      return
    }
    const bounds = L.latLngBounds(pts)
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [stations, center, userLocation, map])
  return null
}

export default function DashboardMap({
  center,
  stations,
  onMarkerClick,
  height = "400px",
  className = "",
  userLocation,
  showUserLocation = true,
}: Props) {
  const validStations = useMemo(() => {
    if (!Array.isArray(stations)) return []
    return stations.filter((s) => s && s.location && isFinite(s.location.lat) && isFinite(s.location.lng))
  }, [stations])

  const effectiveCenter = useMemo(() => {
    if (center && isFinite(center.lat) && isFinite(center.lng)) return center
    if (validStations.length) {
      const sum = validStations.reduce(
        (acc, s) => {
          acc.lat += s.location.lat
          acc.lng += s.location.lng
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
  }, [center, validStations])

  const hasAnyCenter = effectiveCenter && isFinite(effectiveCenter.lat) && isFinite(effectiveCenter.lng)

  return (
    <div
      style={{ height }}
      className={`w-full relative rounded-lg overflow-hidden shadow-md border border-gray-200 ${className}`}
    >
      {hasAnyCenter && (
        <MapContainer
          key={`dashboard-${effectiveCenter.lat}-${effectiveCenter.lng}`}
          center={[effectiveCenter.lat, effectiveCenter.lng]}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          preferCanvas
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DashboardFitBounds
            stations={validStations}
            center={effectiveCenter}
            userLocation={showUserLocation ? userLocation || null : null}
          />
          {showUserLocation && userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={dashboardUserIcon}>
              <Tooltip direction="top" offset={[0, -4]} opacity={0.9} className="text-xs">
                <div className="font-medium text-blue-700">Your location</div>
              </Tooltip>
            </Marker>
          )}
          {validStations.map((st) => {
            const color = colorFromAvailability(st.availability)
            return (
              <Marker
                key={st.id}
                position={[st.location.lat, st.location.lng]}
                icon={dashboardIconFactory(color, st.availability)}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(st.id),
                }}
              >
                <Popup className="custom-popup" maxWidth={250}>
                  <div className="space-y-2 text-xs max-w-xs p-1">
                    <div className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-1">{st.name}</div>
                    {st.network && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">Network:</span>
                        <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-xs font-medium">
                          {st.network}
                        </span>
                      </div>
                    )}
                    {st.pricing && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">Price:</span>
                        <span className="text-emerald-600 font-medium text-xs">{st.pricing}</span>
                      </div>
                    )}
                    {typeof st.availability === "number" && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">Available:</span>
                        <span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-xs font-medium">
                          {st.availability} chargers
                        </span>
                      </div>
                    )}
                    <div className="pt-1 border-t border-gray-200">
                      <Button
                        size="sm"
                        className="w-full h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                        onClick={() => onMarkerClick && onMarkerClick(st.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -8]} opacity={0.9} className="text-xs">
                  <div className="font-medium text-gray-800">{st.name}</div>
                </Tooltip>
              </Marker>
            )
          })}
        </MapContainer>
      )}

      {!validStations.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30">
          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">
              {center ? "No station coordinates available" : "Waiting for location..."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
