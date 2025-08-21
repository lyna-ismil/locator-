"use client"
import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Zap, AlertTriangle, MapPin, Star, MessageSquare, Coffee, Wifi, Utensils, ShoppingBag } from "lucide-react"
import type { Station, CarOwner, Connector } from "../types"

export default function StationDetails({
  station, // now accept full station object
  user,
  onReserve,
  onClose,
}: {
  station: Station
  user: CarOwner
  onReserve: (chargerId: string) => void
  onClose: () => void
}) {
  if (!station) return null

  const compatibleConnectors = [user.vehicleDetails.primaryConnector, ...(user.vehicleDetails.adapters || [])]
  const compatibleChargers = station.connectors?.filter((c: Connector) => compatibleConnectors.includes(c.type)) ?? []
  const otherChargers = station.connectors?.filter((c: Connector) => !compatibleConnectors.includes(c.type)) ?? []

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
        return null
    }
  }

  // Fetch recent reviews for this station from backend
  const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")
  const [reviews, setReviews] = useState<any[]>(station.reviews ?? [])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (!station?.id) return
    const ac = new AbortController()
    setReviewsLoading(true)
    fetch(`${BASE}/reviews?stationId=${encodeURIComponent(station.id)}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => res.statusText)
          throw new Error(txt || "Failed to load reviews")
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setReviews(data)
        else if (data.reviews && Array.isArray(data.reviews)) setReviews(data.reviews)
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to load reviews:", err)
      })
      .finally(() => setReviewsLoading(false))

    return () => ac.abort()
  }, [station.id, BASE])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
        <CardHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close station details"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </Button>
          <div className="pr-8">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{station.name}</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {station.network} {station.address ? `• ${station.address}` : ""}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Station Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center">
                <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Distance</div>
                <div className="font-semibold text-gray-800">{(station.distance ?? "--")?.toString()?.includes(".") ? station.distance?.toFixed?.(1) : station.distance ?? "--"} km</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Available</div>
                <div className="font-semibold text-gray-800">{station.availability ?? "--"} chargers</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Rating</div>
                <div className="font-semibold text-gray-800">{station.rating ?? "4.5/5"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Compatibility */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600" />
              Vehicle Compatibility
            </h3>
            {compatibleChargers.length > 0 ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                <Zap className="w-3 h-3 mr-1" />
                Compatible with your vehicle
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not compatible with your vehicle
              </Badge>
            )}
          </div>

          {/* Amenities */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {station.amenities && station.amenities.length > 0 ? (
                station.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                    {getAmenityIcon(amenity)}
                    {amenity}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No amenities listed.</span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Pricing</h3>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="text-gray-700">{station.pricing ?? "See station for details"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Chargers */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Available Chargers</h3>
            <div className="space-y-3">
              {compatibleChargers.map((c, index) => (
                <Card key={c.id ?? `${c.type}-${c.power}-${index}`} className="border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{c.type}</div>
                          <div className="text-sm text-gray-600">
                            {c.power}kW • {c.status}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onReserve(c.id)}
                        disabled={c.status !== "available"}
                      >
                        Reserve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {otherChargers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Other chargers (not compatible)</h4>
                  {otherChargers.map((c, index) => (
                    <Card key={c.id ?? `other-${c.type}-${c.power}-${index}`} className="border-gray-200 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Zap className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-600">{c.type}</div>
                            <div className="text-sm text-gray-500">
                              {c.power}kW • {c.status}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Preview */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Recent Reviews
            </h3>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                {reviewsLoading ? (
                  <div className="text-sm text-gray-600">Loading reviews...</div>
                ) : reviews && reviews.length > 0 ? (
                  reviews.slice(0, 2).map((review, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="text-sm text-gray-600 italic">"{review.text}"</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">- {review.user || review.userId || "Customer"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-sm text-gray-600 italic">
                      "Great location with fast charging. Clean facilities and good coffee shop nearby."
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">- Sarah M.</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
