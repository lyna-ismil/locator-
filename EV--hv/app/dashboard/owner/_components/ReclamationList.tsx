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

type ReclamationCategory =
  | "Incorrect Station Info"
  | "Broken Charger"
  | "Billing Issue"
  | "General Feedback"

type ReclamationStatus = "Open" | "In Progress" | "Resolved" | "Closed"

interface Reclamation {
  _id: string
  submittedBy?: string // ObjectId (string) of user who submitted
  relatedStation?: string // ObjectId (string) of station
  category: ReclamationCategory
  title: string
  description: string
  status: ReclamationStatus
  adminNotes?: string
  createdAt: string
  updatedAt: string
  // optional fields kept for compatibility if you later extend backend
  photos?: string[]
  responsePhotos?: string[]
}

interface ReclamationListProps {
  reclamations: Reclamation[]
  onDataChange: () => void
}

export function ReclamationList({ reclamations, onDataChange }: ReclamationListProps) {
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [newStatus, setNewStatus] = useState<ReclamationStatus | "">("")
  const [responsePhotos, setResponsePhotos] = useState<string[]>([])

  const getStatusColor = (status: ReclamationStatus) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 text-yellow-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Resolved":
        return "bg-green-100 text-green-800"
      case "Closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: ReclamationCategory) => {
    switch (category) {
      case "Incorrect Station Info":
        return <AlertTriangle className="h-4 w-4" />
      case "Broken Charger":
        return <AlertTriangle className="h-4 w-4" />
      case "Billing Issue":
        return <Clock className="h-4 w-4" />
      case "General Feedback":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")

  const handleUpdateReclamation = async () => {
    if (!selectedReclamation) return

    try {
      const res = await fetch(`${BASE}/reclamations/${selectedReclamation._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus || selectedReclamation.status,
          adminNotes: responseMessage || selectedReclamation.adminNotes,
          // keep responsePhotos optional for future use
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
      } else {
        const err = await res.json().catch(() => null)
        console.error("Update failed", err || res.statusText)
      }
    } catch (error) {
      console.error("Error updating reclamation:", error)
    }
  }

  if (!reclamations || reclamations.length === 0) {
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
                    <CardTitle className="text-lg">{reclamation.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <User className="h-3 w-3" />
                      {/* submittedBy is an id; show shortened id */}
                      {reclamation.submittedBy ? `${reclamation.submittedBy.slice(0, 8)}...` : "Customer"}
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      {new Date(reclamation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(reclamation.status)}>{reclamation.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">{reclamation.description}</p>
                <div className="text-sm text-gray-500">
                  <strong>Station:</strong> {reclamation.relatedStation ?? "N/A"}
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

              {reclamation.adminNotes && (
                <div className="bg-green-50 p-3 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Admin Notes</span>
                  </div>
                  <p className="text-sm text-green-700">{reclamation.adminNotes}</p>

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
                    setResponsePhotos(reclamation.responsePhotos ?? [])
                    setResponseMessage(reclamation.adminNotes ?? "")
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
                <p className="text-sm text-gray-600">{selectedReclamation.title}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReclamationStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Response / Admin Notes</label>
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
