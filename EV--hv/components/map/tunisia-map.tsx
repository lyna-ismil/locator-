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
  fallbackZoom?: number
  userLocation?: { lat: number; lng: number } | null
  showUserLocation?: boolean
  debug?: boolean
}

function colorFromAvailability(a?: number) {
  if (a == null) return "#6b7280"
  if (a === 0) return "#dc2626"
  if (a === 1) return "#f59e0b"
  return "#059669"
}

/* Icon cache - includes availability count in the html */
const iconFactory = (() => {
  const cache = new Map<string, L.DivIcon>()
  return (color: string, availability?: number) => {
    const key = `${color}-${availability ?? "na"}`
    if (cache.has(key)) return cache.get(key)!
    const display = typeof availability === "number" ? `${availability}⚡` : "⚡"
    const gradientColor =
      color === "#059669"
        ? "linear-gradient(135deg, #059669, #10b981)"
        : color === "#f59e0b"
          ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
          : color === "#dc2626"
            ? "linear-gradient(135deg, #dc2626, #ef4444)"
            : `linear-gradient(135deg, ${color}, ${color})`

    const icon = L.divIcon({
      className: "station-pin",
      html: `<div style="
        min-width:32px;height:32px;border-radius:50%;
        background:${gradientColor};
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:11px;font-weight:800;
        padding:0 6px;
        box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 6px 20px rgba(0,0,0,.25);
        border:2px solid rgba(255,255,255,0.8);
        transition:all 0.2s ease;
      ">${display}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })
    cache.set(key, icon)
    return icon
  }
})()

/* Enhanced user icon with better styling */
const userIcon = L.divIcon({
  className: "user-pin",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:linear-gradient(135deg, #2563eb, #3b82f6);
    box-shadow:0 0 0 4px rgba(59,130,246,.25),0 0 0 6px rgba(255,255,255,.95),0 4px 12px rgba(0,0,0,.15);
    border:2px solid #fff;
    animation:pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

/* Auto-fit */
function FitBounds({
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
      map.setView([center.lat, center.lng], 8)
      return
    }
    if (pts.length === 1) {
      map.setView(pts[0], 14)
      return
    }
    const bounds = L.latLngBounds(pts)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [stations, center, userLocation, map])
  return null
}

export default function TunisiaMap({
  center,
  stations,
  onMarkerClick,
  height = "100%",
  className = "",
  fallbackZoom = 7,
  userLocation,
  showUserLocation = true,
  debug = false,
}: Props) {
  // Expect parent to pass clean Station objects; filter invalid coords here
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
      className={`w-full relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 ${className}`}
    >
      {hasAnyCenter && (
        <MapContainer
          key={`${effectiveCenter.lat}-${effectiveCenter.lng}`}
          center={[effectiveCenter.lat, effectiveCenter.lng]}
          zoom={fallbackZoom}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          preferCanvas
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds
            stations={validStations}
            center={effectiveCenter}
            userLocation={showUserLocation ? userLocation || null : null}
          />
          {showUserLocation && userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95} className="custom-tooltip">
                <div className="font-semibold text-blue-700">You are here</div>
              </Tooltip>
            </Marker>
          )}
          {validStations.map((st) => {
            const color = colorFromAvailability(st.availability)
            return (
              <Marker
                key={st.id}
                position={[st.location.lat, st.location.lng]}
                icon={iconFactory(color, st.availability)}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(st.id),
                }}
              >
                <Popup className="custom-popup">
                  <div className="space-y-3 text-sm max-w-xs p-2">
                    <div className="font-bold text-lg text-gray-900 border-b border-gray-200 pb-2">{st.name}</div>
                    {st.network && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Network:</span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-semibold">
                          {st.network}
                        </span>
                      </div>
                    )}
                    {st.pricing && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Pricing:</span>
                        <span className="text-emerald-600 font-semibold">{st.pricing}</span>
                      </div>
                    )}
                    {typeof st.availability === "number" && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Available:</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-sm font-bold border border-emerald-200">
                          {st.availability} chargers
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                        onClick={() => onMarkerClick && onMarkerClick(st.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -12]} opacity={0.95} className="custom-tooltip">
                  <div className="font-semibold text-gray-800">{st.name}</div>
                </Tooltip>
              </Marker>
            )
          })}
        </MapContainer>
      )}

      {!validStations.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30">
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">
              {center ? "No station coordinates available" : "Waiting for location..."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
