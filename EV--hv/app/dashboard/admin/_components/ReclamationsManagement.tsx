"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  ImageIcon,
  MapPin,
  TrendingUp,
  UserCheck,
  Send,
} from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"

interface Reclamation {
  _id: string
  id?: string
  submittedBy?: string
  userId?: string
  stationId?: string
  stationName?: string
  relatedStation?: string
  customerName?: string
  customerEmail?: string
  contactEmail?: string
  subject?: string
  title?: string
  description: string
  category: "technical" | "billing" | "service" | "other" | "General Feedback"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "open" | "Open" | "in_review" | "in-progress" | "resolved" | "closed"
  photos?: string[]
  createdAt: string
  updatedAt?: string
  response?: string
  responsePhotos?: string[]
  assignedTo?: string
  escalated?: boolean
  ownerName?: string
  driverName?: string
}

export default function ReclamationsManagement() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [filteredReclamations, setFilteredReclamations] = useState<Reclamation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null)
  const [showReclamationDetails, setShowReclamationDetails] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [newPriority, setNewPriority] = useState("")

  useEffect(() => {
    fetchReclamations()
  }, [])

  useEffect(() => {
    filterReclamations()
  }, [reclamations, searchTerm, statusFilter, priorityFilter, categoryFilter])

  const fetchReclamations = async () => {
    try {
      setIsLoading(true)

      // Fetch reclamations, users, and stations data
      const [reclamationsRes, usersRes, stationsRes] = await Promise.all([
        fetch("http://localhost:5000/reclamations"),
        fetch("http://localhost:5000/users"),
        fetch("http://localhost:5000/stations"),
      ])

      const reclamationsData = reclamationsRes.ok ? await reclamationsRes.json() : []
      const usersData = usersRes.ok ? await usersRes.json() : []
      const stationsData = stationsRes.ok ? await stationsRes.json() : []

      // Create lookup maps
      const userMap = new Map(usersData.map((user: any) => [user._id || user.id, user]))
      const stationMap = new Map(stationsData.map((station: any) => [station._id || station.id, station]))

      // Process reclamations with comprehensive data
      const processedReclamations = reclamationsData.map((reclamation: any) => {
        const user = userMap.get(reclamation.submittedBy || reclamation.userId)
        const station = stationMap.get(reclamation.stationId || reclamation.relatedStation)
        const owner = station ? userMap.get(station.ownerId) : null

        // Normalize status values
        let normalizedStatus = reclamation.status?.toLowerCase() || "pending"
        if (normalizedStatus === "open") normalizedStatus = "pending"
        if (normalizedStatus === "in_review") normalizedStatus = "in-progress"

        // Normalize category
        let normalizedCategory = reclamation.category?.toLowerCase() || "other"
        if (normalizedCategory === "general feedback") normalizedCategory = "other"

        return {
          _id: reclamation._id || reclamation.id,
          submittedBy: reclamation.submittedBy || reclamation.userId,
          stationId: reclamation.stationId || reclamation.relatedStation,
          stationName: station?.stationName || station?.name || "Unknown Station",
          customerName: user?.fullName || user?.name || "Unknown User",
          customerEmail: user?.email || reclamation.contactEmail || "No email",
          subject: reclamation.title || reclamation.subject || "No subject",
          description: reclamation.description || "No description provided",
          category: normalizedCategory,
          priority: reclamation.priority || "medium",
          status: normalizedStatus,
          photos: reclamation.photos || [],
          createdAt: reclamation.createdAt || new Date().toISOString(),
          updatedAt: reclamation.updatedAt,
          response: reclamation.response,
          responsePhotos: reclamation.responsePhotos || [],
          assignedTo: reclamation.assignedTo,
          escalated: reclamation.escalated || false,
          ownerName: owner?.fullName || owner?.name || "Unknown Owner",
          driverName: user?.fullName || user?.name || "Unknown Driver",
        }
      })

      setReclamations(processedReclamations)
    } catch (error) {
      console.error("Failed to fetch reclamations:", error)
      setReclamations([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterReclamations = () => {
    let filtered = reclamations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (reclamation) =>
          reclamation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamation.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((reclamation) => reclamation.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((reclamation) => reclamation.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((reclamation) => reclamation.category === categoryFilter)
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1

      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Newer first
    })

    setFilteredReclamations(filtered)
  }

  const handleUpdateReclamation = async () => {
    if (!selectedReclamation) return

    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      }

      if (newStatus && newStatus !== selectedReclamation.status) {
        updateData.status = newStatus
      }

      if (newPriority && newPriority !== selectedReclamation.priority) {
        updateData.priority = newPriority
      }

      if (responseMessage.trim()) {
        updateData.response = responseMessage.trim()
        updateData.assignedTo = "admin" // Mark as handled by admin
      }

      const response = await fetch(`http://localhost:5000/reclamations/${selectedReclamation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSelectedReclamation(null)
        setResponseMessage("")
        setNewStatus("")
        setNewPriority("")
        setShowReclamationDetails(false)
        fetchReclamations()
      }
    } catch (error) {
      console.error("Failed to update reclamation:", error)
    }
  }

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
        return { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" }
      case "billing":
        return { icon: Clock, color: "text-blue-600", bg: "bg-blue-100" }
      case "service":
        return { icon: UserCheck, color: "text-green-600", bg: "bg-green-100" }
      default:
        return { icon: MessageSquare, color: "text-gray-600", bg: "bg-gray-100" }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Reclamations Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reclamations Management</h2>
          <p className="text-gray-600">Monitor and resolve customer complaints and issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-100 text-red-800 px-3 py-1">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {reclamations.filter((r) => r.status === "pending").length} Pending
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Reclamations",
            value: reclamations.length,
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Pending",
            value: reclamations.filter((r) => r.status === "pending").length,
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-100",
          },
          {
            title: "In Progress",
            value: reclamations.filter((r) => r.status === "in-progress").length,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Resolved",
            value: reclamations.filter((r) => r.status === "resolved").length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
          },
        ].map((stat, i) => (
          <TiltCard key={i} className="bg-white border border-gray-100 shadow-sm">
            <Card className="border-none shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reclamations by subject, customer, station, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reclamations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReclamations.map((reclamation) => {
          const categoryInfo = getCategoryIcon(reclamation.category)
          const CategoryIcon = categoryInfo.icon

          return (
            <TiltCard key={reclamation._id} className="bg-white border border-gray-100 shadow-sm">
              <Card className="border-none shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${categoryInfo.bg}`}>
                        <CategoryIcon className={`h-6 w-6 ${categoryInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{reclamation.subject}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{reclamation.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {reclamation.customerName}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {reclamation.stationName}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(reclamation.createdAt)}
                          </span>
                          {reclamation.photos && reclamation.photos.length > 0 && (
                            <span className="flex items-center">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {reclamation.photos.length} photo{reclamation.photos.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Badge className={getPriorityColor(reclamation.priority)}>{reclamation.priority}</Badge>
                        <div className="mt-1">
                          <Badge className={getStatusColor(reclamation.status)}>{reclamation.status}</Badge>
                        </div>
                      </div>

                      <Dialog
                        open={showReclamationDetails && selectedReclamation?._id === reclamation._id}
                        onOpenChange={setShowReclamationDetails}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedReclamation(reclamation)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Reclamation Details</DialogTitle>
                          </DialogHeader>
                          {selectedReclamation && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Complaint Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Subject:</span>
                                      <p className="font-medium">{selectedReclamation.subject}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Category:</span>
                                      <Badge className={getCategoryIcon(selectedReclamation.category).bg}>
                                        {selectedReclamation.category}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Priority:</span>
                                      <Badge className={getPriorityColor(selectedReclamation.priority)}>
                                        {selectedReclamation.priority}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Status:</span>
                                      <Badge className={getStatusColor(selectedReclamation.status)}>
                                        {selectedReclamation.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Customer & Station</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Customer:</span>
                                      <p className="font-medium">{selectedReclamation.customerName}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Email:</span>
                                      <p className="font-medium">{selectedReclamation.customerEmail}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Station:</span>
                                      <p className="font-medium">{selectedReclamation.stationName}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Owner:</span>
                                      <p className="font-medium">{selectedReclamation.ownerName}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Description */}
                              <div>
                                <h4 className="font-semibold mb-3">Description</h4>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                  {selectedReclamation.description}
                                </p>
                              </div>

                              {/* Photos */}
                              {selectedReclamation.photos && selectedReclamation.photos.length > 0 && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-3">Customer Photos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {selectedReclamation.photos.map((photo, index) => (
                                        <img
                                          key={index}
                                          src={photo || "/placeholder.svg"}
                                          alt={`Customer photo ${index + 1}`}
                                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => window.open(photo, "_blank")}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Existing Response */}
                              {selectedReclamation.response && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-3">Previous Response</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <p className="text-blue-800">{selectedReclamation.response}</p>
                                    </div>
                                  </div>
                                </>
                              )}

                              <Separator />

                              {/* Admin Response Form */}
                              <div className="space-y-4">
                                <h4 className="font-semibold">Admin Response</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Update Status</label>
                                    <Select
                                      value={newStatus || selectedReclamation.status}
                                      onValueChange={setNewStatus}
                                    >
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
                                    <label className="text-sm font-medium mb-2 block">Update Priority</label>
                                    <Select
                                      value={newPriority || selectedReclamation.priority}
                                      onValueChange={setNewPriority}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Response Message</label>
                                  <Textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="Type your response to the customer..."
                                    rows={4}
                                    className="resize-none"
                                  />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReclamation(null)
                                    setResponseMessage("")
                                    setNewStatus("")
                                    setNewPriority("")
                                    setShowReclamationDetails(false)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleUpdateReclamation}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={!responseMessage.trim() && !newStatus && !newPriority}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Update Reclamation
                                </Button>
                              </div>

                              {/* Monetary Value Display */}
                              <div className="bg-green-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  DT{selectedReclamation.totalSpent}
                                </div>
                                <div className="text-sm text-gray-600">Total Spent</div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          )
        })}
      </div>

      {filteredReclamations.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reclamations found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Great! No customer complaints at the moment."}
          </p>
        </div>
      )}
    </div>
  )
}
