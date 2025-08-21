"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Clock, CheckCircle, MessageSquare, User, Calendar, ImageIcon } from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"
import { PhotoUpload } from "./PhotoUpload"

interface Reclamation {
  _id: string
  userId: string
  stationId: string
  stationName: string
  customerName: string
  customerEmail: string
  subject: string
  description: string
  category: "technical" | "billing" | "service" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "resolved" | "closed"
  photos?: string[]
  createdAt: string
  updatedAt: string
  response?: string
  responsePhotos?: string[]
}

interface ReclamationListProps {
  reclamations: Reclamation[]
  onDataChange: () => void
}

export function ReclamationList({ reclamations, onDataChange }: ReclamationListProps) {
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [responsePhotos, setResponsePhotos] = useState<string[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical":
        return <AlertTriangle className="h-4 w-4" />
      case "billing":
        return <Clock className="h-4 w-4" />
      case "service":
        return <User className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const handleUpdateReclamation = async () => {
    if (!selectedReclamation) return

    try {
      const res = await fetch(`http://localhost:5000/reclamations/${selectedReclamation._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus || selectedReclamation.status,
          response: responseMessage,
          responsePhotos: responsePhotos.length > 0 ? responsePhotos : undefined,
          updatedAt: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        setSelectedReclamation(null)
        setResponseMessage("")
        setNewStatus("")
        setResponsePhotos([])
        onDataChange()
      }
    } catch (error) {
      console.error("Error updating reclamation:", error)
    }
  }

  if (reclamations.length === 0) {
    return (
      <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reclamations</h3>
            <p className="text-gray-600 text-center">Great! You have no pending customer complaints.</p>
          </CardContent>
        </Card>
      </TiltCard>
    )
  }

  return (
    <div className="space-y-4">
      {reclamations.map((reclamation) => (
        <TiltCard key={reclamation._id} className="bg-white/90 border border-gray-100 shadow-xl">
          <Card className="border-none shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">{getCategoryIcon(reclamation.category)}</div>
                  <div>
                    <CardTitle className="text-lg">{reclamation.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <User className="h-3 w-3" />
                      {reclamation.customerName}
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      {new Date(reclamation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(reclamation.priority)}>{reclamation.priority}</Badge>
                  <Badge className={getStatusColor(reclamation.status)}>{reclamation.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">{reclamation.description}</p>
                <div className="text-sm text-gray-500">
                  <strong>Station:</strong> {reclamation.stationName}
                </div>
              </div>

              {reclamation.photos && reclamation.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Customer Photos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {reclamation.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo || "/placeholder.svg"}
                        alt={`Customer photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {reclamation.response && (
                <div className="bg-green-50 p-3 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Your Response</span>
                  </div>
                  <p className="text-sm text-green-700">{reclamation.response}</p>

                  {reclamation.responsePhotos && reclamation.responsePhotos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-800">Response Photos</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {reclamation.responsePhotos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo || "/placeholder.svg"}
                            alt={`Response photo ${index + 1}`}
                            className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo, "_blank")}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReclamation(reclamation)
                    setNewStatus(reclamation.status)
                    setResponsePhotos([])
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respond
                </Button>
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      ))}

      {selectedReclamation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <TiltCard className="bg-white max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <Card className="border-none shadow-none">
              <CardHeader>
                <CardTitle>Respond to Reclamation</CardTitle>
                <p className="text-sm text-gray-600">{selectedReclamation.subject}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Response Message</label>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response to the customer..."
                    rows={4}
                  />
                </div>

                <PhotoUpload photos={responsePhotos} onPhotosChange={setResponsePhotos} maxPhotos={3} />

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleUpdateReclamation} className="bg-emerald-600 hover:bg-emerald-700">
                    Send Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReclamation(null)
                      setResponsePhotos([])
                    }}
                  >
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
