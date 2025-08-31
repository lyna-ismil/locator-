"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare, User, Calendar, MapPin, ThumbsUp, ThumbsDown } from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"

interface Review {
  _id: string
  userId: string
  stationId: string
  stationName: string
  customerName: string
  customerEmail: string
  rating: number
  title: string
  comment: string
  experience: "positive" | "negative" | "neutral"
  categories: string[]
  createdAt: string
  updatedAt: string
  ownerResponse?: string
  ownerResponseDate?: string
  helpful: number
  notHelpful: number
}

interface ReviewListProps {
  reviews: Review[]
  onDataChange: () => void
}

export function ReviewList({ reviews, onDataChange }: ReviewListProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseMessage, setResponseMessage] = useState("")

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      case "neutral":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getExperienceIcon = (experience: string) => {
    switch (experience) {
      case "positive":
        return <ThumbsUp className="h-4 w-4" />
      case "negative":
        return <ThumbsDown className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  const handleRespondToReview = async () => {
    if (!selectedReview || !responseMessage.trim()) return

    try {
      const response = await fetch(`http://localhost:5000/reviews/${selectedReview._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerResponse: responseMessage,
          ownerResponseDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setSelectedReview(null)
        setResponseMessage("")
        onDataChange()
      }
    } catch (error) {
      console.error("Error responding to review:", error)
    }
  }

  if (reviews.length === 0) {
    return (
      <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600 text-center">
              Customer reviews will appear here once they start rating your stations.
            </p>
          </CardContent>
        </Card>
      </TiltCard>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <TiltCard key={review._id} className="bg-white/90 border border-gray-100 shadow-xl">
          <Card className="border-none shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">{getExperienceIcon(review.experience)}</div>
                  <div>
                    <CardTitle className="text-lg">{review.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <User className="h-3 w-3" />
                      {review.customerName}
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      {review.stationName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                    <span className={`ml-1 text-sm font-medium ${getRatingColor(review.rating)}`}>
                      {review.rating}.0
                    </span>
                  </div>
                  <Badge className={getExperienceColor(review.experience)}>{review.experience}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {review.categories && review.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {review.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {review.ownerResponse && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Your Response</span>
                    <span className="text-xs text-blue-600">
                      {new Date(review.ownerResponseDate!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">{review.ownerResponse}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {review.helpful} helpful
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" />
                    {review.notHelpful} not helpful
                  </div>
                </div>

                {!review.ownerResponse && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedReview(review)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Respond
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      ))}

      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <TiltCard className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <Card className="border-none shadow-none">
              <CardHeader>
                <CardTitle>Respond to Review</CardTitle>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-gray-600">by {selectedReview.customerName}</span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">"{selectedReview.comment}"</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Response</label>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Thank the customer and address their feedback professionally..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your response will be visible to all customers viewing this review.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button
                    onClick={handleRespondToReview}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!responseMessage.trim()}
                  >
                    Post Response
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedReview(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        </div>
      )}
    </div>
  )
}

/**
 * ReservationList
 * Robust display of reservation details with graceful fallbacks.
 */
export function ReservationList({ reservations }: { reservations: any[] }) {
  if (!reservations?.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No reservations found.
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-blue-100 text-blue-800"
      case "Active":
        return "bg-green-100 text-green-800"
      case "Completed":
        return "bg-gray-100 text-gray-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      {reservations.map((r) => {
        const stationName =
          r.stationId?.stationName ||
          r.station?.name ||
          (typeof r.stationId === "object" && r.stationId !== null ? r.stationId.name : r.stationId) ||
          "Station"

        const customerName =
          r.customer?.name ||
          r.customer?.fullName ||
          r.user?.name ||
          r.user?.fullName ||
          r.userId?.fullName ||
          (typeof r.userId === "object" && r.userId !== null ? (r.userId.name || r.userId.fullName) : r.userId) ||
          "User"

        const vehicle = r.vehicleInfo || r.vehicle || {}
        const vehicleLabel = vehicle.make
          ? `${vehicle.make} ${vehicle.model || ""} ${vehicle.year ? `(${vehicle.year})` : ""}`.trim()
          : "—"

        return (
          <Card key={r._id || r.id} className="bg-white/90 border border-gray-100 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{stationName}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <User className="h-3 w-3" />
                    {customerName}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge className={`text-xs rounded-full py-1 px-2 ${getStatusColor(r.status)}`}>
                    {r.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{vehicleLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {new Date(r.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(r.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {r.note && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Note:</span> {r.note}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
