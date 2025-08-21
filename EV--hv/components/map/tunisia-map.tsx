"use client"

import { useEffect, useMemo } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface RawStation {
  id?: string
  _id?: string
  stationName?: string
  name?: string
  title?: string
  network?: string
  provider?: string
  operator?: string
  pricing?: any
  price?: string
  availability?: number
  availablePorts?: number
  slotsAvailable?: number
  connectors?: { status?: string }[]
  location?: any
  [k: string]: any
}

interface Props {
  center?: { lat: number; lng: number } | null   // made optional / nullable
  stations: RawStation[]
  onMarkerClick?: (id: string) => void
  height?: string
  className?: string
  fallbackZoom?: number
  userLocation?: { lat: number; lng: number } | null
  showUserLocation?: boolean
  debug?: boolean
}

type MarkerStation = {
  id: string
  name: string
  lat: number
  lng: number
  availability?: number
  network?: string
  pricing?: string
  raw: RawStation
}

function colorFromAvailability(st: MarkerStation) {
  const a =
    st.availability ??
    st.raw.availability ??
    st.raw.availablePorts ??
    st.raw.slotsAvailable
  if (a == null) return "#6b7280"
  if (a === 0) return "#dc2626"
  if (a === 1) return "#f59e0b"
  return "#059669"
}

/* Icon cache */
const iconFactory = (() => {
  const cache = new Map<string, L.DivIcon>()
  return (color: string) => {
    if (cache.has(color)) return cache.get(color)!
    const icon = L.divIcon({
      className: "station-pin",
      html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:${color};
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:13px;font-weight:600;
        box-shadow:0 0 0 2px #fff,0 4px 10px rgba(0,0,0,.25);
      ">⚡</div>`,
      iconSize: [26,26],
      iconAnchor: [13,13],
      popupAnchor: [0,-13],
    })
    cache.set(color, icon)
    return icon
  }
})()

const userIcon = L.divIcon({
  className: "user-pin",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#2563eb;
    box-shadow:0 0 0 3px rgba(59,130,246,.35),0 0 0 5px rgba(255,255,255,.9);
    border:2px solid #fff;
  "></div>`,
  iconSize: [18,18],
  iconAnchor: [9,9],
})

/* Auto-fit */
function FitBounds({
  stations,
  center,
  userLocation,
}: {
  stations: MarkerStation[]
  center: { lat: number; lng: number }
  userLocation?: { lat: number; lng: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    const pts: L.LatLngExpression[] = []
    stations.forEach((s) => pts.push([s.lat, s.lng]))
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
  const markerStations: MarkerStation[] = useMemo(() => {
    if (!Array.isArray(stations) || stations.length === 0) {
      if (debug) console.debug("[Map] No stations array or empty.")
      return []
    }
    const mapped = stations
      .map((s: any) => {
        const coords = s.location
        if (!coords || !isFinite(coords.lat) || !isFinite(coords.lng)) {
          if (debug) console.warn("[Map] Invalid coords", s.id || s._id, s.location)
          return null
        }
        const name = s.stationName || s.name || s.title || "Unnamed Station"
        const availability = s.availability ?? s.availablePorts ?? s.slotsAvailable
        let pricingText = ""
        if (s.pricing) {
          if (typeof s.pricing === "string") pricingText = s.pricing
          else {
            const parts:string[] = []
            if (s.pricing.perkWh) parts.push(`${s.pricing.perkWh}/kWh`)
            if (s.pricing.perHour) parts.push(`${s.pricing.perHour}/h`)
            if (s.pricing.sessionFee) parts.push(`Fee ${s.pricing.sessionFee}`)
            pricingText = parts.join(" • ")
          }
        } else if (s.price) pricingText = s.price

        return {
          id: s.id || s._id || `${coords.lat},${coords.lng}`,
          name,
          lat: coords.lat,
          lng: coords.lng,
          availability,
          network: s.network || s.provider || s.operator || "",
          pricing: pricingText,
          raw: s,
        } as MarkerStation
      })
      .filter((v): v is MarkerStation => !!v)
    if (debug) {
      console.debug("[Map] Stations in:", stations.length)
      console.debug("[Map] Valid markers:", mapped.length)
    }
    return mapped
  }, [stations, debug])

  // Derive a safe center
  const effectiveCenter = useMemo(() => {
    if (center && isFinite(center.lat) && isFinite(center.lng)) return center
    if (markerStations.length) {
      // average of marker coords
      const sum = markerStations.reduce(
        (acc, s) => {
          acc.lat += s.lat
          acc.lng += s.lng
          return acc
        },
        { lat: 0, lng: 0 }
      )
      return {
        lat: sum.lat / markerStations.length,
        lng: sum.lng / markerStations.length,
      }
    }
    // Tunisia approximate center fallback
    return { lat: 34.0, lng: 9.0 }
  }, [center, markerStations])

  const hasAnyCenter =
    effectiveCenter && isFinite(effectiveCenter.lat) && isFinite(effectiveCenter.lng)

  return (
    <div
      style={{ height }}
      className={`w-full relative rounded-lg overflow-hidden ${className}`}
    >
      {hasAnyCenter && (
        <MapContainer
          key={`${effectiveCenter.lat}-${effectiveCenter.lng}`} // force recenter if fallback changes
          center={[effectiveCenter.lat, effectiveCenter.lng]}
          zoom={fallbackZoom}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          preferCanvas
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds
            stations={markerStations}
            center={effectiveCenter}
            userLocation={showUserLocation ? userLocation || null : null}
          />
          {showUserLocation && userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                You are here
              </Tooltip>
            </Marker>
          )}
          {markerStations.map((st) => {
            const color = colorFromAvailability(st)
            return (
              <Marker
                key={st.id}
                position={[st.lat, st.lng]}
                icon={iconFactory(color)}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(st.id),
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold">{st.name}</div>
                    {st.network && <div className="text-gray-600">{st.network}</div>}
                    {st.pricing && <div>{st.pricing}</div>}
                    {typeof st.availability === "number" && (
                      <div>
                        Availability:{" "}
                        <span className="font-medium text-emerald-600">
                          {st.availability}
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  {st.name}
                </Tooltip>
              </Marker>
            )
          })}
        </MapContainer>
      )}

      {!markerStations.length && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
          {center ? "No station coordinates available" : "Waiting for location..."}
        </div>
      )}
    </div>
  )
}
