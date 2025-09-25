"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Filter, Eye, UserX, UserCheck, Car, Zap, Clock, TrendingUp, MapPin, Plus } from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"

interface Driver {
  id: string
  _id?: string
  fullName: string
  email: string
  phone?: string
  location?: string
  status: "active" | "suspended" | "pending"
  joinDate: string
  lastActive: string
  vehicleDetails?: {
    make: string
    model: string
    year?: number
    primaryConnector: string
    adapters: string[]
  }
  chargingStats: {
    totalSessions: number
    totalEnergy: number
    totalSpent: number
    averageRating: number
  }
  preferences?: {
    preferredNetworks: string[]
    requiredAmenities: string[]
  }
}

function AddDriverModal({ open, setOpen, onDriverAdded }: { open: boolean; setOpen: (v: boolean) => void; onDriverAdded: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    vehicleDetails: {
      make: "",
      model: "",
      primaryConnector: "",
      year: "",
      adapters: [],
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith("vehicleDetails.")) {
      const key = name.replace("vehicleDetails.", "")
      setForm((prev) => ({
        ...prev,
        vehicleDetails: { ...prev.vehicleDetails, [key]: value },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAdaptersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, adapters: e.target.value.split(",").map((a) => a.trim()) },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://localhost:5000/car-owners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          vehicleDetails: {
            make: form.vehicleDetails.make,
            model: form.vehicleDetails.model,
            primaryConnector: form.vehicleDetails.primaryConnector,
            year: form.vehicleDetails.year,
            adapters: form.vehicleDetails.adapters,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.msg || "Failed to add driver.")
      } else {
        setOpen(false)
        onDriverAdded()
      }
    } catch (err) {
      setError("Failed to add driver.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              name="fullName"
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded px-3 py-2"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border rounded px-3 py-2"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vehicle Make</label>
            <input
              name="vehicleDetails.make"
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={form.vehicleDetails.make}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vehicle Model</label>
            <input
              name="vehicleDetails.model"
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={form.vehicleDetails.model}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Primary Connector</label>
            <input
              name="vehicleDetails.primaryConnector"
              type="text"
              required
              className="w-full border rounded px-3 py-2"
              value={form.vehicleDetails.primaryConnector}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Year</label>
            <input
              name="vehicleDetails.year"
              type="number"
              className="w-full border rounded px-3 py-2"
              value={form.vehicleDetails.year}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Adapters (comma separated)</label>
            <input
              name="vehicleDetails.adapters"
              type="text"
              className="w-full border rounded px-3 py-2"
              value={form.vehicleDetails.adapters.join(", ")}
              onChange={handleAdaptersChange}
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [showDriverDetails, setShowDriverDetails] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchDrivers()
  }, [])

  useEffect(() => {
    filterDrivers()
  }, [drivers, searchTerm, statusFilter])

  // Fetch all drivers from backend (integrated)
  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      // Fetch all drivers (role=driver) and their charging sessions
      const [driversRes, sessionsRes] = await Promise.all([
        fetch("http://localhost:5000/car-owners"), // Updated endpoint for all drivers
        fetch("http://localhost:5000/charging-sessions"),
      ])

      const driversData = driversRes.ok ? await driversRes.json() : []
      const sessionsData = sessionsRes.ok ? await sessionsRes.json() : []

      // Process drivers with charging statistics
      const processedDrivers = driversData.map((driver: any) => {
        const driverSessions = sessionsData.filter(
          (session: any) =>
            session.userEmail === driver.email ||
            session.userId === driver.id ||
            session.userId === driver._id,
        )

        const totalSessions = driverSessions.length
        const totalEnergy = driverSessions.reduce(
          (sum: number, session: any) => sum + (session.energyDelivered || session.energyConsumedKWh || session.energy || 0),
          0,
        )
        const totalSpent = driverSessions.reduce(
          (sum: number, session: any) => sum + (session.totalCost || session.cost || session.finalCost || 0),
          0,
        )

        return {
          id: driver._id || driver.id,
          fullName: driver.fullName || driver.name || "Unknown User",
          email: driver.email,
          phone: driver.phone,
          location: driver.location || "Not specified",
          status: driver.status || "active",
          joinDate: driver.createdAt || driver.joinDate || new Date().toISOString(),
          lastActive: driver.lastActive || driver.updatedAt || new Date().toISOString(),
          vehicleDetails: driver.vehicleDetails || driver.vehicle,
          chargingStats: {
            totalSessions,
            totalEnergy: Math.round(totalEnergy * 10) / 10,
            totalSpent: Math.round(totalSpent * 100) / 100,
            averageRating: 4.5, // Mock rating, replace with backend if available
          },
          preferences: driver.preferences,
        }
      })

      setDrivers(processedDrivers)
    } catch (error) {
      console.error("Failed to fetch drivers:", error)
      setDrivers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterDrivers = () => {
    let filtered = drivers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (driver) =>
          driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.vehicleDetails?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.vehicleDetails?.model?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) => driver.status === statusFilter)
    }

    setFilteredDrivers(filtered)
  }

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/car-owners/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setDrivers((prev) =>
          prev.map((driver) => (driver.id === driverId ? { ...driver, status: newStatus as any } : driver)),
        )
      }
    } catch (error) {
      console.error("Failed to update driver status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDriverAdded = () => {
    setShowAddModal(false)
    fetchDrivers()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
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
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">Monitor and manage all registered drivers</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
            <Users className="h-3 w-3 mr-1" />
            {drivers.length} Total Drivers
          </Badge>
          <Button
            variant="default"
            size="sm"
            className="bg-blue-600 text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Active Drivers",
            value: drivers.filter((d) => d.status === "active").length,
            icon: UserCheck,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            title: "Suspended",
            value: drivers.filter((d) => d.status === "suspended").length,
            icon: UserX,
            color: "text-red-600",
            bg: "bg-red-100",
          },
          {
            title: "Total Sessions",
            value: drivers.reduce((sum, d) => sum + d.chargingStats.totalSessions, 0),
            icon: Zap,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Total Energy",
            value: `${drivers.reduce((sum, d) => sum + d.chargingStats.totalEnergy, 0).toFixed(1)} kWh`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-100",
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
                placeholder="Search drivers by name, email, or vehicle..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDrivers.map((driver) => (
          <TiltCard key={driver.id} className="bg-white border border-gray-100 shadow-sm">
            <Card className="border-none shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {driver.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{driver.fullName}</h3>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {driver.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Joined {formatDate(driver.joinDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Vehicle Info */}
                    {driver.vehicleDetails && (
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-900">
                          <Car className="h-4 w-4 mr-1" />
                          {driver.vehicleDetails.make} {driver.vehicleDetails.model}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.vehicleDetails.primaryConnector} • {driver.vehicleDetails.year}
                        </div>
                      </div>
                    )}

                    {/* Charging Stats */}
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {driver.chargingStats.totalSessions} sessions
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.chargingStats.totalEnergy} kWh • ${driver.chargingStats.totalSpent}
                      </div>
                    </div>

                    {/* Status */}
                    <Badge className={getStatusColor(driver.status)}>{driver.status}</Badge>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Dialog
                        open={showDriverDetails && selectedDriver?.id === driver.id}
                        onOpenChange={setShowDriverDetails}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Driver Details</DialogTitle>
                          </DialogHeader>
                          {selectedDriver && (
                            <div className="space-y-6">
                              {/* Personal Info */}
                              <div>
                                <h4 className="font-semibold mb-3">Personal Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Name:</span>
                                    <p className="font-medium">{selectedDriver.fullName}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Email:</span>
                                    <p className="font-medium">{selectedDriver.email}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Phone:</span>
                                    <p className="font-medium">{selectedDriver.phone || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Location:</span>
                                    <p className="font-medium">{selectedDriver.location}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Vehicle Details */}
                              {selectedDriver.vehicleDetails && (
                                <div>
                                  <h4 className="font-semibold mb-3">Vehicle Information</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Make & Model:</span>
                                      <p className="font-medium">
                                        {selectedDriver.vehicleDetails.make} {selectedDriver.vehicleDetails.model}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Year:</span>
                                      <p className="font-medium">
                                        {selectedDriver.vehicleDetails.year || "Not specified"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Primary Connector:</span>
                                      <p className="font-medium">{selectedDriver.vehicleDetails.primaryConnector}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Adapters:</span>
                                      <p className="font-medium">
                                        {selectedDriver.vehicleDetails.adapters?.length > 0
                                          ? selectedDriver.vehicleDetails.adapters.join(", ")
                                          : "None"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <Separator />

                              {/* Charging Statistics */}
                              <div>
                                <h4 className="font-semibold mb-3">Charging Statistics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {selectedDriver.chargingStats.totalSessions}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Sessions</div>
                                  </div>
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                      {selectedDriver.chargingStats.totalEnergy} kWh
                                    </div>
                                    <div className="text-sm text-gray-600">Energy Consumed</div>
                                  </div>
                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                      DT{selectedDriver.chargingStats.totalSpent}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Spent</div>
                                  </div>
                                  <div className="bg-yellow-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">
                                      {selectedDriver.chargingStats.averageRating}
                                    </div>
                                    <div className="text-sm text-gray-600">Average Rating</div>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                {selectedDriver.status === "active" ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleStatusChange(selectedDriver.id, "suspended")}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend Driver
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleStatusChange(selectedDriver.id, "active")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate Driver
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {driver.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(driver.id, "suspended")}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(driver.id, "active")}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No drivers found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "No drivers have registered yet."}
          </p>
        </div>
      )}

      <AddDriverModal
        open={showAddModal}
        setOpen={setShowAddModal}
        onDriverAdded={handleDriverAdded}
      />
    </div>
  )
}
