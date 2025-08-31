"use client"
import React, { useState, useEffect } from "react"
import { Navigation, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LocationPermission({ onLocation }: { onLocation: (loc: { lat: number; lng: number }) => void }) {
  const [denied, setDenied] = useState(false)
  const [manual, setManual] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // auto‑request on mount
    requestLocation()
    // try previously stored coords if permission was previously granted
    try {
      const saved = localStorage.getItem("driverLastLocation")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (isFinite(parsed.lat) && isFinite(parsed.lng)) {
          onLocation({ lat: parsed.lat, lng: parsed.lng })
        }
      }
    } catch {}
  }, [])

  function requestLocation() {
    setError(null)
    setDenied(false)
    if (!navigator.geolocation) {
      setDenied(true)
      setError("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(6)
        const lng = +pos.coords.longitude.toFixed(6)
        if (!isFinite(lat) || !isFinite(lng)) {
          setError("Received invalid coordinates.")
          return
        }
        try {
          localStorage.setItem("driverLastLocation", JSON.stringify({ lat, lng }))
        } catch {}
        onLocation({ lat, lng })
      },
      () => {
        setDenied(true)
        setError("Location access denied. You can enter coordinates manually.")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault()
    if (manual == null) return
    const lat = parseFloat(String(manual.lat))
    const lng = parseFloat(String(manual.lng))
    if (!isFinite(lat) || !isFinite(lng)) {
      setError("Please enter valid numeric latitude & longitude.")
      return
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Latitude must be between -90 and 90, longitude between -180 and 180.")
      return
    }
    setError(null)
    try { localStorage.setItem("driverLastLocation", JSON.stringify({ lat, lng })) } catch {}
    onLocation({ lat, lng })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Enable Location</CardTitle>
          <CardDescription className="text-gray-600">
            We need your location to find nearby charging stations and provide accurate directions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}
          {!denied ? (
            <Button
              onClick={requestLocation}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Allow Location Access
            </Button>
          ) : (
            <form onSubmit={handleManual} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                  Latitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  id="latitude"
                  placeholder="Enter latitude"
                  required
                  className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  onChange={(e) =>
                    setManual((prev) => ({
                      lat: Number.parseFloat(e.target.value),
                      lng: prev?.lng || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                  Longitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  id="longitude"
                  placeholder="Enter longitude"
                  required
                  className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  onChange={(e) =>
                    setManual((prev) => ({
                      lat: prev?.lat || 0,
                      lng: Number.parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-gray-700 hover:bg-gray-800 text-white font-semibold">
                Set Location
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
