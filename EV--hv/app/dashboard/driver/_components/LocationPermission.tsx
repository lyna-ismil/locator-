"use client"
import React, { useState } from "react"
import { Navigation, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LocationPermission({ onLocation }: { onLocation: (loc: { lat: number; lng: number }) => void }) {
const [denied, setDenied] = useState(false)
  const [manual, setManual] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function requestLocation() {
    if (!navigator.geolocation) {
      setDenied(true)
      setError("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setDenied(true)
        setError("Location access denied. Please enter your location manually.")
      },
    )
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault()
    if (!manual?.lat || !manual?.lng) {
      setError("Please enter both latitude and longitude.")
      return
    }
    setError(null)
    onLocation(manual)
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
