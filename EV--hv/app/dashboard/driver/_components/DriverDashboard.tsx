"use client"
import React, { useState } from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Heart,
  AlertTriangle,
  Star,
  User,
  Settings,
  Car,
  CreditCard,
  Bell,
  Shield,
  Edit3,
  Camera,
  MapPin,
  Zap,
  TrendingUp,
} from "lucide-react"
import { CONNECTOR_TYPES, ConnectorType, VehicleDetails, CarOwner } from "../types"

const api = {
  getHistory: async (email: string): Promise<Reservation[]> => {
    return [
      {
        id: "r1",
        stationId: "ChargePoint Central",
        chargerId: "CCS-150kW",
        expiresAt: "2024-08-15T12:00:00Z",
        paymentMethod: "Visa",
        status: "completed",
        cost: 15.75,
        duration: 35,
        energyDelivered: 28.5,
        date: "2024-08-15",
      },
      {
        id: "r2",
        stationId: "Tesla Supercharger",
        chargerId: "Tesla-250kW",
        expiresAt: "2024-08-10T14:30:00Z",
        paymentMethod: "OnSite",
        status: "completed",
        cost: 22.4,
        duration: 42,
        energyDelivered: 35.2,
        date: "2024-08-10",
      },
    ]
  },
  submitReclamation: async (data: Reclamation) => {
    const res = await fetch(`http://localhost:5000/reclamations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to submit reclamation")
    return await res.json()
  },
  postReview: async (stationId: string, review: any) => {
    const res = await fetch(`http://localhost:5000/stations/${stationId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    })
    if (!res.ok) throw new Error("Failed to submit review")
    return await res.json()
  },
  updateProfile: async (userId: string, data: any) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update profile")
    return await res.json()
  },
  getFavorites: async (userId: string): Promise<string[]> => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`)
    if (!res.ok) throw new Error("Failed to fetch favorites")
    return await res.json()
  },
  updateFavorites: async (userId: string, favorites: string[]) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    })
    if (!res.ok) throw new Error("Failed to update favorites")
    return await res.json()
  },
}

export default function DriverDashboard({
  user,
  favorites,
  setFavorites,
  stations = [], // array of station objects passed from parent
}: {
  user: any
  favorites: string[]
  setFavorites: (ids: string[]) => void
  stations?: { _id: string; stationName?: string; address?: any }[]
}) {
  const [history, setHistory] = useState<Reservation[]>([])
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reclamationForm, setReclamationForm] = useState({
    stationId: "",
    title: "",
    category: "General Feedback",
    description: "",
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: "+216 12 345 678",
    location: "Tunis, Tunisia",
  })
  const [vehicleData, setVehicleData] = useState(user.vehicleDetails)
  const [settings, setSettings] = useState({
    notifications: {
      chargingComplete: true,
      reservationReminders: true,
      promotions: false,
      weeklyReports: true,
    },
    privacy: {
      shareLocation: true,
      shareChargingData: false,
      publicProfile: false,
    },
    preferences: {
      language: "en",
      currency: "TND",
      theme: "light",
      autoReserve: false,
    },
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [tempVehicle, setTempVehicle] = useState<VehicleDetails>(
    user?.vehicle || { make: "", model: "", primaryConnector: "CCS", adapters: [] }
  )

  useEffect(() => {
    api.getHistory(user.email).then(setHistory)
    api.getFavorites(user.id).then(setFavorites)
  }, [user.email, user.id])

  const totalSessions = history.length
  const totalCost = history.reduce((sum, session) => sum + (session.cost || 0), 0)
  const totalEnergy = history.reduce((sum, session) => sum + (session.energyDelivered || 0), 0)
  const avgRating = 4.7 // Mock average rating

  async function handleReclamationSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reclamationForm.title || !reclamationForm.description || !reclamationForm.stationId) {
      alert("Please select a station and fill out all fields.")
      return
    }

    try {
      const newReclamation = {
        submittedBy: user.id, // backend expects user id
        relatedStation: reclamationForm.stationId, // station identifier
        category: reclamationForm.category,
        title: reclamationForm.title,
        description: reclamationForm.description,
        status: "Open",
        createdAt: new Date().toISOString(),
      }

      const saved = await api.submitReclamation(newReclamation)
      // append saved reclamation returned by backend (or fallback to local object)
      setReclamations((prev) => [...prev, saved || newReclamation])

      // reset form
      setReclamationForm({ stationId: "", title: "", category: "General Feedback", description: "" })
    } catch (err) {
      console.error("Failed to submit reclamation", err)
      alert("Failed to submit report. Please try again.")
    }
  }

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    api.postReview("station1", {
      user: user.fullName,
      rating: reviewRating,
      text: reviewText,
      date: new Date().toISOString(),
    })
    setReviewText("")
  }

  async function updateVehicle(v: VehicleDetails) {
    try {
      // Persist to backend if endpoint; fallback to localStorage
      localStorage.setItem("driverVehicle", JSON.stringify(v))
      setUser(u => (u ? { ...u, vehicle: v } : u))
      setEditingVehicle(false)
    } catch {}
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <Tabs defaultValue="overview" className="w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("profile")}
            >
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("history")}
            >
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("favorites")}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("support")}
            >
              <AlertTriangle className="w-4 h-4" />
              Support
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-lime-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome back, {user.fullName.split(" ")[0]}!</h2>
                      <p className="text-white/80">
                        You've saved {totalCost.toFixed(2)} TND on {totalSessions} charging sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{totalSessions}</div>
                      <div className="text-white/80">Sessions</div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{totalEnergy.toFixed(1)} kWh</div>
                      <div className="text-sm text-gray-600">Energy Consumed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{totalCost.toFixed(2)} TND</div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{avgRating}</div>
                      <div className="text-sm text-gray-600">Avg Rating</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
                      <div className="text-sm text-gray-600">Favorite Stations</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {history.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Zap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{session.stationId}</div>
                              <div className="text-sm text-gray-600">
                                {session.energyDelivered}kWh • {session.duration}min
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{session.cost} TND</div>
                            <div className="text-sm text-gray-600">{session.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Profile Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {user.fullName.charAt(0)}
                        </div>
                        <Button
                          size="sm"
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{profileData.fullName}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProfile(!editingProfile)}
                            className="flex items-center space-x-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>{editingProfile ? "Cancel" : "Edit"}</span>
                          </Button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{profileData.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4" />
                            <span>
                              {vehicleData.make} {vehicleData.model} ({vehicleData.year})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          disabled={!editingProfile}
                          className={editingProfile ? "" : "bg-gray-50"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={!editingProfile}
                          className={editingProfile ? "" : "bg-gray-50"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          disabled={!editingProfile}
                          className={editingProfile ? "" : "bg-gray-50"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          disabled={!editingProfile}
                          className={editingProfile ? "" : "bg-gray-50"}
                        />
                      </div>
                    </div>
                    {editingProfile && (
                      <div className="flex space-x-3 pt-4">
                        <Button
                          onClick={async () => {
                            await api.updateProfile(user.id, profileData)
                            setEditingProfile(false)
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingProfile(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="w-5 h-5" />
                      <span>Vehicle Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Make</Label>
                        <Input value={vehicleData.make} disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input value={vehicleData.model} disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input value={vehicleData.year} disabled className="bg-gray-50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Connector</Label>
                        <Input value={vehicleData.primaryConnector} disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Charging Speed</Label>
                        <Input value={`${vehicleData.maxChargingSpeed} kW`} disabled className="bg-gray-50" />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      Update Vehicle Information
                    </Button>
                  </CardContent>
                </Card>

                {/* Editable Vehicle Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-700">Vehicle & Connectors</h3>
                    <button
                      className="text-xs text-emerald-600 hover:underline"
                      onClick={() => setEditingVehicle(e => !e)}
                    >
                      {editingVehicle ? "Done" : "Edit"}
                    </button>
                  </div>
                  {!editingVehicle && user?.vehicle && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Primary: {user.vehicle.primaryConnector}</div>
                      <div>Adapters: {user.vehicle.adapters?.length ? user.vehicle.adapters.join(", ") : "None"}</div>
                    </div>
                  )}
                  {editingVehicle && (
                    <div className="space-y-3">
                      <select
                        className="input text-xs"
                        value={tempVehicle.primaryConnector}
                        onChange={e =>
                          setTempVehicle(v => ({ ...v, primaryConnector: e.target.value as ConnectorType }))
                        }
                      >
                        {CONNECTOR_TYPES.map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-1">
                        {CONNECTOR_TYPES.filter(c => c !== tempVehicle.primaryConnector).map(c => {
                          const active = tempVehicle.adapters.includes(c)
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setTempVehicle(v => ({
                                  ...v,
                                  adapters: active
                                    ? v.adapters.filter(a => a !== c)
                                    : [...v.adapters, c],
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] border ${
                                active
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {c}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        className="text-xs bg-emerald-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          await updateVehicle(tempVehicle)
                        }}
                      >
                        Save Vehicle
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Charging Complete</div>
                        <div className="text-sm text-gray-600">Get notified when your charging session is complete</div>
                      </div>
                      <Switch
                        checked={settings.notifications.chargingComplete}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, chargingComplete: checked },
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Reservation Reminders</div>
                        <div className="text-sm text-gray-600">Reminders about upcoming reservations</div>
                      </div>
                      <Switch
                        checked={settings.notifications.reservationReminders}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, reservationReminders: checked },
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Promotions & Offers</div>
                        <div className="text-sm text-gray-600">Special deals and promotional offers</div>
                      </div>
                      <Switch
                        checked={settings.notifications.promotions}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, promotions: checked },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Privacy & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Location</div>
                        <div className="text-sm text-gray-600">Allow location sharing for better recommendations</div>
                      </div>
                      <Switch
                        checked={settings.privacy.shareLocation}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, shareLocation: checked },
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Charging Data</div>
                        <div className="text-sm text-gray-600">Help improve our service with anonymous usage data</div>
                      </div>
                      <Switch
                        checked={settings.privacy.shareChargingData}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, shareChargingData: checked },
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full bg-transparent">
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={settings.preferences.language}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={settings.preferences.currency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TND">TND (Tunisian Dinar)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                            <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Charging History</h3>
                </div>
                {history.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No charging history yet</p>
                      <p className="text-sm text-gray-500 mt-2">Your charging sessions will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {history.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{session.stationId}</div>
                              <div className="text-sm text-gray-600">{session.expiresAt}</div>
                            </div>
                            <Badge variant="secondary">{session.paymentMethod}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-800">Favorite Stations</h3>
                </div>
                {favorites.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No favorite stations yet</p>
                      <p className="text-sm text-gray-500 mt-2">Tap the heart icon on stations to save them here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-gray-600">
                    {favorites.map((stationId) => (
                      <div key={stationId} className="py-1">
                        {stationId}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-800">Report an Issue</h3>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <form onSubmit={handleReclamationSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="station-select">Station</Label>
                        <Select
                          value={reclamationForm.stationId}
                          onValueChange={(value) => setReclamationForm({ ...reclamationForm, stationId: value })}
                        >
                          <SelectTrigger id="station-select">
                            <SelectValue placeholder="Select a station to report" />
                          </SelectTrigger>
                          <SelectContent>
                            {history.map((session) => (
                              <SelectItem key={session.id} value={session.stationId}>
                                {session.stationId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="issue-title">Title</Label>
                          <Input
                            id="issue-title"
                            value={reclamationForm.title}
                            onChange={(e) => setReclamationForm({ ...reclamationForm, title: e.target.value })}
                            placeholder="e.g., Charger not working"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="issue-category">Category</Label>
                          <Select
                            value={reclamationForm.category}
                            onValueChange={(value) => setReclamationForm({ ...reclamationForm, category: value })}
                          >
                            <SelectTrigger id="issue-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Incorrect Station Info">Incorrect Info</SelectItem>
                              <SelectItem value="Broken Charger">Broken Charger</SelectItem>
                              <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                              <SelectItem value="General Feedback">General Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="issue-description">Describe the issue</Label>
                        <textarea
                          id="issue-description"
                          value={reclamationForm.description}
                          onChange={(e) => setReclamationForm({ ...reclamationForm, description: e.target.value })}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                          rows={4}
                          placeholder="Please provide details about the issue..."
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Submit Report
                      </Button>
                    </form>

                    {reclamations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-gray-700">Submitted Issues</h4>
                        {reclamations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-gray-600 border-b py-1">
                            {rec.description} <span className="text-xs text-gray-400">({rec.status})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}
